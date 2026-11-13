import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot} from './utils';

// Fixtures live in the snapshot: a "Subject condition" (Subject in [archaeology]),
// a "Subject content filter" using it, a Direct "Subject product" permitting that
// filter, and an active "Advisory email subscriber" holding that product.
const SUBJECT = 'archaeology';
const SUBSCRIBER = 'Advisory email subscriber';
const MATCHING_ARTICLE = 'test sports story';
const NON_MATCHING_ARTICLE = 'story 2';

test('content filter routes a published article to the matching subscriber only', async ({page}) => {
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

    // Publish a second article that does NOT carry the subject: it must not be
    // routed to the subscriber whose filter requires it.
    await page.goto('/#/workspace/monitoring');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: NON_MATCHING_ARTICLE}),
        'Edit',
    );
    await authoring.publish({subscribers: []});
    await expect(page.getByText('Item published', {exact: false})).toBeVisible();

    await page.goto('/#/publish_queue');

    // The matching article reached the subscriber it matched by content filter.
    await expect(
        page.getByTestId('publish-queue-item')
            .filter({hasText: MATCHING_ARTICLE})
            .filter({hasText: SUBSCRIBER}),
    ).toBeVisible();

    // The non-matching article did not reach that subscriber: the content filter,
    // not the act of publishing, is what routed the first one.
    await expect(
        page.getByTestId('publish-queue-item')
            .filter({hasText: NON_MATCHING_ARTICLE})
            .filter({hasText: SUBSCRIBER}),
    ).toHaveCount(0);
});
