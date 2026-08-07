import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {TreeSelectDriver} from './utils/tree-select-driver';

test('publishing an article from a different desk', {
    annotation: [
        // Sending items between desks_ (PASS 20.10) (AUTOMATED)
        {type: 'confluence', description: '1344443827 complete'},
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Education');
    await expect(
        page.locator(s('monitoring-group=Education desk output', 'article-item=story 2')),
    ).not.toBeVisible();

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        'Edit',
    );

    await page.locator(s('authoring-topbar', 'open-send-publish-pane')).click();
    await page.locator(s('interactive-actions-panel', 'tabs')).getByRole('tab', {name: 'Publish'}).click();

    await new TreeSelectDriver(
        page,
        page.locator(s('destination-select')),
    ).setValues(['Education']);

    await page.locator(s('interactive-actions-panel')).getByRole('button', {name: 'Publish from'}).click();

    await monitoring.selectDeskOrWorkspace('Education');
    await expect(
        page.locator(s('monitoring-group=Education desk output', 'article-item=story 2')),
    ).toBeVisible();
});


