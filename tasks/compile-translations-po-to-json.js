var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;
var _ = require('lodash');

function isDirectory(path) {
    try {
        return fs.lstatSync(path).isDirectory();
    } catch (e) {
        return false;
    }
}

/*

It iterates all user supplied translations and removes placeholders found in the original string.
If there are any additional placeholders left, the translation is considered invalid. It is whitespace sensitive.

For example: `{"Update {{sequence}}": "Mettre à jour {{séquence}}"}`

The original placeholder is `{{sequence}}`. It would be removed from the translation, but it doesn't contain it.
An additional placeholder that was not in the original string is found - `{{séquence}}` and because of this
the translation is considered invalid and will not be outputted to JSON.

*/

function removeInvalidTranslations(grunt, jsonFilePath, filename) {
    var translations = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

    const validTranslations = Object.keys(translations).filter((key) => {
        if (key === '') { // metadata object added by gettext.js
            return true;
        }

        const placeHolders = key.match(/{{.+?}}/g);

        return (Array.isArray(translations[key]) ? translations[key] : [translations[key]]).every(
            (translatedString) => {
                const translatedStringWithoutPlaceholders = (placeHolders || []).reduce((acc, item) => {
                    return acc.replace(item, '');
                }, translatedString);

                const valid = translatedStringWithoutPlaceholders.match(/{{.+?}}/) == null;

                if (valid !== true) {
                    grunt.log.error(
                        `Invalid translation string encountered in "${filename}"`
                        + ` and will be ommited from JSON: "${translatedString}"`
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

function compileTranslationsPoToJson(grunt) {
    const currentDir = process.cwd();
    const clientCoreRoot = path.join(__dirname, '../');
    const translationsPoDir = path.join(clientCoreRoot, 'po');
    const translationsJsonDir = path.join(currentDir, 'dist', 'languages');

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

        var po2json = path.join(clientCoreRoot, 'node_modules/gettext.js/bin/po2json');
        var poFile = `${translationsPoDir}/${filename}`;
        var jsonFile = `${translationsJsonDir}/${filename.replace('.po', '.json')}`;

        execSync(
            `${po2json} ${poFile} ${jsonFile}`,
            {stdio: 'inherit'}
        );

        removeInvalidTranslations(grunt, jsonFile, filename);
    });
}

module.exports = compileTranslationsPoToJson;