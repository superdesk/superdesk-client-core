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
        'npm run e2e-compile',
        {stdio: 'inherit'},
    );

    directories.forEach(({extensionRootPath}) => {
        try {
            execSync(
                `cd ${extensionRootPath} && npm run compile-e2e`,
                {stdio: 'inherit'},
            );
        } catch (e) {
            console.error('Failed to compile extensions e2e tests');
            console.error(e.toString());
        }
    });
}
