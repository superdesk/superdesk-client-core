import {test, expect, Locator, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from '../../utils';
import {FIXTURE_ARTICLES, createContentList, dragAndDrop} from './api-helpers';

const ALREADY_IN_LIST_TOOLTIP = 'Already in this list';

// A row identified by its article id (data-test-value) inside a given pane.
function articleRow(page: Page, pane: Locator, contentId: string): Locator {
    return pane.getByTestId('content-list-item').and(page.locator(`[data-test-value="${contentId}"]`));
}

test.describe('content list editor article picker', () => {
    test('an added article is dimmed in the picker after reopening the list', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('dim already-added test');
        const article = FIXTURE_ARTICLES.published;

        await page.goto(`/#/content-lists?list=${list._id}`);

        const pickerResults = page.getByTestId('content-list--picker-results');
        const pickerArticle = articleRow(page, pickerResults, article.id);

        // Before adding: the published article is offered normally.
        await expect(pickerArticle).toBeVisible();
        await expect(pickerArticle).toHaveCSS('opacity', '1');
        await expect(pickerArticle).not.toHaveAttribute('title', ALREADY_IN_LIST_TOOLTIP);

        // Add it to the list and persist.
        const items = page.getByTestId('content-list--items');

        await dragAndDrop(page, pickerArticle, items);
        await expect(articleRow(page, items, article.id)).toBeVisible();

        const saveButton = page.getByTestId('content-list--items-pane').getByRole('button', {name: 'Save'});

        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        // Navigate off the list and reopen it, so the picker re-fetches published
        // articles and can mark the ones already in the list.
        await page.getByRole('button', {name: 'Back to content lists'}).click();
        await expect(page.getByTestId('content-lists--grid')).toBeVisible();
        await page.goto(`/#/content-lists?list=${list._id}`);

        // After adding: the same article is dimmed and tooltipped in the picker.
        const pickerArticleAfter = articleRow(page, page.getByTestId('content-list--picker-results'), article.id);

        await expect(pickerArticleAfter).toBeVisible();
        await expect(pickerArticleAfter).toHaveCSS('opacity', '0.5');
        await expect(pickerArticleAfter).toHaveAttribute('title', ALREADY_IN_LIST_TOOLTIP);
    });
});
