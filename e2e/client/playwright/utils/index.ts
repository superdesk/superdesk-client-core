import * as request from 'request';
import {expect, Page} from '@playwright/test';

export function restoreDatabaseSnapshot(options?: {snapshotName?: string}): Promise<void> {
    return new Promise((resolve) => {
        request.post({
            uri: 'http://localhost:5000/api/restore_record',
            method: 'POST',
            timeout: 30000,
            json: options?.snapshotName ?? 'initial',
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
