/* eslint-disable comma-dangle */

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const {trimEnd} = _;

function getAbsoluteModuleDirectory(clientPath, modulePathRelative) {
    // if module path starts with a dot, don't look into node_modules
    if (modulePathRelative.startsWith('.')) {
        return path.join(clientPath, modulePathRelative);
    } else {
        return path.join(
            require.resolve(path.join(`${clientPath}/node_modules`, modulePathRelative, 'package.json')),
            '../'
        );
    }
}

function getPaths(clientPath, extensionRootRelative) {
    const extensionRootPath = trimEnd(
        getAbsoluteModuleDirectory(clientPath, extensionRootRelative),
        '/',
    );
    const extensionSrcPath = trimEnd(
        path.join(extensionRootPath, 'src'),
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

function getIndexFilePath(clientPath, indexFilePathRelative) {
    const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

    // paths in `importApps` are relative client/dist
    const base = path.join(clientPath, 'dist', indexFilePathRelative);

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

function getExtensionDirectoriesSync(clientPath) {
    const config = require(path.join(clientPath, 'superdesk.config.js'))();

    const paths = config.importApps || config.apps || [];

    // paths in `importApps` are relative client/dist
    const indexFilePathRelative = paths.find((path) => path.startsWith('../'));

    if (indexFilePathRelative == null) {
        return [];
    }

    var indexFile = fs.readFileSync(getIndexFilePath(clientPath, indexFilePathRelative), 'utf-8');

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
    var extensionRegistrationPattern = /id:\W*'(.*)',\W*load:\W*import\('(.+?)'/g;

    const matches = [];

    while ((_match = extensionRegistrationPattern.exec(indexFile)) !== null) {
        const extensionName = _match[1];
        const {extensionRootPath, extensionSrcPath, extensionCssFilePath} = getPaths(clientPath, _match[2]);

        matches.push({extensionName, extensionRootPath, extensionSrcPath, extensionCssFilePath});
    }

    return matches;
}

module.exports = getExtensionDirectoriesSync;