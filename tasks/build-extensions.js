var glob = require('glob');
var path = require('path');
var execSync = require('child_process').execSync;

const extensions = glob.sync(path.join(__dirname, '..', 'scripts', 'extensions', '*', 'package.json'), {});

const status = extensions.reduce((returnCode, extension) => {
    const extensionDir = path.dirname(extension);

    try {
        execSync('npm ci && npm run compile --if-present', {cwd: extensionDir, stdio: 'inherit'});
        return returnCode;
    } catch (error) {
        console.error('Error building extension', extensionDir);
        return returnCode + 1;
    }
}, 0);

process.exit(status);