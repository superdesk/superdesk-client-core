import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test('can add saved search to monitoring widget', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace');

    await expect(
        page.locator(s('dashboard-widget=Monitor')),
    ).toBeVisible();

    await expect(
        page.locator(s('dashboard-widget=Monitor', 'group=Technology / search')),
    ).not.toBeVisible();

    await page.locator(s('dashboard-widget=Monitor')).getByRole('button', {name: 'Widget settings'}).click();

    await page.locator(s('aggregate-widget-config')).getByRole('button', {name: 'Saved Searches'}).click();
    await page.locator(s('aggregate-widget-config', 'saved-search=Technology', 'toggle')).click();
    await page.locator(s('aggregate-widget-config', 'footer')).getByRole('button', {name: 'Done'}).click();

    await expect(
        page.locator(s('dashboard-widget=Monitor', 'group=Technology / search')),
    ).toBeVisible();
});
