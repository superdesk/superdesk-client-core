var path = require('path');
var getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const execSync = require('child_process').execSync;
const directories = getExtensionDirectoriesSync();

directories.forEach(({extensionRootPath}) => {
    execSync(
        `cd ${extensionRootPath} && npm install --no-audit && npm run compile --if-present`,
        {stdio: 'inherit'}
    );
});

