const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

const currentDir = process.cwd();
const clientCoreRoot = path.join(__dirname, '../');
const patchesCurrentDir = path.join(clientCoreRoot, 'patches');
const patchesDestinationDir = path.join(currentDir, 'patches');

if (patchesCurrentDir !== patchesDestinationDir) {
    fs.rmdirSync(patchesDestinationDir, {recursive: true});
    fs.renameSync(patchesCurrentDir, patchesDestinationDir);
}

execSync(
    'npx patch-package',
    {stdio: 'inherit'}
);
