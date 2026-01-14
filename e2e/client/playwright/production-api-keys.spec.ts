import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

test('can create a new production api client', async ({page}) => {
    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/production-api-keys');

    const initialItems = await page.locator(s('list-page--items')).locator('.sd-list-item').count();

    await page.locator(s('list-page--add-item')).click();

    await page.locator(s('item-view-edit', 'gform-input--name')).fill('New Test API Client');

    await new TreeSelectDriver(
        page,
        page.locator(s('item-view-edit', 'gform-input--scope')),
    ).setValues(['Archive']);

    await page.locator(s('list-page--new-item', 'item-view-edit--save')).click();

    await page.locator(s('list-page--view-edit', 'list-page-close')).click();

    await page.locator(s('confirm-copy', 'confirm-close')).click();

    const updatedItems = await page.locator(s('list-page--items')).locator('.sd-list-item').count();

    expect(updatedItems).toBe(initialItems + 1);

    await expect(
        page.locator(s('list-page--items')).locator('.sd-list-item').last(),
    ).toContainText('New Test API Client');
});
