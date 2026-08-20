import * as request from 'request';
import {expect, Locator, Page} from '@playwright/test';

const SUPERDESK_API_URL = (process.env.SUPERDESK_URL || 'http://localhost:5002/api').replace(/\/$/, '');

export function restoreDatabaseSnapshot(options?: {snapshotName?: string}): Promise<void> {
    return new Promise((resolve) => {
        request.post({
            uri: `${SUPERDESK_API_URL}/restore_record`,
            method: 'POST',
            timeout: 30000,
            json: {name: options?.snapshotName ?? 'main'},
        }, resolve);
    });
}

/**
 * ['a', 'b', 'c'] computes to '[data-test-id="a"] [data-test-id="b"] [data-test-id="c"]'
 *
 * ['a', 'b=c'] computes to '[data-test-id="a"] [data-test-id="b"][data-test-value="c"]'
 */
const getTestSelector = (...testIds: Array<string>) => {
    const selector = testIds
        .map((testId) => {
            if (testId.includes('=')) {
                const [id, value] = testId.split('=');

                return `[data-test-id="${id}"][data-test-value="${value}"]`;
            } else {
                return `[data-test-id="${testId}"]`;
            }
        })
        .join(' ');

    return selector;
};

export const s = getTestSelector;

/**
 * Presses a key `times` in a row. Counted arrow presses are how a spec moves the caret inside
 * editor3: Home/End do not move it on macOS, and a character offset is the only address a
 * contenteditable exposes to the keyboard.
 */
export async function pressRepeatedly(page: Page, key: string, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
        await page.keyboard.press(key);
    }
}

export async function login(page: Page) {
    await page.goto('/');

    await page.locator(s('login-page', 'username')).fill('admin');
    await page.locator(s('login-page', 'password')).fill('admin');
    await page.locator(s('login-page', 'submit')).click();

    await expect(page.locator(s('dashboard'))).toBeVisible();
}

/**
 * Logs a named user in through the login form, for specs that need a second
 * actor alongside the committed admin `storageState`.
 *
 * `login(page)` above fills `admin`/`admin` unconditionally, so it cannot be
 * reused here. Only the users documented in `e2e/WRITING_TESTS.md` have a known
 * password; the snapshot stores bcrypt hashes and there is no API to set one.
 */
export async function loginAs(page: Page, username: string, password: string): Promise<void> {
    await page.goto('/');

    const loginPage = page.getByTestId('login-page');

    await loginPage.getByTestId('username').fill(username);
    await loginPage.getByTestId('password').fill(password);
    await loginPage.getByTestId('submit').click();

    await expect(page.getByTestId('dashboard')).toBeVisible();
}

/**
 * Test-side workaround for the "Your session has expired" overlay race that
 * only reproduces under the `legacy` DB snapshot.
 *
 * Why this exists:
 *   1. `restoreDatabaseSnapshot({snapshotName: 'legacy'})` wipes the DB.
 *   2. `login(page)` issues a fresh session token into the just-wiped DB.
 *   3. The first save/publish action works.
 *   4. A backend background process invalidates that just-issued token (the
 *      exact mechanism lives in superdesk-core's session lifecycle and is
 *      out of scope for this client repo to fix).
 *   5. The next client request returns HTTP 401.
 *   6. The auth interceptor at scripts/core/auth/auth.ts:30,53 calls
 *      `session.expire()` and broadcasts LOGOUT.
 *   7. scripts/core/auth/login-modal-directive.ts:128-146 renders the
 *      `.login-screen` overlay from scripts/core/auth/login-modal.html,
 *      with `<p class="session-error">Your session has expired.</p>` on
 *      the `ng-if="identity._id"` (mid-session) branch.
 *   8. That overlay covers the article list and swallows every subsequent
 *      context-menu / topbar click until dismissed.
 *
 * The `main` snapshot does not exhibit this — only `legacy`.
 *
 * This helper detects the mid-session overlay (the selector keys off the
 * `.session-error` element which only renders for *mid-session* expiry,
 * never on a fresh login page — so calling it as a no-op anywhere is safe)
 * and re-authenticates in place so the test can continue.
 *
 * TODO(backend): re-bake the legacy Mongo snapshot so the admin entry in
 * the `auth` collection either does not exist (forcing a clean login via
 * login()) or carries a token valid for the full test run. That would
 * eliminate the race and every dismissSessionExpiry() call below would
 * become dead code. Tracked separately; out of scope for this client repo
 * because it requires editing `e2e/server/dump/full/legacy/superdesk_e2e/`
 * fixtures and verifying no other consumers of the snapshot regress.
 */
export async function dismissSessionExpiry(page: Page): Promise<void> {
    const overlay = page.locator('.login-screen .session-error');

    // isVisible() is synchronous (no implicit wait), so use waitFor with a
    // short timeout. The overlay appears after a mid-session 401 round-trip,
    // so we need to give the interceptor a beat to render it.
    try {
        await overlay.waitFor({state: 'visible', timeout: 2000});
    } catch {
        return;
    }

    await page.locator(s('login-page', 'username')).fill('admin');
    await page.locator(s('login-page', 'password')).fill('admin');
    await page.locator(s('login-page', 'submit')).click();
    await expect(page.locator('.login-screen')).toBeHidden();
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * A helper to make code shorter, but maintain selector scoping.
 *
 * Without this helper:
 *
 * ```
 * await page.locator(s('desk-config-modal', 'field--name')).fill('desk 7');
 * await page.locator(s('desk-config-modal', 'field--source')).fill('desk 7');
 * await page.locator(s('desk-config-modal')).getByRole('button', {name: 'test'}).click();
 * ```
 *
 * With this helper:
 * ```
 * await withTestContext('desk-config-modal', async ({cs}) => {
 *      await page.locator(cs('field--name')).fill('desk 7');
 *      await page.locator(cs('field--source')).fill('from desk 7');
 *      await page.locator(cs()).getByRole('button', {name: 'test'}).click();
 * });
 */
export function withTestContext(
    selector: string,
    callback: (
        options: {
            // cs - contextualized selector
            cs: (...testIds: Array<string>) => string;
        }
    ) => Promise<void>,
): Promise<void> {
    const getTestSelectorWithContext = (...testIds: Array<string>) => getTestSelector(selector, ...testIds);

    return callback({cs: getTestSelectorWithContext});
}

export async function waitForToastMessage(page: Page, type: string, text: string): Promise<void> {
    const selector = s(`notification--${type}=${text}`);

    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator(selector)).toHaveText(`${text}`);
    await expect(page.locator(selector)).not.toBeVisible();
}

export async function getCellValueByColumTitle(
    table: Locator,
    row: Locator,
    tableHeading: string,
): Promise<String> {
    const headers = table.locator('thead tr th');
    const count = await headers.count();
    let columnIndex = -1;

    for (let i = 0; i < count; i++) {
        const text = await headers.nth(i).innerText();

        if (text === tableHeading) {
            columnIndex = i;
            break;
        }
    }

    if (columnIndex === -1) {
        throw new Error(`Column heading "${tableHeading}" not found in table`);
    }

    const item = row.locator(`td:nth-child(${columnIndex + 1})`);

    return item.innerText();
}
