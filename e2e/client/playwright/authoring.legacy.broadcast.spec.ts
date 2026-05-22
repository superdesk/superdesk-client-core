import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {dismissSessionExpiry, login, restoreDatabaseSnapshot, s} from './utils';

test.use({storageState: {cookies: [], origins: []}});

test.setTimeout(60000);

test('Create Broadcast action opens a new item with source slugline', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'legacy'});
    await login(page);

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Politic Desk');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=item5')).first(),
        'Edit',
    );
    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page.locator(s('authoring', 'interactive-actions-panel', 'publish')).click();

    await dismissSessionExpiry(page);

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=item5')).last(),
        'Create Broadcast',
    );

    await expect(page.locator(s('authoring', 'field-slugline'))).toHaveValue(/item5/i);
});
