import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.setTimeout(50000);

test.skip('item appearing in publish queue after publishing', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=test sports story')),
        'Edit',
    );

    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page.locator(s('authoring', 'interactive-actions-panel', 'publish')).click();

    await expect(page.locator(
        s('monitoring-group=Sports', 'article-item=test sports story'),
    )).toBeAttached({timeout: 10000});

    await page.goto('/#/publish_queue');

    await expect(page.locator(s('publish-queue-item=test sports story'))).toBeAttached({timeout: 10000});
});
