import * as request from 'request';
import {expect, Locator, Page} from '@playwright/test';

const SUPERDESK_API_URL = (process.env.SUPERDESK_URL || 'http://localhost:5000/api').replace(/\/$/, '');

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

export async function login(page: Page) {
    await page.goto('/');

    await page.locator(s('login-page', 'username')).fill('admin');
    await page.locator(s('login-page', 'password')).fill('admin');
    await page.locator(s('login-page', 'submit')).click();

    await expect(page.locator(s('dashboard'))).toBeVisible();
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
