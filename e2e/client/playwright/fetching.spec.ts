import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

test('fetching an article to selected desk', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
    ).toBeVisible();

    await expect(
        page.locator(s(
            'monitoring-group=Sports / Working Stage',
            'article-item=Indonesia opens pasteurized milk facility to back free meals program',
        )),
    ).not.toBeVisible();

    await page.goto('/#/search?repo=ingest');
    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=Indonesia opens pasteurized milk facility to back free meals program')),
        'Fetch To',
    );

    await new TreeSelectDriver(
        page,
        page.locator(s('destination-select')),
    ).setValues('Education');

    await page
        .locator(s('interactive-actions-panel', 'stage-select'))
        .locator(s('item=Working Stage'))
        .click();

    await page.locator(s('interactive-actions-panel', 'fetch')).click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Education');
    await expect(
        page.locator(s(
            'monitoring-group=Education / Working Stage',
            'article-item=Indonesia opens pasteurized milk facility to back free meals program',
        )),
    ).toBeVisible();
});

test('fetching an article', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
    ).toBeVisible();

    await expect(
        page.locator(s(
            'monitoring-group=Sports / Incoming Stage',
            'article-item=Indonesia opens pasteurized milk facility to back free meals program',
        )),
    ).not.toBeVisible();

    await page.goto('/#/search?repo=ingest');
    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=Indonesia opens pasteurized milk facility to back free meals program')),
        'Fetch',
    );

    await page.goto('/#/workspace/monitoring');
    await expect(
        page.locator(s(
            'monitoring-group=Sports / Incoming Stage',
            'article-item=Indonesia opens pasteurized milk facility to back free meals program',
        )),
    ).toBeVisible();
});
