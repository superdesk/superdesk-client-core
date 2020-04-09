const path = require('path');
const execSync = require('child_process').execSync;
const getExtensionDirectoriesSync = require('./get-extension-directories-sync');

const directories = getExtensionDirectoriesSync();

// Only compile end-to-end tests if protractor is installed
// i.e. if devDependencies are installed
let protractorInstalled;

try {
    require('protractor');
    protractorInstalled = true;
} catch (e) {
    protractorInstalled = false;
}

if (protractorInstalled) {
    execSync(
        'npm run compile-end-to-end-tests',
        {stdio: 'inherit'}
    );

    directories.forEach(({extensionName, absolutePath}) => {
        const extensionPath = path.resolve(`${absolutePath}/${extensionName}`);

        try {
            execSync(
                `cd ${extensionPath} && npm run compile-e2e`,
                {stdio: 'inherit'}
            );
        } catch (e) {
            console.error('Failed to compile extensions e2e tests');
            console.error(e.toString());
        }
    });
}
