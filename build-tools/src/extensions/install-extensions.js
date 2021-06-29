var fs = require('fs');
var path = require('path');
var glob = require('glob');
var _ = require('lodash');
var getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const execSync = require('child_process').execSync;

/**
 * When TypeScript is compiling an extension,
 * the directory structure in resulting dist folder is sometimes different,
 * even when the same files are used.
 * The main file sometimes ends up in dist/extension.js
 * and other times in dist/planning-extension/src/extension.js
 * The only difference is the location of the extension.
 * If it's inside node_modules, extra directories are not getting generated.
 */
function correctMainPathInPackageJson(extensionRootPath) {
    const packageJsonPath = path.join(extensionRootPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const mainFile = path.join(extensionRootPath, packageJson.main);

    if (fs.existsSync(mainFile) !== true) {
        const result = glob.sync(`${path.join(extensionRootPath, 'dist')}/**/extension.js`, {});

        if (result != null && result[0] != null) {
            const relativeToPackage = _.trimStart(
                result[0].replace(extensionRootPath, ''),
                '/'
            );

            const packageJsonUpdated = {
                ...packageJson,
                main: relativeToPackage,
            };

            fs.writeFileSync(
                packageJsonPath,
                JSON.stringify(packageJsonUpdated),
                'utf-8'
            );
        }
    }
}


/**
 * Extensions that are located outside of superdesk-client-core repository,
 * can't reference API definitions relatively. They can in development,
 * but if the extension is installed using build-tools rather than from npm,
 * that relative path is no longer correct, so it's overwritten here.
 */
function correctApiDefinitionsPath(extensionRootPath, clientDir) {
    const apiDefinitionsDestDir = path.join(extensionRootPath, 'src/typings');
    const apiDefinitionsDestPath = path.join(extensionRootPath, 'src/typings/refs.d.ts');

    if (fs.existsSync(apiDefinitionsDestPath) !== true) {
        return;
    }

    const definitionsFileContents = fs.readFileSync(apiDefinitionsDestPath, 'utf-8');
    const referencePath = definitionsFileContents.match(/reference path=("|')(.+?)("|')/)[2];
    const definitionsExistAtSpecifiedPath = fs.existsSync(path.join(apiDefinitionsDestDir, referencePath));

    if (definitionsExistAtSpecifiedPath) {
        return;
    }

    const apiDefinitionsSrcPath = require.resolve(
        path.join(clientDir, 'node_modules/superdesk-core/scripts/core/superdesk-api.d.ts')
    );

    fs.writeFileSync(
        apiDefinitionsDestPath,
        `/// <reference path='${apiDefinitionsSrcPath}' />`,
        'utf-8'
    );
}

module.exports = function installExtensions(clientDir) {
    const directories = getExtensionDirectoriesSync(clientDir);

    directories.forEach(({extensionRootPath, extensionSrcPath}) => {
        // if src dir doesn't exist, assume that the extension is already built (e.g. when installed from npm)
        if (fs.existsSync(extensionSrcPath)) {
            correctApiDefinitionsPath(extensionRootPath, clientDir);

            execSync(
                `cd ${extensionRootPath} && npm install --no-audit && npm run compile --if-present`,
                {stdio: 'inherit'}
            );

            correctMainPathInPackageJson(extensionRootPath);
        }
    });
};
