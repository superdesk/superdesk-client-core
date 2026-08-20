/**
 * Prototype-only test wrapper that collects V8 JS coverage from the main `page`
 * fixture and hands it to monocart. Second-actor contexts a spec opens itself are
 * not covered. Used by the generated `*.covspec.ts` copies via
 * `playwright.coverage.config.ts`; not part of the regular suite.
 */
import {test as base} from '@playwright/test';
import {addCoverageReport} from 'monocart-reporter';

export * from '@playwright/test';

export const test = base.extend<NonNullable<unknown>>({
    page: async ({page}, use, testInfo) => {
        await page.coverage.startJSCoverage({resetOnNavigation: false});

        await use(page);

        const coverage = await page.coverage.stopJSCoverage();

        await addCoverageReport(coverage, testInfo);
    },
});
