import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test('switching system language', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/profile');

    await page.locator(s('my-profile')).click();
    await page.locator(s('my-profile-dropdown')).getByRole('link', {name: 'Manage profile'}).click();

    await expect(page.locator(s('page-title'))).toHaveText('My Profile');

    await page.locator(s('user-details-form')).getByLabel('Language').selectOption('Deutsch (German)');
    await page.locator(s('action-bar')).locator('[data-test-id="save"]').click();
    await page.getByRole('dialog').getByRole('button', {name: 'Confirm'}).click();

    await expect(page.locator(s('page-title'))).toHaveText('Mein Profil', {timeout: 10000}); // timeout needed due to page reload
});
