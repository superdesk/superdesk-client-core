import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {OpenedArticles} from './page-object-models/opened-articles';
import {restoreDatabaseSnapshot} from './utils';

// The main snapshot ships two admin-locked articles without headlines. Dashboard cards are
// labelled by headline only, so one of them is used just to switch the editor away from.
test.describe('open items icon', () => {
    const SELECTED_ARTICLE = 'test sports story';
    const OTHER_ARTICLE = 'Finances Story';
    const TOTAL_OPEN_ARTICLES = 3;

    test('lists every open article, reopens the selected one and closes on X', {
        annotation: [
            {type: 'confluence', description: '1308524865 complete'}, // Open items icon
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const openedArticles = new OpenedArticles(page);
        const slugline = page.getByTestId('authoring').getByTestId('field-slugline');

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await expect(openedArticles.getBarItem(OTHER_ARTICLE)).toBeVisible();

        await monitoring.getArticleLocator(SELECTED_ARTICLE).dblclick();
        await expect(slugline).toHaveValue(SELECTED_ARTICLE);
        await expect(openedArticles.getBarItems()).toHaveCount(TOTAL_OPEN_ARTICLES);

        await openedArticles.getBarItem(OTHER_ARTICLE).click();
        await expect(slugline).toHaveValue(OTHER_ARTICLE);

        await expect(openedArticles.getOpenItemsIcon()).toBeVisible();
        await openedArticles.openDashboard();

        await expect(openedArticles.getDashboardItems()).toHaveCount(TOTAL_OPEN_ARTICLES);
        await expect(openedArticles.getDashboardItem(SELECTED_ARTICLE)).toBeVisible();

        await openedArticles.getDashboardItem(SELECTED_ARTICLE).click();

        await expect(openedArticles.getDashboard()).not.toBeVisible();
        await expect(page).toHaveURL(/#\/workspace\/monitoring/);
        await expect(monitoring.getArticleLocator(SELECTED_ARTICLE)).toBeVisible();
        await expect(slugline).toHaveValue(SELECTED_ARTICLE);

        await openedArticles.openDashboard();
        await openedArticles.closeDashboard();
        await expect(openedArticles.getDashboard()).not.toBeVisible();

        // The X only dismisses the view: nothing gets closed.
        await expect(slugline).toHaveValue(SELECTED_ARTICLE);
        await expect(openedArticles.getBarItems()).toHaveCount(TOTAL_OPEN_ARTICLES);
    });
});
