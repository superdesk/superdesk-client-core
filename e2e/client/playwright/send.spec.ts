import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

test.describe('send', () => {
    test('can open the send-to panel while the monitoring list is hidden', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
            'Edit',
        );

        await page.locator(s('Monitoring')).click();
        await expect(page.locator('#main-container')).toHaveClass(/hideMonitoring/);

        await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();

        await expect(page.locator(s('interactive-actions-panel'))).toBeVisible();
    });

    test('remembers the last sent destination desk for the next item', async ({page}) => {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
            'Edit',
        );
        await authoring.sendTo({desk: 'Education', stage: 'Working Stage'});

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
            'Edit',
        );
        await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();
        await page.locator(s('interactive-actions-panel', 'tabs'))
            .getByRole('tab', {name: 'Send to'}).click();

        const selectedDesks = await new TreeSelectDriver(
            page,
            page.locator(s('destination-select')),
        ).getValues();

        expect(selectedDesks).toEqual(['Education']);
    });
});
