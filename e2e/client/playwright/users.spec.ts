import {test, expect} from '@playwright/test';
import {login, restoreDatabaseSnapshot, s} from './utils';

test('creating a new user', async ({page}) => {
    await restoreDatabaseSnapshot();
    await login(page);

    await page.goto('/#/users');

    await page.locator('[data-test-id="user-filter"]').selectOption('All');

    await page.locator(s('create-user-button')).click();
    await page.locator(s('user-details-form', 'field--first_name')).fill('John');
    await page.locator(s('user-details-form', 'field--last_name')).fill('Doe');
    await page.locator(s('user-details-form', 'field--username')).fill('johndoe');
    await page.locator(s('user-details-form', 'field--email')).fill('johndoe@example.com');
    await page.locator(s('user-details-form', 'save')).click();
    await expect(page.locator(s('username'), {hasText: 'johndoe'})).toBeVisible();
});
