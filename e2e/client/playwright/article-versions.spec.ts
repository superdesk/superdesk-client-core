import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s, sleep} from './utils';

test.describe('article versions', async () => {
    test('reverting to a previous article version', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=story 2')),
            'Edit',
        );

        await monitoring.fillEditor3Field('slugline', 'story 2.1');

        await page.locator(s('authoring-topbar')).getByRole('button', {name: 'Save'}).click();
        await expect(
            page.locator(s('authoring', 'authoring-field=slugline')).getByRole('textbox'),
        ).toHaveText('story 2.1');

        await page.locator(s('navigation-tabs', 'widget-icon=versions-and-item-history')).click();
        await page
            .locator(s('authoring-widget-panel', 'article-version=3'))
            .getByRole('button', {name: 'revert'}).click();
        await expect(
            page.locator(s('authoring', 'authoring-field=slugline')).getByRole('textbox'),
        ).toHaveText('story 2');
    });
});
