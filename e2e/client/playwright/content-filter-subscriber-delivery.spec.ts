import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot} from './utils';

// Fixtures live in the snapshot: a "Subject condition" (Subject in [archaeology]),
// a "Subject content filter" using it, a Direct "Subject product" permitting that
// filter, and an active "Advisory email subscriber" holding that product.
const SUBJECT = 'archaeology';
const SUBSCRIBER = 'Advisory email subscriber';
// Ships in `main`, blocks only the Football/Basketball sluglines, so it receives
// everything else — used to prove the non-matching article was actually published.
const OTHER_SUBSCRIBER = 'Subscriber 1';
const MATCHING_ARTICLE = 'test sports story';
const NON_MATCHING_ARTICLE = 'story 2';

test('content filter routes a published article to the matching subscriber only', async ({page}) => {
    test.setTimeout(60000);

    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'content-filter-subscriber-delivery'});

    // Make the article match the permitting filter, then publish without targeting
    // subscribers so routing is decided solely by the products' content filters.
    await page.goto('/#/workspace/monitoring');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: MATCHING_ARTICLE}),
        'Edit',
    );
    await authoring.setSubject(SUBJECT);
    await authoring.publish({subscribers: []});
    await expect(page.getByText('Item published', {exact: false})).toBeVisible();

    // Publish a second article that does NOT carry the subject.
    await page.goto('/#/workspace/monitoring');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: NON_MATCHING_ARTICLE}),
        'Edit',
    );
    await authoring.publish({subscribers: []});

    const queueItem = (article: string, subscriber: string) =>
        page.getByTestId('publish-queue-item').filter({hasText: article}).filter({hasText: subscriber});

    // The queue list is only read on page load and an entry can land a moment
    // after publishing, so reload until both expected rows are present: the
    // matching article reached the subscriber it matched, and the non-matching
    // article reached the catch-all subscriber (which proves it was published).
    // Short per-attempt timeouts keep the reload loop turning.
    await expect(async () => {
        await page.goto('/#/publish_queue');
        await expect(queueItem(MATCHING_ARTICLE, SUBSCRIBER)).toBeVisible({timeout: 2000});
        await expect(queueItem(NON_MATCHING_ARTICLE, OTHER_SUBSCRIBER)).toBeVisible({timeout: 2000});
    }).toPass({timeout: 25000});

    // The non-matching article was published but did NOT reach the filtered
    // subscriber: the content filter, not the act of publishing, is what routed
    // the first one.
    await expect(queueItem(NON_MATCHING_ARTICLE, SUBSCRIBER)).toHaveCount(0);
});
