import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from '../../utils';
import {ContentLists} from '../../page-object-models/content-lists';
import {FIXTURE_ARTICLES, createContentList} from './api-helpers';

const ALREADY_IN_LIST_TOOLTIP = 'Already in this list';

test.describe('content list editor article picker', () => {
    test('an added article is dimmed in the picker after reopening the list', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('dim already-added test');
        const article = FIXTURE_ARTICLES.published;
        const contentLists = new ContentLists(page);
        const pickerArticle = contentLists.getPickerArticle(article.id);

        await contentLists.openList(list._id);

        // Before adding: the published article is offered normally.
        await expect(pickerArticle).toBeVisible();
        await expect(pickerArticle).toHaveCSS('opacity', '1');
        await expect(pickerArticle).not.toHaveAttribute('title', ALREADY_IN_LIST_TOOLTIP);

        await contentLists.dragPickerArticleToList(article.id);
        await contentLists.save(list._id);

        // Navigate off the list and reopen it, so the picker re-fetches published
        // articles and can mark the ones already in the list.
        await contentLists.backToGrid();
        await contentLists.openList(list._id);

        // After adding: the same article is dimmed and tooltipped in the picker.
        await expect(pickerArticle).toBeVisible();
        await expect(pickerArticle).toHaveCSS('opacity', '0.5');
        await expect(pickerArticle).toHaveAttribute('title', ALREADY_IN_LIST_TOOLTIP);
    });
});
