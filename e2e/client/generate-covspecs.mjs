/**
 * Generates a `<name>.covspec.ts` twin for every Playwright spec, identical except
 * that it takes `test` from `playwright/utils/coverage-test`, which collects V8
 * coverage from the main page fixture. `playwright.coverage.config.ts` runs only
 * these twins. The twins are generated, gitignored and disposable; regenerate after
 * any spec change. See e2e/COVERAGE.md for the full workflow.
 */
import fs from 'fs';
import path from 'path';

const dir = new URL('./playwright', import.meta.url).pathname;
let generated = 0;

for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.spec.ts')) {
        continue;
    }

    const source = fs.readFileSync(path.join(dir, name), 'utf8');

    if (!source.includes("from '@playwright/test'")) {
        console.log('skipped (no direct @playwright/test import):', name);
        continue;
    }

    fs.writeFileSync(
        path.join(dir, name.replace(/\.spec\.ts$/, '.covspec.ts')),
        source.replaceAll("from '@playwright/test'", "from './utils/coverage-test'"),
    );
    generated++;
}

console.log('generated:', generated, 'covspec twins');
