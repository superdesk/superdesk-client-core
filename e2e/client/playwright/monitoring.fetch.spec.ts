import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

const ingestHeadline = 'Indonesia opens pasteurized milk facility to back free meals program';

/**
 * Fetch-as-and-open opens the article in authoring after fetching.
 *
 * Given an ingest article visible in the ingest search,
 * When the user picks "Fetch To" then a destination desk/stage and clicks "Fetch and open",
 * Then authoring opens for that article (save button visible).
 */
test('Fetch and open puts the article into authoring', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/search?repo=ingest');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s(`article-item=${ingestHeadline}`)),
        'Fetch To',
    );

    await new TreeSelectDriver(
        page,
        page.locator(s('destination-select')),
    ).setValues('Sports');

    await page
        .locator(s('interactive-actions-panel', 'stage-select'))
        .locator(s('item=Working Stage'))
        .click();

    await page.locator(s('interactive-actions-panel', 'fetch-and-open')).click();

    await expect(page.locator(s('authoring-topbar', 'save'))).toBeVisible();
});

/**
 * Fetch-as does not show schedule/embargo controls in the fetch panel.
 *
 * Given an ingest article and the Fetch To panel open,
 * Then the publish-schedule and embargo controls are not present in the panel.
 */
test('Fetch To panel does not expose publish-schedule or embargo controls', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/search?repo=ingest');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s(`article-item=${ingestHeadline}`)),
        'Fetch To',
    );

    await expect(page.locator(s('interactive-actions-panel'))).toBeVisible();
    await expect(
        page.locator(s('interactive-actions-panel', 'publish-schedule')),
    ).toHaveCount(0);
    await expect(
        page.locator(s('interactive-actions-panel', 'embargo')),
    ).toHaveCount(0);
});
