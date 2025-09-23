import {test, expect} from '@playwright/test';
import {s, restoreDatabaseSnapshot} from './utils';

// Reset storage state for this file to avoid being authenticated
test.use({storageState: {cookies: [], origins: []}});

test.describe('login', () => {
    test.beforeEach(async () => {
        await restoreDatabaseSnapshot();
    });

    test('form renders modal on load', async ({page}) => {
        await page.goto('/');

        await expect(page.locator(s('login-page', 'submit'))).toBeVisible();
    });

    test('user can log in and logout', async ({page}) => {
        await page.goto('/');

        await page.locator(s('login-page', 'username')).fill('admin');
        await page.locator(s('login-page', 'password')).fill('admin');
        await page.locator(s('login-page', 'submit')).click();

        // Wait for navigation to workspace
        await expect(page.locator(s('dashboard'))).toBeVisible();
        await expect(page).toHaveURL(/.*\/#\/workspace/);

        // Check current user
        await page.locator(s('my-profile')).click();
        await expect(page.locator(s('current-user__username'))).toHaveText('admin');

        // Logout
        await page.getByRole('button', {name: 'Sign out'}).click();

        // Wait for redirect back to login
        await expect(page.locator(s('login-page', 'submit'))).toBeVisible();
    });

    test('unknown user can\'t log in', async ({page}) => {
        await page.goto('/');

        await page.locator(s('login-page', 'username')).fill('foo');
        await page.locator(s('login-page', 'password')).fill('bar');
        await page.locator(s('login-page', 'submit')).click();

        // Should still be on login page
        await expect(page.locator(s('login-page', 'submit'))).toBeVisible();
        await expect(page).not.toHaveURL(/.*\/#\/workspace/);

        // Check for error message
        await expect(page.locator(s('login-error-401'))).toBeVisible();
    });
});