var fs = require('fs');
var path = require('path');
var lstatSync = fs.lstatSync;

const execSync = require('child_process').execSync;

var directories = fs.readdirSync(path.resolve(`${__dirname}/../scripts/extensions`)).filter((name) => {
    return lstatSync(path.resolve(`${__dirname}/../scripts/extensions/${name}`)).isDirectory();
});

directories.forEach((extensionName) => {
    const extensionPath = path.resolve(`${__dirname}/../scripts/extensions/${extensionName}`);

    execSync(`cd ${extensionPath} && npm install && npm run compile`);
});

