import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.setTimeout(60000);

test('publish queue is searchable by headline and by unique name', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=test sports story')),
        'Edit',
    );

    await authoring.publish({subscribers: ['Subscriber 1']});

    await expect(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=test sports story')),
    ).toBeVisible();

    await page.goto('/#/publish_queue');

    const queueRow = page.locator(s('publish-queue-item=test sports story'));

    await expect(queueRow).toBeVisible();

    // Search by exact headline → 1 matching row.
    await page.locator(s('search')).fill('test sports story');
    await expect(queueRow).toHaveCount(1);
    await expect(page.locator(s('publish-queue-item'))).toHaveCount(1);

    // Search by a different headline → 0 rows.
    await page.locator(s('search')).fill('a headline that does not exist');
    await expect(page.locator(s('publish-queue-item'))).toHaveCount(0);

    // Clear the search → all rows back.
    await page.locator(s('search-close')).click();
    await expect(queueRow).toBeVisible();

    // Search by the row's unique name (third visible <td>) → 1 matching row.
    const uniqueName = (await queueRow.locator('td').nth(2).innerText()).trim();

    expect(uniqueName.length).toBeGreaterThan(0);

    await page.locator(s('search')).fill(uniqueName);
    await expect(page.locator(s('publish-queue-item'))).toHaveCount(1);
});
