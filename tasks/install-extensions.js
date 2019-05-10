var fs = require('fs');
var path = require('path');

const execSync = require('child_process').execSync;

var directories = fs.readdirSync(path.resolve(`${__dirname}/../scripts/extensions`));

directories.forEach((extensionName) => {
    const extensionPath = path.resolve(`${__dirname}/../scripts/extensions/${extensionName}`);

    execSync(`cd ${extensionPath} && npm install && npm run compile`);
});

