import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('can correct published item', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    // checking that articles are loaded
    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
    ).toBeVisible();

    await expect(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=Story 5.1')),
    ).not.toBeVisible();

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=Story 5')),
        'Publishing actions',
        'Correct item',
    );

    // edit item
    await page.locator(s('authoring')).locator(s('field--headline')).getByRole('textbox').clear();
    await page.locator(s('authoring')).locator(s('field--headline')).getByRole('textbox').fill('Story 5.1');
    await page.locator(s('authoring-topbar')).getByRole('button', {name: 'Send Correction'}).click();

    await expect(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=Story 5.1')),
    ).toBeVisible();

    await page.goto('/#/publish_queue');
    await expect(page.locator(s('publish-queue-item=Story 5.1'))).toBeVisible();
});
