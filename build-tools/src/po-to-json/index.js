var fs = require('fs');
var path = require('path');
const {isDirectory} = require('../utils');

function getModuleDir(moduleName) {
    return path.join(require.resolve(moduleName + '/package.json'), '../');
}

// po2json is a dependency of gettext.js; resolve it from there so it's found
// no matter where build-tools itself is installed
const po2json = require(require.resolve('po2json', {paths: [getModuleDir('gettext.js')]}));

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function regexMatchAll(regex, string) {
    const matches = [];
    let match;

    while ((match = regex.exec(string)) !== null) {
        matches.push(match);
    }

    return matches;
}

/*

It iterates all user supplied translations and removes placeholders found in the original string.
If there are any additional placeholders left, the translation is considered invalid. It is whitespace sensitive.

For example: `{"Update {{sequence}}": "Mettre à jour {{séquence}}"}`

The original placeholder is `{{sequence}}`. It would be removed from the translation, but it doesn't contain it.
An additional placeholder that was not in the original string is found - `{{séquence}}` and because of this
the translation is considered invalid and will not be outputted to JSON.

*/

function removeInvalidTranslations(translations, filename) {
    const KEY_REGEX = /{{ ?(.+?) ?}}/g;

    return Object.keys(translations).filter((key) => {
        if (key === '') { // metadata object added by gettext.js
            return true;
        }

        const placeHolders = regexMatchAll(KEY_REGEX, key);

        return (Array.isArray(translations[key]) ? translations[key] : [translations[key]]).every(
            (translatedString) => {
                const translatedStringWithoutPlaceholders = placeHolders.reduce((acc, item) => {
                    const regex = RegExp(`{{ ?${escapeRegExp(item[1])} ?}}`);

                    return acc.replace(regex, '');
                }, translatedString);

                const valid = translatedStringWithoutPlaceholders.match(/{{.+?}}/) == null;

                if (valid !== true) {
                    console.error(
                        `Invalid translation string encountered in "${filename}"`
                        + ` and will be ommited from JSON: "${translatedString}"`
                        + ` for key: "${key}"`
                    );
                }

                return valid;
            }
        );
    }).reduce((acc, key) => {
        acc[key] = translations[key];

        return acc;
    }, {});
}

// Mirrors gettext.js's bin/po2json output: keep only language and plural-forms
// from the po headers and drop untranslated keys.
function parsePoFile(poFile) {
    const jsonData = po2json.parse(fs.readFileSync(poFile));
    const json = {};

    for (const key of Object.keys(jsonData)) {
        if (key === '') {
            json[''] = {
                'language': jsonData['']['language'],
                'plural-forms': jsonData['']['plural-forms'],
            };

            continue;
        }

        if (jsonData[key][1] !== '') {
            json[key] = jsonData[key].length === 2 ? jsonData[key][1] : jsonData[key].slice(1);
        }
    }

    return json;
}

function compileTranslationsPoToJson(translationsPoDir, translationsJsonDir) {
    if (fs.existsSync(translationsJsonDir) !== true) {
        fs.mkdirSync(translationsJsonDir, {recursive: true});
    }

    var files = fs.readdirSync(translationsPoDir).filter((filename) =>
        filename.endsWith('.po') && isDirectory(path.join(translationsPoDir, filename)) !== true
    );

    files.forEach((filename) => {
        var translations = parsePoFile(path.join(translationsPoDir, filename));
        var validTranslations = removeInvalidTranslations(translations, filename);

        fs.writeFileSync(
            path.join(translationsJsonDir, filename.replace('.po', '.json')),
            JSON.stringify(validTranslations),
            'utf8'
        );
    });

    console.info(`Compiled ${files.length} translation file(s) to ${translationsJsonDir}`);
}

module.exports = compileTranslationsPoToJson;
