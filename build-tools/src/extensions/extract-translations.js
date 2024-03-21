const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const {GettextExtractor, JsExtractors} = require('gettext-extractor');
const extractor = new GettextExtractor();

function extractTranslations(clientDir) {
    for (const {extensionRootPath} of getExtensionDirectoriesSync(clientDir)) {
        const package = JSON.parse(fs.readFileSync(path.join(extensionRootPath, 'package.json'), 'utf-8'));
        const paths = _.get(package, 'superdeskExtension.translations-extract-paths');

        if (paths == null || !Array.isArray(paths)) {
            continue;
        }

        const pathsAbsolute = paths.map((p) => path.join(extensionRootPath, p));

        const jsParser = extractor
            .createJsParser([
                JsExtractors.callExpression('gettext', {
                    arguments: {
                        text: 0,
                        context: 1,
                    },
                }),
                JsExtractors.callExpression('gettextPlural', {
                    arguments: {
                        text: 1,
                        textPlural: 2,
                        context: 3,
                    },
                }),
            ]);

        for (const _path of pathsAbsolute) {
            jsParser.parseFilesGlob(`${_path}/**/*.@(ts|js|tsx|jsx)`);
        }

        extractor.savePotFile(`${extensionRootPath}/translations.generated.pot`);
    }
}

module.exports = {
    extractTranslations: extractTranslations,
};
