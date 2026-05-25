import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {getCellValueByColumTitle, restoreDatabaseSnapshot, s} from './utils';

test.setTimeout(50000);

test('item appearing in publish queue after publishing with subscriber', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=test sports story')),
        'Edit',
    );

    await authoring.publish({subscribers: ['Subscriber 1']});

    await expect(page.locator(
        s('monitoring-group=Sports desk output', 'article-item=test sports story'),
    )).toBeVisible();

    await page.goto('/#/publish_queue');
    await expect(page.locator(s('publish-queue-item=test sports story'))).toBeVisible();

    await page.locator(s('publish-queue-item=test sports story')).click();

    await expect(page.locator(
        s('authoring-preview', 'field--headline'),
    )).toHaveText('test sports story');

    const value = await getCellValueByColumTitle(
        page.locator(s('publish-queue-table')),
        page.locator(s('publish-queue-item=test sports story')),
        'Subscriber',
    );

    expect(value).toBe('Subscriber 1');
});
