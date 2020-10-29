var path = require('path');
var getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const execSync = require('child_process').execSync;
const directories = getExtensionDirectoriesSync();

directories.forEach(({extensionName, absolutePath}) => {
    const extensionPath = path.resolve(`${absolutePath}/${extensionName}`);

    execSync(
        `cd ${extensionPath} && npm install --no-audit && npm run compile --if-present`,
        {stdio: 'inherit'}
    );
});

