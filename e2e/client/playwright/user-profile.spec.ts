import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test.setTimeout(50000);

test('switching system language', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/profile');

    await page.locator(s('my-profile')).click();
    await page.locator(s('my-profile-dropdown')).getByRole('link', {name: 'Manage profile'}).click();

    await expect(page.locator(s('page-title'))).toHaveText('My Profile');

    await page.locator(s('user-details-form')).getByLabel('Language').selectOption('Deutsch (German)');
    await page.locator(s('action-bar')).locator('[data-test-id="save"]').click();
    await page.getByRole('dialog').getByRole('button', {name: 'Confirm'}).click();

    // timeout needed due to page reload
    await expect(page.locator(s('page-title'))).toHaveText('Mein Profil', {timeout: 10000});
});

test('can edit my profile', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/profile');

    const values = [
        {label: 'First Name', newValue: 'Richard', type: 'text'},
        {label: 'Last Name', newValue: 'Roe', type: 'text'},
        {label: 'Email', newValue: 'richard@example.com', type: 'text'},
        {label: 'Default Desk', newValue: 'Finances', type: 'select'},
        {label: 'Language', newValue: 'Español', type: 'select'},
        {label: 'Sign-Off', newValue: 'RichardRoe', type: 'text'},
        {label: 'Byline', newValue: 'Richard Roe, CEO', type: 'text'},
        {label: 'Job Title', newValue: 'CEO', type: 'select'},
        {label: 'Biography', newValue: 'Richard Roe Biography', type: 'text'},
        {label: 'Facebook', newValue: 'https://www.facebook.com/RichardRoe', type: 'text'},
        {label: 'Instagram', newValue: 'https://www.facebook.com/RichardRoe', type: 'text'},
        {label: 'Twitter', newValue: '@RichardRoe', type: 'text'},
    ];

    for (const value of values) {
        if (value.type === 'text') {
            await page.locator(s('user-details-form')).getByLabel(value.label).fill(value.newValue);
        } else if (value.type === 'select') {
            await page.locator(s('user-details-form')).getByLabel(value.label).selectOption(value.newValue);
        }
    }

    await page.locator(s('action-bar', 'save')).click();
    await page.locator(s('confirmation-modal')).getByRole('button', {name: 'Confirm'}).click();

    for (const value of values) {
        const field = await page.locator(s('user-details-form')).getByLabel(value.label);

        if (value.type === 'text') {
            await expect(field).toHaveValue(value.newValue);
        } else if (value.type === 'select') {
            await expect(field.locator('option:checked')).toHaveText(value.newValue);
        }
    }
});
