/**
 * Type-check extensions to make sure client API changes don't break them.
 * Legacy extensions still use their `compile` script. Migrated extensions
 * (`main` points to a .ts/.tsx source) are type-checked via `tsc --noEmit`
 * against their own tsconfig, since they no longer carry a compile step.
 */

const {execSync, execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

function getDirectories(p) {
    return fs.readdirSync(p).filter((file) => {
        return fs.statSync(p + '/' + file).isDirectory();
    });
}

const allExtensions = 'scripts/extensions';
const tscEntry = require.resolve('typescript/bin/tsc');

getDirectories(allExtensions).forEach((extensionDir) => {
    const extensionPath = `${allExtensions}/${extensionDir}`;
    const pkg = JSON.parse(fs.readFileSync(`${extensionPath}/package.json`, 'utf-8'));
    const main = pkg.main;
    const isMigrated = typeof main === 'string' && /\.(ts|tsx)$/.test(main);

    execSync('npm install', {stdio: 'inherit', cwd: extensionPath});

    if (isMigrated) {
        const tsconfig = ['src/tsconfig.json', 'tsconfig.json']
            .map((c) => path.join(extensionPath, c))
            .find((c) => fs.existsSync(c));

        if (tsconfig == null) {
            throw new Error(`Migrated extension ${extensionDir} has no tsconfig.json`);
        }

        execFileSync(
            process.execPath,
            [tscEntry, '--noEmit', '-p', tsconfig],
            {stdio: 'inherit'}
        );
    } else {
        execSync('npm run compile', {stdio: 'inherit', cwd: extensionPath});
    }
});
