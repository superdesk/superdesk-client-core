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

    // The selected desk button renders its name uppercased via CSS pipe;
    // the dropdown's option text matches the original case. Compare
    // case-insensitively so the no-op early-return guard triggers when
    // the desired desk is already selected and avoids opening the dropdown
    // only to find the option button disabled.
    if ((await selectedDesk.textContent())?.toLocaleLowerCase().includes(deskName.toLocaleLowerCase())) {
        return;
    }

    await selectedDesk.click();
    await page
        .locator(s('monitoring--select-desk-options'))
        .getByRole('button', {name: deskName, exact: true})
        .click();
}

test('configures a custom label for a monitor widget', {
    annotation: [
        {type: 'confluence', description: '1308524881 complete'}, // Monitoring Widget Settings
    ],
}, async ({page}) => {
    await selectDesk(page, 'Politic Desk');
    await addMonitorWidget(page);

    const widget = page.locator(s('dashboard-widget=Monitor'));

    await widget.getByRole('button', {name: 'Widget settings'}).click();

    const settings = page.locator(s('aggregate-widget-config'));

    await settings.locator(s('widget-view-name')).fill('my view');
    await settings.locator(s('footer')).getByRole('button', {name: 'Done'}).click();

    await expect(
        page.locator(s('dashboard-widget=Monitor')).getByRole('heading', {name: 'my view', exact: true}),
    ).toBeVisible();
});
