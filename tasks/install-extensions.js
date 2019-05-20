var path = require('path');
var getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const execSync = require('child_process').execSync;
const directories = getExtensionDirectoriesSync();

directories.forEach((extensionName) => {
    const extensionPath = path.resolve(`${__dirname}/../scripts/extensions/${extensionName}`);

    execSync(`cd ${extensionPath} && npm install && npm run compile`);
});

