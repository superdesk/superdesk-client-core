import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot, s} from './utils';

test.use({storageState: {cookies: [], origins: []}});

// FLAKY: same legacy-snapshot session-expiry overlay symptom as the other
// authoring.legacy.* tests — after the first save and close the second
// 3-dot context menu click is blocked. Needs an upstream fix to either the
// legacy snapshot's auth tokens or the save flow's interaction with the
// session lifecycle.
test.skip('sign off can be edited manually and is appended on subsequent saves', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Politic Desk');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=item5')).first(),
        'Edit',
    );

    await expect(page.locator(s('authoring', 'sign-off-value'))).toHaveText('fl');

    await page.locator(s('authoring')).locator('#sign-off-unlock').click();
    await page.locator(s('authoring', 'sign-off-input')).fill('ABC');

    const saveBtn = page.locator(s('authoring-topbar', 'save'));

    await saveBtn.click();

    // Wait for save to complete (button becomes disabled once the item is saved)
    // before clicking close. Otherwise the close races the save and triggers the
    // "unsaved changes" confirm dialog which blocks subsequent context menus.
    await expect(saveBtn).toBeDisabled();
    await page.locator(s('authoring-topbar', 'close')).click();

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=item5')).first(),
        'Edit',
    );
    await expect(page.locator(s('authoring', 'sign-off-value'))).toHaveText('ABC');

    await page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox').click();
    await page.keyboard.type('z');
    await page.locator(s('authoring-topbar', 'save')).click();

    await expect(page.locator(s('authoring', 'sign-off-value'))).toHaveText('ABC/fl');
});
