/* eslint-disable comma-dangle */

var fs = require('fs');
var path = require('path');
var flatMap = require('lodash/flatMap');

function getExtensionDirectoriesSync() {
    return flatMap([
        '../scripts/extensions', // extensions from core
        '../../../extensions', // extensions from parent repository
    ], (relativePath) => {
        const absolutePath = path.resolve(__dirname + '/' + relativePath);

        return (fs.existsSync(absolutePath) ? fs.readdirSync(absolutePath) : [])
            .map((extensionName) => ({extensionName, relativePath, absolutePath}))
            .filter(
                ({absolutePath, extensionName}) => fs.existsSync(path.join(absolutePath, extensionName, 'package.json'))
            );
    });
}

module.exports = getExtensionDirectoriesSync;