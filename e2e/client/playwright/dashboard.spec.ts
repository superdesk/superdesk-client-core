import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('adding a widget to a dashboard', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace');

    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(
        page.locator(s('widget-grid', 'widget=world-clock')),
    ).not.toBeVisible();

    await page.getByRole('button', {name: 'Add widget'}).click();
    await page.locator(s('widget-modal', 'widget-item=world-clock')).click();
    await page.locator(s('widget-modal')).getByRole('button', {name: 'Add This Widget'}).click();
    await page.locator(s('widget-modal')).getByRole('button', {name: 'Done'}).click();
    await expect(
        page.locator(s('widget-grid', 'widget=world-clock')),
    ).toBeVisible();
});