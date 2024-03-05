/**
 * Compile extensions in order to check whether API changes
 * are not breaking existing extensions.
 */

const execSync = require('child_process').execSync;
const fs = require('fs');

function getDirectories(path) {
    return fs.readdirSync(path).filter((file) => {
        return fs.statSync(path + '/' + file).isDirectory();
    });
}

const allExtensions = 'scripts/extensions';

getDirectories(allExtensions).forEach((extensionDir) => {
    execSync(
        `cd ${allExtensions}/${extensionDir} && npm ci && npm run compile`,
        {stdio: 'inherit'}
    );
});