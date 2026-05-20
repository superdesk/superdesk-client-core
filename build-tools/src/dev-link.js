/**
 * `dev-link` CLI command. Symlinks one or more local source repos into the
 * current working directory's node_modules so a Superdesk template can be
 * developed against unpublished local checkouts (e.g. superdesk-client-core,
 * superdesk-planning) without using `npm link`.
 *
 * For each source path:
 *   1. Read its package.json to get the package name. The symlink in
 *      node_modules uses this name, not the directory name (so
 *      superdesk-client-core correctly lands as node_modules/superdesk-core).
 *   2. Run `npm install` in the source root, and also in any client/<subdir>
 *      that has its own package.json (covers superdesk-planning's nested
 *      client/planning-extension without hard-coding it).
 *   3. Replace whatever is currently at node_modules/<package-name> with a
 *      symlink to the source's absolute path.
 *
 * Pre-condition: node_modules must already exist in the cwd. The command
 * errors out otherwise to catch the common mistake of linking before the
 * template's own `npm install` has run.
 */

const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

function readPkg(dir) {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
}

/**
 * Returns every directory inside `sourceRoot` that contains a package.json
 * we need to install. That is the root itself, plus any `client/*` subdir
 * that ships its own package.json (covers the superdesk-planning layout
 * where the host-build-relevant deps live under client/planning-extension).
 */
function findInstallTargets(sourceRoot) {
    const targets = [];

    if (fs.existsSync(path.join(sourceRoot, 'package.json'))) {
        targets.push(sourceRoot);
    }

    const clientDir = path.join(sourceRoot, 'client');

    if (fs.existsSync(clientDir) && fs.statSync(clientDir).isDirectory()) {
        for (const entry of fs.readdirSync(clientDir, {withFileTypes: true})) {
            if (!entry.isDirectory()) {
                continue;
            }

            const nestedPkg = path.join(clientDir, entry.name, 'package.json');

            if (fs.existsSync(nestedPkg)) {
                targets.push(path.join(clientDir, entry.name));
            }
        }
    }

    return targets;
}

function npmInstall(dir) {
    console.info(`  installing dependencies in ${dir}`);
    execFileSync('npm', ['install'], {stdio: 'inherit', cwd: dir});
}

function ensureSymlink(target, linkPath) {
    let existing;

    try {
        existing = fs.lstatSync(linkPath);
    } catch (e) {
        if (e.code !== 'ENOENT') {
            throw e;
        }
    }

    if (existing != null) {
        if (existing.isSymbolicLink() || !existing.isDirectory()) {
            fs.unlinkSync(linkPath);
        } else {
            fs.rmSync(linkPath, {recursive: true, force: true});
        }
    }

    fs.mkdirSync(path.dirname(linkPath), {recursive: true});
    fs.symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
}

function devLink(consumerDir, sources) {
    const consumerNodeModules = path.join(consumerDir, 'node_modules');

    if (!fs.existsSync(consumerNodeModules)) {
        throw new Error(
            `Consumer node_modules not found at ${consumerNodeModules}. `
            + 'Run `npm install` in the template first, then re-run dev-link.'
        );
    }

    for (const source of sources) {
        const sourceAbs = path.resolve(consumerDir, source);

        if (!fs.existsSync(sourceAbs)) {
            throw new Error(`Source path does not exist: ${sourceAbs}`);
        }

        const pkg = readPkg(sourceAbs);
        const packageName = pkg.name;

        if (packageName == null) {
            throw new Error(`Source ${sourceAbs} has no name field in package.json`);
        }

        console.info(`\n${packageName}  <-  ${sourceAbs}`);

        for (const target of findInstallTargets(sourceAbs)) {
            npmInstall(target);
        }

        const linkPath = path.join(consumerNodeModules, packageName);

        ensureSymlink(sourceAbs, linkPath);
        console.info(`  linked node_modules/${packageName}`);
    }
}

function register(program, currentDir) {
    program.command('dev-link <source...>')
        .description(
            'symlink one or more local source repos into the current node_modules '
            + 'for local development. Runs `npm install` in each source (and in any '
            + 'nested client/<extension> packages) before linking.'
        )
        .action((sources) => {
            devLink(currentDir, sources);
        });
}

module.exports = {register, devLink};
