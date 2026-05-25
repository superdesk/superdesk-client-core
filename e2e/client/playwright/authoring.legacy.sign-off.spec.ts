import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {dismissSessionExpiry, login, restoreDatabaseSnapshot, s} from './utils';

test.use({storageState: {cookies: [], origins: []}});

test('sign off can be edited manually and is appended on subsequent saves', async ({page}) => {
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

    // Wait until save settles (button re-disables); otherwise close races the
    // save and pops the "unsaved changes" dialog which blocks the next menu.
    await expect(saveBtn).toBeDisabled();
    await dismissSessionExpiry(page);
    await page.locator(s('authoring-topbar', 'close')).click();

    await dismissSessionExpiry(page);
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
