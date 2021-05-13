var fs = require('fs');
var getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const execSync = require('child_process').execSync;
const directories = getExtensionDirectoriesSync();

directories.forEach(({extensionRootPath, extensionSrcPath}) => {
    if (fs.existsSync(extensionSrcPath)) { // if src dir doesn't exist, assume that the extension is already build
        execSync(
            `cd ${extensionRootPath} && npm install --no-audit && npm run compile --if-present`,
            {stdio: 'inherit'}
        );
    }
});

