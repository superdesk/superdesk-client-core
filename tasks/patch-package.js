const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

function removeNonEmptyDirectorySync(path) {
    execSync(`rm -rf ${path}`, {stdio: 'inherit'});
}

function copyFolderSync(from, to) {
    fs.mkdirSync(to);
    fs.readdirSync(from).forEach((element) => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

let copied = false;

const clientCoreRoot = path.join(__dirname, '../');
const workingDirectory = process.env.INIT_CW || process.cwd(); // https://github.com/npm/npm/issues/16990

// If node_modules exists in `workingDirectory` set it as mainDirectory where patches will be put
const mainDirectory = fs.existsSync(path.join(workingDirectory, 'node_modules'))
    ? workingDirectory
    : clientCoreRoot;

const patchesCurrentDir = path.join(clientCoreRoot, 'patches');
const patchesDestinationDir = path.join(mainDirectory, 'patches');

if (patchesCurrentDir !== patchesDestinationDir) {
    if (fs.existsSync(patchesDestinationDir)) {
        removeNonEmptyDirectorySync(patchesDestinationDir);
    }
    copyFolderSync(patchesCurrentDir, patchesDestinationDir);
    copied = true;
}

execSync(
    `cd ${mainDirectory} && npx patch-package`,
    {stdio: 'inherit'}
);

if (copied) { // remove copied directory from a parent project after patching
    removeNonEmptyDirectorySync(patchesDestinationDir);
}
