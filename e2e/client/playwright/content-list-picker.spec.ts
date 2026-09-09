import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {ContentLists} from './page-object-models/content-lists';
import {FIXTURE_ARTICLES, createContentList} from './utils/content-lists-api';

test.describe('content list editor article picker', () => {
    test('published source is the default and shows published articles', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('picker test');
        const contentLists = new ContentLists(page);

        await contentLists.openList(list._id);

        await expect(contentLists.getPickerArticle(FIXTURE_ARTICLES.published.id)).toBeVisible();
        await expect(contentLists.getPickerArticle(FIXTURE_ARTICLES.inProgress.id)).toHaveCount(0);
    });

    test('switching the source to "In progress"', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('picker source test');
        const contentLists = new ContentLists(page);

        await contentLists.openList(list._id);
        await contentLists.selectPickerSource('in_progress');

        await expect(contentLists.getPickerArticle(FIXTURE_ARTICLES.inProgress.id)).toBeVisible();
        await expect(contentLists.getPickerArticle(FIXTURE_ARTICLES.published.id)).toHaveCount(0);
    });

    test('searching articles', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('picker search test');
        const contentLists = new ContentLists(page);

        await contentLists.openList(list._id);
        await expect(contentLists.getPickerArticle(FIXTURE_ARTICLES.published.id)).toBeVisible();

        await contentLists.searchArticles('no-such-article-anywhere');

        await expect(page.getByText('No results')).toBeVisible();
    });
});
