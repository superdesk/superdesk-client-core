import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

const MAILCRAB = 'http://localhost:1080';

test('switching system language', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/profile');

    await page.locator(s('my-profile')).click();
    await page.locator(s('my-profile-dropdown')).getByRole('link', {name: 'Manage profile'}).click();

    await expect(page.locator(s('page-title'))).toHaveText('My Profile');

    await page.locator(s('user-details-form')).getByLabel('Language').selectOption('Deutsch (German)');
    await page.locator(s('action-bar')).locator('[data-test-id="save"]').click();
    await page.getByRole('dialog').getByRole('button', {name: 'Confirm'}).click();

    await expect(page.locator(s('page-title'))).toHaveText('Mein Profil');
});

test('can edit my profile', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/profile');

    const values = [
        {label: 'First Name', newValue: 'Richard', type: 'text'},
        {label: 'Last Name', newValue: 'Roe', type: 'text'},
        {label: 'Email', newValue: 'richard@example.com', type: 'text'},
        {label: 'Default Desk', newValue: 'Finance', type: 'select'},
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

    // The next click triggers a POST that we must let finish before
    // navigating — otherwise page.request cancels it and no email is sent.
    const resetRequest = page.waitForResponse(
        (resp) => resp.url().includes('/api/reset_user_password') && resp.request().method() === 'POST',
    );

    // Snapshot inbox so we can identify the email this run produced.
    // Resetting admin's password invalidates every prior admin token, so
    // picking a stale email between retries means the token won't validate.
    const initialMessages = await page.request.get(`${MAILCRAB}/api/messages`)
        .then((r) => r.json() as Promise<Array<{id: string}>>);

    await page.getByRole('button', {name: 'Get token'}).click();
    await resetRequest;

    let newMessageId: string | null = null;

    await expect.poll(async () => {
        const messages = await page.request.get(`${MAILCRAB}/api/messages`)
            .then((r) => r.json() as Promise<Array<{id: string; subject: string; date: string}>>);
        const fresh = messages
            .filter((m) => !initialMessages.find((seen) => seen.id === m.id))
            .filter((m) => m.subject === 'Reset password')
            .sort((a, b) => b.date.localeCompare(a.date));

        if (fresh.length > 0) {
            newMessageId = fresh[0].id;
            return true;
        }
        return false;
    }, {timeout: 20000, message: 'No new reset-password email arrived in MailCrab'}).toBe(true);

    const message = await page.request.get(`${MAILCRAB}/api/message/${newMessageId}`)
        .then((r) => r.json() as Promise<{text: string}>);
    const linkMatch = message.text.match(/(https?:\/\/[^\s]+reset-password[^\s]+)/);

    if (!linkMatch) throw new Error('Reset link was not found in the email body');
    const resetPasswordLink = linkMatch[1];

    await page.goto(resetPasswordLink);

    // The form is hidden until the controller validates the token via an
    // async POST and flips flowStep to 3.
    const passwordInput = page.locator('form[name="resetForm"] input[name="password"]');

    await expect(passwordInput).toBeVisible({timeout: 10000});
    await passwordInput.fill('admin123.');
    await page.locator('form[name="resetForm"] input[name="passwordConfirm"]').fill('admin123.');
    await page.getByRole('button', {name: 'Reset password'}).click();

    // Login with new password
    await page.locator('form[name="loginForm"]').getByPlaceholder('username').fill('admin');
    await page.locator('form[name="loginForm"]').getByPlaceholder('password').fill('admin123.');
    await page.getByRole('button', {name: 'Log in'}).click();

    await expect(page).toHaveURL('http://localhost:9000/#/workspace');
});
