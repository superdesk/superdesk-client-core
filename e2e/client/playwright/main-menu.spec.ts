import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';

function drawerEntry(page: Page, label: string) {
    return page.getByTestId('main-menu').locator('li', {
        has: page.getByTestId('main-menu-item').and(page.locator(`[data-test-value="${label}"]`)),
    });
}

async function openDrawer(page: Page) {
    await page.getByRole('button', {name: 'Toggle main menu'}).click();
    await expect(page.getByTestId('main-menu')).toBeVisible();
}

test.describe('main menu', () => {
    test.beforeEach(async () => {
        await restoreDatabaseSnapshot();
    });

    test('highlights the drawer entry of the current page', async ({page}) => {
        await page.goto('/#/users/');
        await openDrawer(page);

        await expect(drawerEntry(page, 'User Management')).toHaveClass(/main-menu__list-item--active/);
        await expect(drawerEntry(page, 'Settings')).not.toHaveClass(/main-menu__list-item--active/);
        await expect(page.getByTestId('main-menu').locator('.main-menu__list-item--active')).toHaveCount(1);

        await drawerEntry(page, 'Settings').getByTestId('main-menu-item').click();
        await expect(page).toHaveURL(/#\/settings/);
        await openDrawer(page);

        await expect(drawerEntry(page, 'Settings')).toHaveClass(/main-menu__list-item--active/);
        await expect(drawerEntry(page, 'User Management')).not.toHaveClass(/main-menu__list-item--active/);
    });
});
