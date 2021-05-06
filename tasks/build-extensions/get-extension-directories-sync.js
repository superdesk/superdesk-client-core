/* eslint-disable comma-dangle */

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const {trimEnd} = _;

function getAbsoluteModuleDirectory(modulePathRelative) {
    return path.join(require.resolve(path.join(modulePathRelative, 'package.json')), '../');
}

function getPaths(distRelative) {
    const extensionRootPath = trimEnd(
        getAbsoluteModuleDirectory(distRelative.slice(0, distRelative.indexOf('/dist/'))),
        '/',
    );
    const extensionSrcPath = trimEnd(
        path.join(extensionRootPath, 'src'),
        '/',
    );
    const extensionDistPath = trimEnd(
        path.join(require.resolve(distRelative), '../'),
        '/',
    );

    const cssInDist = trimEnd(
        path.join(extensionRootPath, 'dist/index.css'),
        '/',
    );
    const cssInSrc = trimEnd(
        path.join(extensionRootPath, 'src/index.css'),
        '/',
    );

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
    const base = path.join('dist', indexFilePathRelative);

    const maybeExtension = getFileExtension(base);

    if (maybeExtension != null && fileExtensions.includes(maybeExtension)) {
        return base;
    }

    for (const ext of fileExtensions) {
        const file = base + ext;

        if (fs.existsSync(file)) {
            return file;
        }

        const indexFileInDirectory = base + '/index' + ext;

        if (fs.existsSync(indexFileInDirectory)) {
            return indexFileInDirectory;
        }
    }

    throw new Error('Index file not found');
}

function getExtensionDirectoriesSync() {
    const config = require('../superdesk.config.js')();

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