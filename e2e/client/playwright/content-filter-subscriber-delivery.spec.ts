import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot} from './utils';

const SUBJECT = 'archaeology';
const SUBSCRIBER = 'Advisory email subscriber';
// Ships in `main`; its product blocks only the Football/Basketball sluglines, so
// it receives story 2 too, which proves story 2 was actually published.
const OTHER_SUBSCRIBER = 'Subscriber 1';
const MATCHING_ARTICLE = 'test sports story';
const NON_MATCHING_ARTICLE = 'story 2';

test('content filter routes a published article to the matching subscriber only', async ({page}) => {
    test.setTimeout(60000);

    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'content-filter-subscriber-delivery'});

    await page.goto('/#/workspace/monitoring');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: MATCHING_ARTICLE}),
        'Edit',
    );
    await authoring.setSubject(SUBJECT);

    // No target subscribers, so routing is decided only by the products' filters.
    await authoring.publish({subscribers: []});
    await expect(page.getByText('Item published', {exact: false})).toBeVisible();

    await page.goto('/#/workspace/monitoring');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: NON_MATCHING_ARTICLE}),
        'Edit',
    );
    await authoring.publish({subscribers: []});

    const queueItem = (article: string, subscriber: string) =>
        page.getByTestId('publish-queue-item').filter({hasText: article}).filter({hasText: subscriber});

    // The queue is only read on page load and a row can land just after
    // publishing, so reload until both rows show.
    await expect(async () => {
        await page.goto('/#/publish_queue');
        await expect(queueItem(MATCHING_ARTICLE, SUBSCRIBER)).toBeVisible({timeout: 2000});
        await expect(queueItem(NON_MATCHING_ARTICLE, OTHER_SUBSCRIBER)).toBeVisible({timeout: 2000});
    }).toPass({timeout: 25000});

    // Published, but absent for the filtered subscriber: the content filter, not
    // the act of publishing, did the routing.
    await expect(queueItem(NON_MATCHING_ARTICLE, SUBSCRIBER)).toHaveCount(0);
});
