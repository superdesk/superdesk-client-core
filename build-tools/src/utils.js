const fs = require('fs');

function isDirectory(path) {
    try {
        return fs.lstatSync(path).isDirectory();
    } catch (e) {
        return false;
    }
}

module.exports = {
    isDirectory,
};