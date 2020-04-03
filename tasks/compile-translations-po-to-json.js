var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;
var _ = require('lodash');

function isDirectory(path) {
    try {
        return fs.lstatSync(path).isDirectory();
    } catch (e) {
        return false;
    }
}

function compileTranslationsPoToJson(grunt) {
    const currentDir = process.cwd();
    const clientCoreRoot = path.join(__dirname, '../');
    const translationsPoDir = path.join(clientCoreRoot, 'po');
    const translationsJsonDir = path.join(currentDir, 'dist', 'languages');
    const nodeModulesPath = path.join(currentDir, 'node_modules');

    if (fs.existsSync(translationsJsonDir) !== true) {
        fs.mkdirSync(translationsJsonDir);
    }

    var files = fs.readdirSync(translationsPoDir);

    files.forEach((filename) => {
        if (isDirectory(path.join(translationsPoDir, filename))) {
            return;
        }

        if (_.endsWith(filename, '.po') !== true) {
            return;
        }

        var po2json = `${nodeModulesPath}/gettext.js/bin/po2json`;
        var poFile = `${translationsPoDir}/${filename}`;
        var jsonFile = `${translationsJsonDir}/${filename.replace('.po', '.json')}`;

        execSync(
            `${po2json} ${poFile} ${jsonFile}`,
            {stdio: 'inherit'}
        );
    });
}

module.exports = compileTranslationsPoToJson;