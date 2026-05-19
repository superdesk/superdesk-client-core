/**
 * Type-check extensions to make sure client API changes don't break them.
 * Legacy extensions still use their `compile` script. Migrated extensions
 * (`main` points to a .ts/.tsx source) are type-checked via `tsc --noEmit`
 * against their own tsconfig, since they no longer carry a compile step.
 */

const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

function getDirectories(p) {
    return fs.readdirSync(p).filter((file) => {
        return fs.statSync(p + '/' + file).isDirectory();
    });
}

const allExtensions = 'scripts/extensions';
const tsc = path.join('node_modules', '.bin', 'tsc');

getDirectories(allExtensions).forEach((extensionDir) => {
    const extensionPath = `${allExtensions}/${extensionDir}`;
    const pkg = JSON.parse(fs.readFileSync(`${extensionPath}/package.json`, 'utf-8'));
    const main = pkg.main;
    const isMigrated = typeof main === 'string' && /\.(ts|tsx)$/.test(main);

    execSync(`cd ${extensionPath} && npm install`, {stdio: 'inherit'});

    if (isMigrated) {
        const tsconfig = ['src/tsconfig.json', 'tsconfig.json']
            .map((c) => path.join(extensionPath, c))
            .find((c) => fs.existsSync(c));

        if (tsconfig == null) {
            throw new Error(`Migrated extension ${extensionDir} has no tsconfig.json`);
        }

        execSync(`${tsc} --noEmit -p ${tsconfig}`, {stdio: 'inherit'});
    } else {
        execSync(`cd ${extensionPath} && npm run compile`, {stdio: 'inherit'});
    }
});
