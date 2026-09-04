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

export async function login(page: Page): Promise<void> {
    await loginAs(page, 'admin', 'admin');
}

/**
 * Logs a named user in through the login form, for specs that need a second
 * actor alongside the committed admin `storageState`.
 *
 * Only the users documented in `e2e/WRITING_TESTS.md` have a known password;
 * the snapshot stores bcrypt hashes and there is no API to set one.
 */
export async function loginAs(page: Page, username: string, password: string): Promise<void> {
    await page.goto('/');

    const loginPage = page.getByTestId('login-page');

    await loginPage.getByTestId('username').fill(username);
    await loginPage.getByTestId('password').fill(password);
    await loginPage.getByTestId('submit').click();

    await expect(page.getByTestId('dashboard')).toBeVisible();
}

// One MailCrab instance serves every e2e slot on the machine, so unlike the
// backend and client URLs it is not per slot; the env var is only an escape
// hatch for a machine that publishes it on another port.
const MAILCRAB_URL = (process.env.MAILCRAB_URL || 'http://localhost:1080').replace(/\/$/, '');

interface IMailcrabMessage {
    id: string;
    subject: string;
    date: string;
    to: Array<{email: string}>;
}

/**
 * Gives the account owning `email` a password by driving the "Forgot password?"
 * flow and reading the token out of MailCrab. Must be called while signed out;
 * it leaves the browser on the login form.
 *
 * The `main` snapshot stores only bcrypt hashes and documents a plaintext
 * password for the admin alone, so this is the only way to get a session as any
 * other user. There is no API to set a password directly: the admin UI can only
 * trigger this same email. It doubles as the "reset password" flow itself, so
 * keep it as the single encoding of the MailCrab contract rather than inlining
 * a second copy in a spec.
 *
 * MailCrab is shared by every e2e slot on the machine, so a message only counts
 * when it is addressed to `email`, was absent from the inbox before the request,
 * and links back to the client origin this run is driving.
 */
export async function setPasswordThroughResetEmail(
    page: Page,
    {email, password}: {email: string; password: string},
): Promise<void> {
    const readInbox = () => page.request.get(`${MAILCRAB_URL}/api/messages`)
        .then((response) => response.json() as Promise<Array<IMailcrabMessage>>);

    await page.goto('/#/reset-password/');

    const resetPage = page.getByTestId('reset-password-page');

    await resetPage.getByTestId('email').fill(email);

    const knownMessageIds = new Set((await readInbox()).map((message) => message.id));

    // The click posts to /api/reset_user_password. A page.request call issued
    // while that is in flight cancels it and no email is ever sent, so the
    // polling below must not start before the response lands.
    const tokenRequest = page.waitForResponse(
        (response) => response.url().includes('/api/reset_user_password')
            && response.request().method() === 'POST',
    );

    await resetPage.getByTestId('get-token').click();
    await tokenRequest;

    const clientOrigin = new URL(page.url()).origin;
    let resetLink = '';

    await expect.poll(async () => {
        const candidates = (await readInbox())
            .filter((message) => !knownMessageIds.has(message.id))
            .filter((message) => message.subject === 'Reset password')
            .filter((message) => message.to.some((recipient) => recipient.email === email))
            .sort((a, b) => b.date.localeCompare(a.date));

        for (const candidate of candidates) {
            const body = await page.request.get(`${MAILCRAB_URL}/api/message/${candidate.id}`)
                .then((response) => response.json() as Promise<{text: string}>);
            const link = body.text.match(/(https?:\/\/[^\s]+reset-password[^\s]+)/)?.[1];

            if (link != null && link.startsWith(clientOrigin)) {
                resetLink = link;
                break;
            }
        }

        return resetLink;
    }, {timeout: 20000, message: `No reset-password email for ${email} arrived in MailCrab`}).not.toBe('');

    await page.goto(resetLink);

    const newPassword = resetPage.getByTestId('password');

    // The controller only reveals this form (flowStep 3) once it has validated
    // the token against the server, which is an extra round trip after load.
    await expect(newPassword).toBeVisible();
    await newPassword.fill(password);
    await resetPage.getByTestId('password-confirm').fill(password);
    await resetPage.getByTestId('submit').click();

    await expect(page.getByTestId('login-page')).toBeVisible();
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
