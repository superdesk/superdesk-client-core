import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

/**
 * Duplicating to a different desk and stage places the article in that desk's stage.
 *
 * Given an article in Sports / Working Stage,
 * When the user duplicates it to Finance / Working Stage,
 * Then the article is visible in Finance / Working Stage.
 */
test('duplicate to a different desk and stage', async ({page}) => {
    const monitoring = new Monitoring(page);
    const articleSelector = s('monitoring-group=Sports / Working Stage', 'article-item=test sports story');

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');
    await expect(page.locator(articleSelector)).toHaveCount(1);

    await monitoring.executeActionOnMonitoringItem(
        page.locator(articleSelector),
        'Duplicate',
        'Duplicate To',
    );

    await new TreeSelectDriver(
        page,
        page.locator(s('interactive-actions-panel', 'destination-select')),
    ).setValues('Finance');

    await page
        .locator(s('interactive-actions-panel', 'stage-select'))
        .getByRole('radio', {name: 'Working Stage'})
        .check();

    await page.locator(s('interactive-actions-panel', 'duplicate')).click();

    await monitoring.selectDeskOrWorkspace('Finance');
    await expect(
        page.locator(s('monitoring-group=Finance / Working Stage', 'article-item=test sports story')),
    ).toBeVisible();
});

/**
 * The duplicate panel pre-selects the last destination used by the user.
 *
 * Given the user previously duplicated an article to Finance,
 * When they open the Duplicate To panel for any article,
 * Then the destination select shows Finance.
 */
test('remembers the last duplicate destination desk', async ({page}) => {
    const monitoring = new Monitoring(page);
    const articleSelector = s('monitoring-group=Sports / Working Stage', 'article-item=test sports story');

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    // first duplicate to Finance
    await monitoring.executeActionOnMonitoringItem(
        page.locator(articleSelector),
        'Duplicate',
        'Duplicate To',
    );
    await new TreeSelectDriver(
        page,
        page.locator(s('interactive-actions-panel', 'destination-select')),
    ).setValues('Finance');
    await page
        .locator(s('interactive-actions-panel', 'stage-select'))
        .getByRole('radio', {name: 'Working Stage'})
        .check();
    await page.locator(s('interactive-actions-panel', 'duplicate')).click();

    // open the duplicate panel again
    await monitoring.executeActionOnMonitoringItem(
        page.locator(articleSelector),
        'Duplicate',
        'Duplicate To',
    );

    const values = await new TreeSelectDriver(
        page,
        page.locator(s('interactive-actions-panel', 'destination-select')),
    ).getValues();

    expect(values).toEqual(['Finance']);
});
