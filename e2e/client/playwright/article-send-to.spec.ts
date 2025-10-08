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

        authoring.sendTo({desk: 'Education', stage: 'Working Stage'});

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        ).not.toBeVisible();
        await monitoring.selectDeskOrWorkspace('Education');
        await expect(
            page.locator(s('monitoring-group=Education / Working Stage', 'article-item=story 2')),
        ).toBeVisible();
    });

    test('sending an article to another stage of the same desk', async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        const currentDesk = 'Sports';

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace(currentDesk);

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
            'Edit',
        );

        authoring.sendTo({desk: currentDesk, stage: 'Incoming Stage'});

        await expect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        ).not.toBeVisible();
        await expect(
            page.locator(s('monitoring-group=Sports / Incoming Stage', 'article-item=story 2')),
        ).toBeVisible();
    });
});

test('only members can switch to a desk', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await page.locator(s('monitoring--selected-desk')).click();

    await expect(page.locator(`${s('monitoring--select-desk-options')} button`, {hasText: 'Sport'})).toBeVisible();
    await expect(page.locator(`${s('monitoring--select-desk-options')} button`, {hasText: 'Science'})).not.toBeVisible();
});

