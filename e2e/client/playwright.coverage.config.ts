/**
 * Prototype-only config: runs the generated `*.covspec.ts` copies with the monocart
 * reporter so V8 coverage from the app bundle is mapped back to `scripts/` through
 * the source maps of an `E2E_COVERAGE_SOURCEMAP=1` build.
 */
import baseConfig from './playwright.config';
import {defineConfig} from '@playwright/test';

export default defineConfig({
    ...baseConfig,
    testMatch: '**/*.covspec.ts',
    reporter: [
        ['line'],
        ['monocart-reporter', {
            name: 'Superdesk e2e V8 coverage prototype',
            outputFile: './coverage-report/index.html',
            coverage: {
                entryFilter: (entry: {url: string}) => entry.url.includes('app.bundle'),
                sourceFilter: (sourcePath: string) => sourcePath.includes('scripts/'),
                reports: [['v8'], ['v8-json'], ['console-summary']],
            },
        }],
    ],
});
