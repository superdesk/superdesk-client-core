import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test.use({storageState: {cookies: [], origins: []}});

test.describe('internal destinations - CRUD, preview & sort', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});

        await page.goto('/');
        await page.locator(s('login-page', 'username')).fill('admin');
        await page.locator(s('login-page', 'password')).fill('admin');
        await page.locator(s('login-page', 'submit')).click();
        await expect(page.locator(s('dashboard'))).toBeVisible();

        await page.goto('/#/settings/internal-destinations');
    });

    test('can add an item', async ({page}) => {
        const items = page.locator(s('list-page--items', 'internal-destinations-item'));

        await expect(items).toHaveCount(3);

        await page.locator(s('list-page--add-item')).click();

        await page.locator(s('list-page--new-item', 'gform-input--name')).fill('delta');

        const deskField = page.locator(s('list-page--new-item', 'gform-input--desk'));

        await deskField.getByRole('combobox').click();
        await deskField.getByRole('combobox').fill('Sports');
        await deskField.getByRole('button', {name: 'Sports Desk'}).click();

        await page.locator(s('list-page--new-item', 'item-view-edit--save')).click();

        await expect(items).toHaveCount(4);
    });

    test('can edit existing item', async ({page}) => {
        const items = page.locator(s('list-page--items', 'internal-destinations-item'));

        await expect(items).toHaveCount(3);

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.locator(s('edit')).click();

        const nameInput = page.locator(s('list-page--view-edit', 'gform-input--name'));

        await nameInput.fill('alpha7');
        await page.locator(s('list-page--view-edit', 'item-view-edit--save')).click();

        await expect(firstItem.locator(s('gform-output--name'))).toHaveText('alpha7');
    });

    test('can preview items', async ({page}) => {
        const items = page.locator(s('list-page--items', 'internal-destinations-item'));

        await expect(items).toHaveCount(3);

        const nameInput = page.locator(s('list-page--view-edit', 'gform-input--name'));

        await items.nth(0).click();
        await expect(nameInput).toHaveValue('alpha');

        await items.nth(1).click();
        await expect(nameInput).toHaveValue('bravo');

        await items.nth(2).click();
        await expect(nameInput).toHaveValue('charlie');
    });

    test('can delete an item', async ({page}) => {
        const items = page.locator(s('list-page--items', 'internal-destinations-item'));

        await expect(items).toHaveCount(3);

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.locator(s('delete')).click();

        await page.locator(s('confirmation-modal')).getByRole('button', {name: 'Delete'}).click();

        await expect(items).toHaveCount(2);
    });

    test('can cancel deletion', async ({page}) => {
        const items = page.locator(s('list-page--items', 'internal-destinations-item'));

        await expect(items).toHaveCount(3);

        const firstItem = items.first();

        await firstItem.hover();
        await firstItem.locator(s('delete')).click();

        await page.locator(s('confirmation-modal')).getByRole('button', {name: 'Cancel'}).click();

        await expect(items).toHaveCount(3);
    });

    test('can sort items', async ({page}) => {
        const items = page.locator(s('list-page--items', 'internal-destinations-item'));

        await expect(items).toHaveCount(3);

        await page.locator(s('sortbar--selected')).click();
        await page.locator(s('sortbar--option')).getByText('Destination name', {exact: true}).click();

        await expect(page.locator(s('sortbar--sort-ascending'))).toBeVisible();
        await expect(items.nth(0).locator(s('gform-output--name'))).toHaveText('alpha');
        await expect(items.nth(1).locator(s('gform-output--name'))).toHaveText('bravo');
        await expect(items.nth(2).locator(s('gform-output--name'))).toHaveText('charlie');

        await page.locator(s('sortbar--sort-ascending')).click();

        await expect(items.nth(0).locator(s('gform-output--name'))).toHaveText('charlie');
        await expect(items.nth(1).locator(s('gform-output--name'))).toHaveText('bravo');
        await expect(items.nth(2).locator(s('gform-output--name'))).toHaveText('alpha');
    });
});
