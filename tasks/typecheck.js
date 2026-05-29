const path = require('path');
const fs = require('fs');
const {spawnSync} = require('child_process');

const ROOT = path.join(__dirname, '..');
const TSC = require.resolve('typescript/bin/tsc');
const EXTENSIONS_DIR = path.join(ROOT, 'scripts', 'extensions');

// In-tree extensions to skip (e.g. deps not installed in CI, or known unfixed errors).
const SKIP = new Set([
    'sams', // deps (e.g. reselect) not installed by root `npm ci`; install its deps to re-enable
]);

function buildsFromTypeScript(root) {
    const pkgPath = path.join(root, 'package.json');

    if (!fs.existsSync(pkgPath)) {
        return false;
    }

    const {main} = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    return typeof main === 'string' && (main.endsWith('.ts') || main.endsWith('.tsx'));
}

// Each extension is checked against its own tsconfig: extensions have independent
// node_modules, so a single unified program can't resolve their deps.
function extensionTargets() {
    if (!fs.existsSync(EXTENSIONS_DIR)) {
        return [];
    }

    return fs.readdirSync(EXTENSIONS_DIR, {withFileTypes: true})
        .filter((entry) => entry.isDirectory() && !SKIP.has(entry.name))
        .map((entry) => {
            const root = path.join(EXTENSIONS_DIR, entry.name);
            const tsconfig = [
                path.join(root, 'src', 'tsconfig.json'),
                path.join(root, 'tsconfig.json'),
            ].find((candidate) => fs.existsSync(candidate));

            return {name: entry.name, root, tsconfig};
        })
        .filter(({root, tsconfig}) => tsconfig != null && buildsFromTypeScript(root));
}

function check({name, tsconfig}) {
    process.stdout.write(`\n# ${name} (${path.relative(ROOT, tsconfig)})\n`);

    const {status} = spawnSync(
        process.execPath,
        [TSC, '--project', tsconfig, '--noEmit', '--pretty'],
        {cwd: ROOT, stdio: 'inherit'}
    );

    return status === 0;
}

const targets = [
    {name: 'core', tsconfig: path.join(ROOT, 'scripts', 'tsconfig.json')},
    ...extensionTargets(),
];

const failed = targets.filter((target) => !check(target)).map(({name}) => name);

process.stdout.write(`\n${'='.repeat(60)}\n`);

if (failed.length > 0) {
    process.stdout.write(`Type-check FAILED: ${failed.join(', ')}\n`);
    process.exit(1); // eslint-disable-line no-process-exit
}

process.stdout.write(`Type-check passed (${targets.length} project${targets.length === 1 ? '' : 's'}).\n`);
