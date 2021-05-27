var fs = require('fs');
var path = require('path');
var getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const execSync = require('child_process').execSync;

module.exports = function installExtensions(clientDir) {
    const directories = getExtensionDirectoriesSync(clientDir);

    const apiDefinitionsSrcPath = require.resolve(
        path.join(clientDir, 'node_modules/superdesk-core/scripts/core/superdesk-api.d.ts')
    );

    directories.forEach(({extensionRootPath, extensionSrcPath}) => {
        // if src dir doesn't exist, assume that the extension is already built (e.g. when installed from npm)
        if (fs.existsSync(extensionSrcPath)) {
            const apiDefinitionsDestPath = path.join(extensionRootPath, 'src/typings/refs.d.ts');

            /**
             * Extensions that are located outside of superdesk-client-core repository,
             * can't reference API definitions relatively. They can in development,
             * but if the extension is installed using build-tools rather than from npm,
             * that relative path is no longer correct, so it's overwritten here.
             */
            if (fs.existsSync(apiDefinitionsDestPath)) {
                fs.writeFileSync(
                    apiDefinitionsDestPath,
                    `/// <reference path='${apiDefinitionsSrcPath}' />`,
                    'utf-8'
                );
            }

            execSync(
                `cd ${extensionRootPath} && npm install --no-audit && npm run compile --if-present`,
                {stdio: 'inherit'}
            );
        }
    });
};
