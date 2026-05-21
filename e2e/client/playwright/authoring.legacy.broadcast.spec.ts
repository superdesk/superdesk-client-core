import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {login, restoreDatabaseSnapshot, s} from './utils';

test.use({storageState: {cookies: [], origins: []}});

test.setTimeout(60000);

// FLAKY: under the 'legacy' snapshot, publishing item5 and immediately invoking a
// follow-up context-menu action ("Create Broadcast") causes a "Your session has
// expired" overlay to appear mid-test (same symptom observed in the legacy
// kill-template and media-gallery specs). Root cause looks environmental
// (snapshot-restore vs. session token), not a regression in the broadcast flow.
// Re-enable once the session expiry race is resolved in the legacy snapshot.
test.skip('Create Broadcast action opens a new item with source slugline', async ({page}) => {
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

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=item5')).last(),
        'Create Broadcast',
    );

    await expect(page.locator(s('authoring', 'field-slugline'))).toHaveValue(/item5/i);
});
