var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;
var _ = require('lodash');
const {isDirectory} = require('../utils');

function getModuleDir(moduleName) {
    return path.join(require.resolve(moduleName + '/package.json'), '../');
}

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

function removeInvalidTranslations(jsonFilePath, filename) {
    var translations = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

    const KEY_REGEX = /{{ ?(.+?) ?}}/g;

    const validTranslations = Object.keys(translations).filter((key) => {
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

    fs.writeFileSync(jsonFilePath, JSON.stringify(validTranslations), 'utf8');
}

function compileTranslationsPoToJson(translationsPoDir, translationsJsonDir) {
    if (fs.existsSync(translationsJsonDir) !== true) {
        fs.mkdirSync(translationsJsonDir);
    }

    var files = fs.readdirSync(translationsPoDir);

    files.forEach((filename) => {
        if (isDirectory(path.join(translationsPoDir, filename))) {
            return;
        }

        if (_.endsWith(filename, '.po') !== true) {
            return;
        }

        var po2json = `${getModuleDir('gettext.js')}/bin/po2json`;
        var poFile = `${translationsPoDir}/${filename}`;
        var jsonFile = `${translationsJsonDir}/${filename.replace('.po', '.json')}`;

        execSync(
            `${po2json} ${poFile} ${jsonFile}`,
            {stdio: 'inherit'}
        );

        removeInvalidTranslations(jsonFile, filename);
    });
}

module.exports = compileTranslationsPoToJson;