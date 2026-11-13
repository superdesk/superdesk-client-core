import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {PublishSettings, selectMetaTerm} from './page-object-models/publish-settings';
import {restoreDatabaseSnapshot} from './utils';

// A leaf subject (no children in the IPTC tree), set identically on the filter
// condition and on the article so they match by qcode. A leaf is selected in one
// click, unlike a parent category which needs a "choose entire category" step.
const SUBJECT = 'archaeology';
const SUBSCRIBER = 'Advisory email subscriber';
const ARTICLE = 'test sports story';

test('published article reaches the subscriber matched by its content filter', async ({page}) => {
    test.setTimeout(90000);

    const settings = new PublishSettings(page);
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();

    await settings.openContentFiltersTab('filter_conditions');
    await settings.createListFilterCondition({
        name: 'Subject condition',
        field: 'Subject',
        operator: 'in',
        value: SUBJECT,
    });

    await settings.openContentFiltersTab('filters');
    await settings.createContentFilter({
        name: 'Subject content filter',
        filterConditionName: 'Subject condition',
    });

    await settings.createProduct({
        name: 'Subject product',
        contentFilterName: 'Subject content filter',
    });

    await settings.createSubscriber({
        name: SUBSCRIBER,
        email: 'advisory@example.com',
        productName: 'Subject product',
        destinationName: 'Email destination',
        format: 'NINJSv2',
        recipients: 'advisory@example.com',
    });

    await page.goto('/#/workspace/monitoring');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: ARTICLE}),
        'Edit',
    );

    await selectMetaTerm(page.locator('#subjects'), SUBJECT);

    // Routing is driven solely by the product's permitting content filter
    // (Subject in [archaeology]); the subject just added makes the article match.
    await authoring.publishToMatchingSubscribers();

    await expect(page.getByText('Item published', {exact: false})).toBeVisible();

    await page.goto('/#/publish_queue');

    // The article was routed to the subscriber whose product's content filter it
    // matched: a queue row carries both the article headline and that subscriber.
    await expect(
        page.getByTestId('publish-queue-item')
            .filter({hasText: ARTICLE})
            .filter({hasText: SUBSCRIBER}),
    ).toBeVisible();
});
