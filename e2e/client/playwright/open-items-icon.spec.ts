import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {OpenedArticles} from './page-object-models/opened-articles';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Open items icon" (1308524865).
 *
 * The Open Items icon in the opened-articles bar opens a fullscreen view listing
 * every article the user currently has open. Picking one there returns to the
 * workspace with that article in the editor; the X in the top right corner
 * leaves the view without changing what is open.
 *
 * The main snapshot already ships two articles locked by the admin, so they sit
 * in the opened-articles bar from the start. Neither has a headline, and the
 * dashboard cards are labelled by headline alone, so the spec opens
 * "test sports story" as the article it picks in the dashboard and uses one of
 * the snapshot ones only as the article the editor is switched away from.
 */
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

        // Leave the editor on a different article, so opening one from the
        // dashboard has an observable effect.
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

        // Leaving through the X only dismisses the view: nothing is closed and the
        // editor keeps the article that was selected.
        await expect(slugline).toHaveValue(SELECTED_ARTICLE);
        await expect(openedArticles.getBarItems()).toHaveCount(TOTAL_OPEN_ARTICLES);
    });
});
