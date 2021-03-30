/* eslint-disable comma-dangle */

var fs = require('fs');
var path = require('path');
var getConfig = require('./options/get-config').getConfig;

function getPaths(distRelative) {
    const from = 0;
    const to = distRelative.lastIndexOf('/dist/');

    const extensionRootPath = path.join(process.cwd(), 'node_modules', distRelative.slice(from, to));
    const extensionSrcPath = path.join(extensionRootPath, 'src');
    const extensionDistPath = path.join(process.cwd(), 'node_modules', distRelative);
    const extensionCssFilePath = path.join(extensionRootPath, 'src/index.css');

    return {
        extensionRootPath,
        extensionSrcPath,
        extensionDistPath,
        extensionCssFilePath,
    };
}

function getExtensionDirectoriesSync() {
    const config = getConfig();
    const paths = config.importApps || config.apps || [];

    // paths in `importApps` are relative client/dist
    const indexFilePathRelative = paths.find((path) => path.startsWith('../'));

    if (indexFilePathRelative == null) {
        return [];
    }

    const indexFilePathAbsolute = require.resolve(path.join(process.cwd(), 'dist', indexFilePathRelative));

    var indexFile = fs.readFileSync(indexFilePathAbsolute, 'utf-8');

    /**
     * Regex for extracting extension id and import path(there is a capturing group for each)
     * from index file where extensions are registered.
     *
     * Here's a sample of extension registration code that the regex is targeting:
        {
            id: 'planning-extension',
            load: () =>
                import('superdesk-planning/client/planning-extension/dist/planning-extension/src/extension')
                    .then((res) => res.default),
        }
     */
    var extensionRegistrationPattern = /id:\W*'(.*)',\W*load:\W*import\('(.*\/dist.+)'/g;

    const matches = [];

    while ((_match = extensionRegistrationPattern.exec(indexFile)) !== null) {
        const extensionName = _match[1];
        const {extensionRootPath, extensionSrcPath, extensionDistPath, extensionCssFilePath} = getPaths(_match[2]);

        matches.push({extensionName, extensionRootPath, extensionSrcPath, extensionDistPath, extensionCssFilePath});
    }

    return matches;
}

module.exports = getExtensionDirectoriesSync;