import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {dismissSessionExpiry, login, restoreDatabaseSnapshot, s} from './utils';

test.use({storageState: {cookies: [], origins: []}});

test.setTimeout(60000);

test.beforeEach(async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);
});

test('applying kill template populates body and headline', async ({page}) => {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Politic Desk');

    const item = page.locator(s('article-item=item5')).first();

    await monitoring.executeActionOnMonitoringItem(item, 'Edit');
    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page.locator(s('authoring', 'interactive-actions-panel', 'publish')).click();

    const publishedItem = page.locator(s('article-item=item5')).last();

    await dismissSessionExpiry(page);
    await monitoring.executeActionOnMonitoringItem(publishedItem, 'Publishing actions', 'Kill item');

    await expect(
        page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox'),
    ).toContainText('This is kill template.');

    await expect(
        page.locator(s('authoring-topbar')).getByRole('button', {name: 'Send Kill'}),
    ).toBeVisible();
});

test('Multiedit option hidden when action is kill', async ({page}) => {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Politic Desk');

    const item = page.locator(s('article-item=item5')).first();

    await monitoring.executeActionOnMonitoringItem(item, 'Edit');

    await page.locator(s('authoring-topbar', 'actions-button')).click();
    await expect(page.locator(s('actions-list', 'multiedit-action'))).toBeVisible();
    await page.keyboard.press('Escape');

    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page.locator(s('authoring', 'interactive-actions-panel', 'publish')).click();

    const publishedItem = page.locator(s('article-item=item5')).last();

    await dismissSessionExpiry(page);
    await monitoring.executeActionOnMonitoringItem(publishedItem, 'Publishing actions', 'Kill item');

    await dismissSessionExpiry(page);
    await page.locator(s('authoring-topbar', 'actions-button')).click();
    await expect(page.locator(s('actions-list', 'multiedit-action'))).not.toBeVisible();
});
