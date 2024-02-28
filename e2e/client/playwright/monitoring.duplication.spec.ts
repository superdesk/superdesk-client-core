import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('duplicate in place', async ({page}) => {
    const monitoring = new Monitoring(page);
    const articleSelector = s('monitoring-group=Sports / Working Stage', 'article-item=test sports story');

    await restoreDatabaseSnapshot();

    await page.goto('/#/workspace/monitoring');

    await expect(page.locator(articleSelector)).toHaveCount(1);

    const initialItemsCountAcrossAllStages = await page.locator(s('article-item')).count();
    
    await monitoring.executeActionOnMonitoringItem(
        page.locator(articleSelector),
        'Duplicate',
        'Duplicate in place',
    );

    await expect(page.locator(articleSelector)).toHaveCount(2);
    await expect(page.locator(s('article-item'))).toHaveCount(initialItemsCountAcrossAllStages + 1);
});

test('duplicate to personal space', async ({page}) => {
    const monitoring = new Monitoring(page);
    const articleSelector = s('monitoring-group=Sports / Working Stage', 'article-item=test sports story');

    await restoreDatabaseSnapshot();

    await page.goto('/#/workspace/personal');

    await expect(page.locator(s('list-item-placeholder'))).toBeVisible();
    await expect(page.locator(s('list-item-placeholder'))).not.toBeVisible();

    const itemCountInPersonalSpace = await page.locator(s('article-item')).count(); // need to be 1

    await page.goto('/#/workspace/monitoring');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(articleSelector),
        'Duplicate',
        'Duplicate to personal',
    );

    await page.goto('/#/workspace/personal');
    await expect(page.locator(s('list-item-placeholder'))).not.toBeVisible();

    await expect(page.locator(s('article-item=test sports story'))).toHaveCount(1);
    await expect(page.locator(s('article-item'))).toHaveCount(itemCountInPersonalSpace + 1);
});
