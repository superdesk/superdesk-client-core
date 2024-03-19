import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test.describe('Article versions', async () => {
    test('Can revert article', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.editArticle(
            page.locator(s('article-item=story 2')),
            {
                slugline: 'story 2.1',
            },
        );

        await expect(page.locator(s('monitoring-view', 'article-item=story 2'))).not.toBeVisible();
        await expect(page.locator(s('monitoring-view', 'article-item=story 2.1'))).toBeVisible();

        await page.locator(s('navigation-tabs', 'authoring-widget=Versions/History')).click();
        await page
            .locator(s('authoring-widget-panel=Versions/History'))
            .getByRole('button', {name: 'revert'}).first().click();

        await expect(page.locator(s('monitoring-view', 'article-item=story 2'))).toBeVisible();
        await expect(page.locator(s('monitoring-view', 'article-item=story 2.1'))).not.toBeVisible();
    });
});
