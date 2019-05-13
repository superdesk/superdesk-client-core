var fs = require('fs');
var path = require('path');
var lstatSync = fs.lstatSync;

function getExtensionDirectoriesSync() {
    return fs.readdirSync(path.resolve(`${__dirname}/../scripts/extensions`)).filter(
        (name) => lstatSync(path.resolve(`${__dirname}/../scripts/extensions/${name}`)).isDirectory()
    );
}

module.exports = getExtensionDirectoriesSync;