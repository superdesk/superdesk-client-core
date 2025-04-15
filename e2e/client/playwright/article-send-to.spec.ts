import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('sending an article', async () => {
    test('sending an article to another desk', async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
            'Edit',
        );

        authoring.sendTo(page, 'Working Stage', ['Education']);

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        ).not.toBeVisible();
        await monitoring.selectDeskOrWorkspace('Education');
        await expect(
            page.locator(s('monitoring-group=Education / Working Stage', 'article-item=story 2')),
        ).toBeVisible();
    });

    test('sending an article to another stage', async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
            'Edit',
        );

        authoring.sendTo(page, 'Incoming Stage');

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        ).not.toBeVisible();
        await expect(
            page.locator(s('monitoring-group=Sports / Incoming Stage', 'article-item=story 2')),
        ).toBeVisible();
    });
});
