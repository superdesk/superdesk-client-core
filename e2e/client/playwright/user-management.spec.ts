import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {getLoggedOutStorageState} from './utils/storage-state';
import {Users} from './page-object-models/users';

test('creating a new user', {
    annotation: [
        {type: 'confluence', description: '1311834344 complete'}, // Add user (PASS 01.11.22)
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

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

test('a disabled user is told the account is suspended when signing in', {
    annotation: [
        {type: 'confluence', description: '1311834346 complete'}, // Disable user (PASS 01.11.22)
    ],
}, async ({page, browser}) => {
    await restoreDatabaseSnapshot();

    const users = new Users(page);

    await users.openList();

    const sam = users.getListItem('Sam Gamgee');

    await expect(sam).not.toContainText('disabled');
    await sam.hover();
    await sam.getByRole('button', {name: 'Disable user'}).click();
    await page.getByTestId('modal-confirm').getByRole('button', {name: 'Ok'}).click();
    await expect(sam).toContainText('disabled');

    const context = await browser.newContext({storageState: getLoggedOutStorageState()});

    try {
        const samPage = await context.newPage();

        await samPage.goto('/');

        const loginPage = samPage.getByTestId('login-page');

        await loginPage.getByTestId('username').fill('samgamgee');
        await loginPage.getByTestId('password').fill('samgamgee');
        await loginPage.getByTestId('submit').click();

        await expect(loginPage.getByTestId('login-error-403'))
            .toHaveText('Sorry, but your account has been suspended.');
        await expect(loginPage.getByTestId('submit')).toBeVisible();
        await expect(samPage.getByTestId('top-menu')).toHaveCount(0);
    } finally {
        await context.close();
    }
});
