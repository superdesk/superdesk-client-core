const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

function directoryName(path) {
    const parts = path.split('/');

    return parts[parts.length - 2];
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

const clientCoreRoot = path.join(__dirname, '../');
const maybeParentModulePath = path.join(clientCoreRoot, '../../');
const mainDirectory = directoryName(maybeParentModulePath) === 'client' ? maybeParentModulePath : clientCoreRoot;

const patchesCurrentDir = path.join(clientCoreRoot, 'patches');
const patchesDestinationDir = path.join(mainDirectory, 'patches');

if (patchesCurrentDir !== patchesDestinationDir) {
    fs.rmdirSync(patchesDestinationDir, {recursive: true});
    copyFolderSync(patchesCurrentDir, patchesDestinationDir);
}

execSync(
    `cd ${mainDirectory} && npx patch-package`,
    {stdio: 'inherit'}
);
