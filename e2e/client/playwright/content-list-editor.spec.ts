import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {ContentLists} from './page-object-models/content-lists';
import {
    FIXTURE_ARTICLES,
    addListItems,
    createContentList,
    updateListItems,
} from './utils/content-lists-api';

test.describe('content list editor', () => {
    test('opening a list via the Edit button and via a deep link', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('editor test');
        const contentLists = new ContentLists(page);

        await contentLists.openGrid();
        await contentLists.openListFromCard('editor test');
        await expect(page).toHaveURL(new RegExp(`#/content-lists\\?list=${list._id}$`));

        await contentLists.openList(list._id);
        await contentLists.backToGrid();
    });

    test('dragging an article into the list and saving', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('drag target');
        const article = FIXTURE_ARTICLES.inProgress;
        const contentLists = new ContentLists(page);

        await contentLists.openList(list._id);
        await expect(page.getByText('Drag your articles here')).toBeVisible();

        await contentLists.selectPickerSource('in_progress');
        await expect(contentLists.getPickerArticle(article.id)).toBeVisible();

        await contentLists.dragPickerArticleToList(article.id);
        await contentLists.save(list._id);

        await page.reload();
        await expect(contentLists.getListedArticle(article.id)).toBeVisible();
    });

    test('save button is disabled without changes; removing an item enables it', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('remove test');

        await addListItems(list._id, [FIXTURE_ARTICLES.inProgress.id, FIXTURE_ARTICLES.published.id]);

        const contentLists = new ContentLists(page);
        const listedArticles = contentLists.items.getByTestId('content-list-item');

        await contentLists.openList(list._id);

        await expect(listedArticles).toHaveCount(2);
        await expect(contentLists.saveButton).toBeDisabled();

        await contentLists.removeListedArticle(FIXTURE_ARTICLES.published.id);

        await expect(listedArticles).toHaveCount(1);
        await expect(contentLists.saveButton).toBeEnabled();

        await contentLists.save(list._id);

        await page.reload();
        await expect(listedArticles).toHaveCount(1);
    });

    test('pinning an item marks it and disables dragging it', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('pin test');
        const article = FIXTURE_ARTICLES.inProgress;

        await addListItems(list._id, [article.id, FIXTURE_ARTICLES.published.id]);

        const contentLists = new ContentLists(page);
        const pinToggle = contentLists.getListedArticle(article.id).getByTestId('content-list-item--pin');

        await contentLists.openList(list._id);
        await contentLists.togglePin(article.id);

        await expect(pinToggle).toHaveAttribute('data-test-value', 'pinned');
        await expect(pinToggle.getByRole('button', {name: 'Unpin'})).toBeVisible();

        await contentLists.save(list._id);

        await page.reload();
        await expect(pinToggle).toHaveAttribute('data-test-value', 'pinned');
    });

    test('dragging an item past pinned items leaves the pinned items in place', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('pinned block test');
        const [top, pinnedFirst, pinnedSecond, bottom] = [
            FIXTURE_ARTICLES.inProgress,
            FIXTURE_ARTICLES.inProgress2,
            FIXTURE_ARTICLES.inProgress3,
            FIXTURE_ARTICLES.published,
        ];

        await addListItems(list._id, [top.id, pinnedFirst.id, pinnedSecond.id, bottom.id]);
        await updateListItems(list._id, [
            {action: 'move', contentId: pinnedFirst.id, position: 1, sticky: true},
            {action: 'move', contentId: pinnedSecond.id, position: 2, sticky: true},
        ]);

        const contentLists = new ContentLists(page);

        await contentLists.openList(list._id);
        await expect.poll(() => contentLists.getListedOrder())
            .toEqual([top.id, pinnedFirst.id, pinnedSecond.id, bottom.id]);

        // the drop asks for the first pinned item's slot; both pinned items own
        // theirs, so the dragged item continues to the free slot below them
        await contentLists.dragAndDrop(
            contentLists.getListedArticle(top.id),
            contentLists.getListedArticle(pinnedFirst.id),
        );

        await expect.poll(() => contentLists.getListedOrder())
            .toEqual([bottom.id, pinnedFirst.id, pinnedSecond.id, top.id]);

        await contentLists.save(list._id);

        await page.reload();
        await expect.poll(() => contentLists.getListedOrder())
            .toEqual([bottom.id, pinnedFirst.id, pinnedSecond.id, top.id]);
    });

    test('limit notification is shown for items over the limit', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('limited list', {limit: 1});

        await addListItems(list._id, [FIXTURE_ARTICLES.inProgress.id, FIXTURE_ARTICLES.published.id]);

        await new ContentLists(page).openList(list._id);

        await expect(page.getByTestId('content-list--limit-notification')).toBeVisible();
        await expect(
            page.getByText('This list is limited to 1 item. Articles below will be removed.'),
        ).toBeVisible();
    });

    test('saving stale changes shows a conflict error', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('conflict test');

        await addListItems(list._id, [FIXTURE_ARTICLES.inProgress.id]);

        const contentLists = new ContentLists(page);

        await contentLists.openList(list._id);

        // make a local change
        await contentLists.removeListedArticle(FIXTURE_ARTICLES.inProgress.id);

        // meanwhile the list is modified by "another user"
        await updateListItems(list._id, [
            {action: 'add', contentId: FIXTURE_ARTICLES.published.id, position: 1},
        ]);

        // the save is expected to fail, so there is no reload to wait for
        await contentLists.saveButton.click();

        await expect(
            page.getByText('Cannot save. The list has been modified by another user.'),
        ).toBeVisible();
    });
});
