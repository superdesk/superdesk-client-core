import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('article versions', async () => {
    test('reverting to a previous article version', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await page.locator(s('article-item=story 2')).hover();
        await page.locator(s('article-item=story 2')).locator(s('context-menu-button')).click();
        await page.locator(s('context-menu'))
            .getByRole('button', {name: 'Edit', exact: true})
            .click();
        await page.locator(s('authoring', 'field-slugline')).fill('story 2.1');
        await page.locator(s('authoring-topbar', 'save')).click();
        await expect(page.locator(s('authoring', 'field-slugline'))).toHaveValue('story 2.1');

        await page.locator(s('navigation-tabs', 'authoring-widget=Versions/History')).click();
        await page
            .locator(s('authoring-widget-panel=Versions/History', 'article-version=3'))
            .getByRole('button', {name: 'revert'}).click();
        await expect(page.locator(s('authoring', 'field-slugline'))).toHaveValue('story 2');
    });
});
