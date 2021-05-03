/* eslint-disable comma-dangle */

var fs = require('fs');
var path = require('path');

function getClientDir() {
    try {
        const packageJsonLocation = require.resolve('superdesk-core/package.json');
        const clientCoreRoot = path.join(packageJsonLocation, '../');

        return clientCoreRoot;
    } catch {
        return path.join(__dirname, '../'); // not installed as a module
    }
}

function getPaths(distRelative) {
    const from = 0;
    const to = distRelative.lastIndexOf('/dist/');

    const extensionRootPath = path.join(getClientDir(), 'node_modules', distRelative.slice(from, to));
    const extensionSrcPath = path.join(extensionRootPath, 'src');
    const extensionDistPath = path.join(getClientDir(), 'node_modules', distRelative);

    const cssInDist = path.join(extensionRootPath, 'dist/index.css');
    const cssInSrc = path.join(extensionRootPath, 'src/index.css');

    const extensionCssFilePath = fs.existsSync(cssInDist) ? cssInDist : cssInSrc;

    return {
        extensionRootPath,
        extensionSrcPath,
        extensionDistPath,
        extensionCssFilePath,
    };
}

function getFileExtension(path) {
    const lastDotAt = path.lastIndexOf('.');

    if (lastDotAt < 0) {
        return null;
    } else {
        return path.slice(lastDotAt);
    }
}

function getIndexFilePath(indexFilePathRelative) {
    const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

    // paths in `importApps` are relative client/dist
    const base = path.join(getClientDir(), 'dist', indexFilePathRelative);

    const maybeExtension = getFileExtension(base);

    if (maybeExtension != null && fileExtensions.includes(maybeExtension)) {
        return base;
    }

    for (const ext of fileExtensions) {
        const filePath = path.join(base, `index${ext}`);

        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }

    throw new Error('Index file not found');
}

function getExtensionDirectoriesSync() {
    const config = require(path.join(getClientDir(), 'superdesk.config.js'))();

    const paths = config.importApps || config.apps || [];

    // paths in `importApps` are relative client/dist
    const indexFilePathRelative = paths.find((path) => path.startsWith('../'));

    if (indexFilePathRelative == null) {
        return [];
    }

    var indexFile = fs.readFileSync(getIndexFilePath(indexFilePathRelative), 'utf-8');

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