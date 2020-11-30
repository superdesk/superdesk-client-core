const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

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

const currentDir = process.cwd();
const clientCoreRoot = path.join(__dirname, '../');
const patchesCurrentDir = path.join(clientCoreRoot, 'patches');
const patchesDestinationDir = path.join(currentDir, 'patches');

if (patchesCurrentDir !== patchesDestinationDir) {
    fs.rmdirSync(patchesDestinationDir, {recursive: true});
    copyFolderSync(patchesCurrentDir, patchesDestinationDir);
}

execSync(
    `cd ${clientCoreRoot} && npx patch-package`,
    {stdio: 'inherit'}
);
