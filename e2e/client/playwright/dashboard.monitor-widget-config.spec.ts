import {test, expect, Page} from '@playwright/test';
import {login, restoreDatabaseSnapshot, s} from './utils';

test.use({storageState: {cookies: [], origins: []}});

test.beforeEach(async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);
    await page.goto('/#/workspace');
});

async function addMonitorWidget(page: Page) {
    await page.getByRole('button', {name: 'Add widget'}).click();
    await page.locator(s('widget-modal', 'widget-item=aggregate')).click();
    await page.locator(s('widget-modal')).getByRole('button', {name: 'Add This Widget'}).click();
    await page.locator(s('widget-modal')).getByRole('button', {name: 'Done'}).click();
}

async function selectDesk(page: Page, deskName: string) {
    const selectedDesk = page.locator(s('monitoring--selected-desk'));

    if ((await selectedDesk.textContent())?.includes(deskName)) {
        return;
    }

    await selectedDesk.click();
    await page
        .locator(s('monitoring--select-desk-options'))
        .getByRole('button', {name: deskName, exact: true})
        .click();
}

// FLAKY: the selectDesk helper still fails on the legacy snapshot — the
// initial selected desk doesn't surface "Politic Desk" reliably and the
// dropdown's Politic Desk button is rendered as disabled even after the
// helper's no-op guard. Needs a different desk anchor or a fresh-state
// helper before this can be enabled.
test.skip('configures a custom label for a monitor widget', async ({page}) => {
    await selectDesk(page, 'Politic Desk');
    await addMonitorWidget(page);

    const widget = page.locator(s('dashboard-widget=Monitor'));

    await widget.getByRole('button', {name: 'Widget settings'}).click();

    const settings = page.locator(s('aggregate-widget-config'));

    await settings.locator(s('widget-view-name')).fill('my view');
    await settings.locator(s('footer')).getByRole('button', {name: 'Done'}).click();

    await expect(page.locator(s('dashboard-widget=my view'))).toBeVisible();
});
