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
    await expect(page.locator(s('page-title'))).toHaveText('Mein Profil');
});

test('can edit my profile', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/profile');

    const values = [
        {label: 'First Name', newValue: 'Richard', type: 'text'},
        {label: 'Last Name', newValue: 'Roe', type: 'text'},
        {label: 'Email', newValue: 'richard@example.com', type: 'text'},
        {label: 'Default Desk', newValue: 'Finances', type: 'select'},
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

    for (const value of values) {
        const field = await page.locator(s('user-details-form')).getByLabel(value.label);

        if (value.type === 'text') {
            await expect(field).toHaveValue(value.newValue);
        } else if (value.type === 'select') {
            await expect(field.locator('option:checked')).toHaveText(value.newValue);
        }
    }
});

test('can disable a user', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/users');

    const userList = page.locator(s('users-list'));
    const user = userList.locator(s('users-list-item=Jane Doe'));
    const userFilter = page.locator(s('user-filter'));

    await userFilter.selectOption('Active');
    await user.hover();
    await userList.getByRole('button', {name: 'Disable user'}).click();
    await page.locator(s('modal-confirm')).getByRole('button', {name: 'Ok'}).click();
    await expect(user).not.toBeVisible();

    await userFilter.selectOption('Disabled');
    await expect(user).toBeVisible();
});

test('can reset password', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/profile');

    await page.locator(s('my-profile')).click();
    await page.locator(s('my-profile-dropdown')).getByRole('button', {name: 'Sign Out'}).click();
    await page.locator(s('login-page')).getByRole('link', {name: 'Forgot password?'}).click();
    await page.getByPlaceholder('Email').fill('admin@example.com');
    await page.getByRole('button', {name: 'Get token'}).click();

    // Navigate to MailCrab to get the reset email
    await page.goto('http://localhost:1080');
    await page.locator('.list li').last().click();

    // Extract the password reset link from the iFrame email content
    const resetPasswordLink = await page.frameLocator('iFrame')
        .locator('p:has-text("Please use this link") a')
        .getAttribute('href');

    if (!resetPasswordLink) throw new Error('Reset link was not found in the iFrame');

    await page.goto(resetPasswordLink);

    // Reset password
    await page.locator('form[name="resetForm"] input[name="password"]').fill('admin123.');
    await page.locator('form[name="resetForm"] input[name="passwordConfirm"]').fill('admin123.');
    await page.getByRole('button', {name: 'Reset password'}).click();

    // Login with new password
    await page.locator('form[name="loginForm"]').getByPlaceholder('username').fill('admin');
    await page.locator('form[name="loginForm"]').getByPlaceholder('password').fill('admin123.');
    await page.getByRole('button', {name: 'Log in'}).click();

    await expect(page).toHaveURL('http://localhost:9000/#/workspace');
});
