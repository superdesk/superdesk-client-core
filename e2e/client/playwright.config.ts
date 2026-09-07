import {defineConfig, devices} from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * e2e-up.sh --slot writes the slot's environment (backend URL, client URL,
 * storage state path) to .e2e-slot.env so tests run from this checkout target
 * that slot without any manual setup. Real environment variables win over the
 * file. Workers inherit process.env from this process, so setting values here
 * also covers playwright/utils (SUPERDESK_URL).
 */
const slotEnvPath = path.join(__dirname, './playwright/.cache/e2e-slot.env');

if (fs.existsSync(slotEnvPath)) {
    for (const line of fs.readFileSync(slotEnvPath, 'utf-8').split('\n')) {
        const match = line.match(/^([A-Z_]+)=(.*)$/);

        if (match != null && process.env[match[1]] == null) {
            process.env[match[1]] = match[2];
        }
    }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './playwright',
    fullyParallel: false,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 3 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI ? 'blob' : 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.CLIENT_URL || 'http://localhost:9000',

        /*
         * Superdesk emits `data-test-id` attributes. Playwright's getByTestId
         * default is `data-testid` (no middle hyphen), so this must be set for
         * getByTestId to resolve. Legacy specs that build CSS via the s() helper
         * are unaffected (they call page.locator, which ignores this option).
         */
        testIdAttribute: 'data-test-id',

        viewport: {width: 1280, height: 800},

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'retain-on-failure',

        screenshot: 'only-on-failure',
    },

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.05,
        },

        timeout: 15000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                /*
                 * The committed storageState keeps the session in localStorage
                 * keyed to the origin http://localhost:9000. Slots serve the
                 * client from a different origin, so e2e-up.sh --slot writes
                 * an origin-rewritten copy and points at it via env.
                 */
                storageState: process.env.PLAYWRIGHT_STORAGE_STATE
                    ? path.resolve(__dirname, process.env.PLAYWRIGHT_STORAGE_STATE)
                    : path.join(__dirname, './playwright/.auth/user.json'),

                launchOptions: {
                    args: [
                        '--disable-font-subpixel-positioning',
                    ],
                },
            },
        },

        // {
        //     name: 'firefox',
        //     use: {
        //         ...devices['Desktop Firefox'],
        //         storageState: 'playwright/.auth/user.json',
        //     },
        // },

        // {
        //     name: 'webkit',
        //     use: {
        //         ...devices['Desktop Safari'],
        //         storageState: 'playwright/.auth/user.json',
        //     },
        // },

        /* Test against mobile viewports. */
        // {
        //     name: 'Mobile Chrome',
        //     use: {
        //         ...devices['Pixel 5'],
        //         storageState: 'playwright/.auth/user.json',
        //     },
        // },
        // {
        //     name: 'Mobile Safari',
        //     use: {
        //         ...devices['iPhone 12'],
        //         storageState: 'playwright/.auth/user.json',
        //     },
        // },

        /* Test against branded browsers. */
        // {
        //     name: 'Microsoft Edge',
        //     use: {
        //         ...devices['Desktop Edge'],
        //         storageState: 'playwright/.auth/user.json',
        //         channel: 'msedge',
        //     },
        // },
        // {
        //     name: 'Google Chrome',
        //     use: {
        //         ...devices['Desktop Chrome'],
        //         storageState: 'playwright/.auth/user.json',
        //         channel: 'chrome',
        //     },
        // },
    ],

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://127.0.0.1:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
