const execSync = require('child_process').execSync;

// Only compile end-to-end tests if protractor is installed
// i.e. if devDependencies are installed
var protractorInstalled;

try {
    require('protractor');
    protractorInstalled = true;
} catch (e) {
    protractorInstalled = false;
}

if (protractorInstalled) {
    execSync('npm run compile-end-to-end-tests');
}
