import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('users', () => {
    test.describe('profile', () => {
        test('renders the current user profile with seeded values', async ({page}) => {
            await restoreDatabaseSnapshot();
            await page.goto('/#/profile');

            const form = page.locator(s('user-details-form'));

            await expect(form.getByLabel('First Name')).toHaveValue('John');
            await expect(form.getByLabel('Last Name')).toHaveValue('Doe');
            await expect(form.getByLabel('Email')).toHaveValue('admin@example.com');
            await expect(form.getByLabel('Sign-Off')).toHaveValue('ADM');
        });
    });

    test.describe('users list', () => {
        test('lists existing users', async ({page}) => {
            await restoreDatabaseSnapshot();
            await page.goto('/#/users');

            await page.locator(s('user-filter')).selectOption('All');

            const list = page.locator(s('users-list'));

            await expect(list.locator(s('users-list-item'))).not.toHaveCount(0);
            await expect(list.locator(s('users-list-item=John Doe'))).toBeVisible();
        });
    });

    test.describe('user detail', () => {
        test('opens the full profile view from the preview pane', async ({page}) => {
            await restoreDatabaseSnapshot();
            await page.goto('/#/users');

            const list = page.locator(s('users-list'));
            const adminRow = list.locator(s('users-list-item=John Doe'));

            await adminRow.click();
            await page.locator(s('view-full-profile')).click();

            await expect(page.locator(s('page-nav-title'))).toContainText('John Doe');
            await expect(page.locator(s('user-details-form'))).toBeVisible();
        });
    });

    test.describe('user edit', () => {
        test('enables and disables Save/Cancel based on form dirtiness', async ({page}) => {
            await restoreDatabaseSnapshot();
            await page.goto('/#/users');

            const list = page.locator(s('users-list'));

            await list.locator(s('users-list-item=John Doe')).click();
            await page.locator(s('view-full-profile')).click();

            const form = page.locator(s('user-details-form'));
            const actionBar = form.locator(s('action-bar'));
            const saveBtn = actionBar.locator(s('save'));
            const cancelBtn = actionBar.locator(s('cancel'));
            const firstName = form.locator(s('field--first_name'));
            const signOff = form.locator(s('field--sign_off'));

            await expect(saveBtn).toBeDisabled();
            await expect(cancelBtn).toBeDisabled();

            await signOff.fill('X');
            await expect(saveBtn).toBeEnabled();
            await expect(cancelBtn).toBeEnabled();

            await signOff.fill('ADM');
            await expect(saveBtn).toBeDisabled();
            await expect(cancelBtn).toBeDisabled();

            await firstName.fill('X');
            await expect(saveBtn).toBeEnabled();
            await expect(cancelBtn).toBeEnabled();

            await firstName.fill('John');
            await expect(saveBtn).toBeDisabled();
            await expect(cancelBtn).toBeDisabled();
        });
    });
});
