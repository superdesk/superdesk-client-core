import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

test.describe('sending an article', async () => {
    test('sending an article to another desk', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=story 2')),
            'Edit',
        );

        await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();
        await page.locator(s('interactive-actions-panel', 'tabs')).getByRole('tab', {name: 'Send to'}).click();

        // selecting other desk
        await new TreeSelectDriver(
            page,
            page.locator(s('destination-select')),
        ).setValue(['Educations']);
        await page
            .locator(s('interactive-actions-panel', 'stage-select'))
            .getByRole('radio', {name: 'Working Stage'})
            .check();
        await page.locator(s('interactive-actions-panel', 'send')).click();

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        ).not.toBeVisible();
        await monitoring.selectDeskOrWorkspace('Educations');
        await expect(
            page.locator(s('monitoring-group=Educations / Working Stage', 'article-item=story 2')),
        ).toBeVisible();
    });

    test('sending an article to another stage', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=story 2')),
            'Edit',
        );

        await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();
        await page.locator(s('interactive-actions-panel', 'tabs')).getByRole('tab', {name: 'Send to'}).click();

        // selecting other stage
        await page
            .locator(s('interactive-actions-panel', 'stage-select'))
            .getByRole('radio', {name: 'Incoming Stage'})
            .check();
        await page.locator(s('interactive-actions-panel', 'send')).click();

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        ).not.toBeVisible();
        await expect(
            page.locator(s('monitoring-group=Sports / Incoming Stage', 'article-item=story 2')),
        ).toBeVisible();
    });
});
