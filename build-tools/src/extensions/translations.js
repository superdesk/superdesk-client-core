/* eslint-disable max-depth */

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const getExtensionDirectoriesSync = require('./get-extension-directories-sync');
const {isDirectory} = require('../utils');
const compileTranslationsPoToJson = require('../po-to-json/index');

function mergeTranslationsFromExtensions(clientDir) {
    const translationsJsonTemp = path.join(clientDir, 'translations-json-temp');
    const mainTranslationsDir = path.join(clientDir, 'dist/languages');

    const existingTranslationFiles = new Set(
        fs.readdirSync(mainTranslationsDir)
            .filter((path) => !isDirectory(path))
            .map((filename) => _.trimEnd(filename, '.json'))
    );

    const directoriesWithTranslations = getExtensionDirectoriesSync(clientDir)
        .map(
            ({extensionRootPath}) => {
                const package = JSON.parse(fs.readFileSync(path.join(extensionRootPath, 'package.json'), 'utf-8'));
                const translationsPath = _.get(package, 'superdeskExtension.translations-directory');

                if (translationsPath == null) {
                    return null;
                }

                const directoryPath = path.join(extensionRootPath, translationsPath);

                if (fs.existsSync(directoryPath) !== true || isDirectory(directoryPath) !== true) {
                    return null;
                } else {
                    return directoryPath;
                }
            }
        )
        .filter((x) => x != null);

    for (const dir of directoriesWithTranslations) {
        compileTranslationsPoToJson(dir, translationsJsonTemp);

        // iterate over language files like fr_CA.json
        for (const fileNameMaybe of fs.readdirSync(translationsJsonTemp)) {
            if (isDirectory(fileNameMaybe)) {
                break;
            }

            const filename = fileNameMaybe;
            const filePathAbs = path.join(translationsJsonTemp, filename);
            const language = _.trimEnd(filename, '.json');

            if (existingTranslationFiles.has(language)) {
                const jsonSrc = JSON.parse(fs.readFileSync(filePathAbs, 'utf-8'));
                const destFilePath = path.join(mainTranslationsDir, language + '.json');
                const jsonDest = JSON.parse(fs.readFileSync(destFilePath, 'utf-8'));

                for (const key in jsonSrc) {
                    if (key === '' || jsonDest[key] != null) {
                        continue; // do not overwrite meta info or existing translations
                    }

                    jsonDest[key] = jsonSrc[key];
                }

                fs.writeFileSync(destFilePath, JSON.stringify(jsonDest), 'utf-8');
            } else {
                fs.copyFileSync(filePathAbs, `${mainTranslationsDir}/${language}.json`);
            }
        }
    }

    if (fs.existsSync(translationsJsonTemp)) {
        fs.rmdirSync(translationsJsonTemp, {recursive: true});
    }
}

module.exports = {
    mergeTranslationsFromExtensions,
};
