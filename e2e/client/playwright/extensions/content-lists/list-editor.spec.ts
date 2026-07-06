import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../../utils';
import {
    FIXTURE_ARTICLES,
    addListItems,
    createContentList,
    dragAndDrop,
    updateListItems,
} from './api-helpers';

test.describe('content list editor', () => {
    test('opening a list via the Edit button and via a deep link', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('editor test');

        await page.goto('/#/content-lists');
        await page.locator(s('content-list-card=editor test', 'content-list-card--edit')).click();

        await expect(page.locator(s('content-list--editor'))).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`#/content-lists/${list._id}$`));

        // deep link
        await page.goto(`/#/content-lists/${list._id}`);
        await expect(page.locator(s('content-list--editor'))).toBeVisible();

        // back navigation returns to the grid
        await page.getByRole('button', {name: 'Back to content lists'}).click();
        await expect(page.locator(s('content-lists--grid'))).toBeVisible();
    });

    test('dragging an article into the list and saving', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('drag target');

        await page.goto(`/#/content-lists/${list._id}`);

        await expect(page.getByText('Drag your articles here')).toBeVisible();

        // switch the picker to "In progress" articles
        await page.locator(s('content-list--picker-pane')).getByRole('button', {name: 'Published'}).click();
        await page.getByRole('button', {name: 'In progress'}).click();

        const pickerArticle = page
            .locator(s('content-list--picker-results'))
            .locator(s(`content-list-item=${FIXTURE_ARTICLES.inProgress.id}`));

        await expect(pickerArticle).toBeVisible();

        await dragAndDrop(page, pickerArticle, page.locator(s('content-list--items')));

        const listedArticle = page
            .locator(s('content-list--items'))
            .locator(s(`content-list-item=${FIXTURE_ARTICLES.inProgress.id}`));

        await expect(listedArticle).toBeVisible();

        const saveButton = page.locator(s('content-list--items-pane')).getByRole('button', {name: 'Save'});

        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        // persisted after reload
        await page.reload();
        await expect(
            page
                .locator(s('content-list--items'))
                .locator(s(`content-list-item=${FIXTURE_ARTICLES.inProgress.id}`)),
        ).toBeVisible();
    });

    test('save button is disabled without changes; removing an item enables it', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('remove test');

        await addListItems(list._id, [FIXTURE_ARTICLES.inProgress.id, FIXTURE_ARTICLES.published.id]);

        await page.goto(`/#/content-lists/${list._id}`);

        const itemsPane = page.locator(s('content-list--items-pane'));
        const saveButton = itemsPane.getByRole('button', {name: 'Save'});

        await expect(
            page.locator(s('content-list--items')).locator(s('content-list-item')),
        ).toHaveCount(2);
        await expect(saveButton).toBeDisabled();

        await page
            .locator(s('content-list--items'))
            .locator(s(`content-list-item=${FIXTURE_ARTICLES.published.id}`))
            .getByRole('button', {name: 'Remove'})
            .click();

        await expect(
            page.locator(s('content-list--items')).locator(s('content-list-item')),
        ).toHaveCount(1);
        await expect(saveButton).toBeEnabled();

        await saveButton.click();

        await page.reload();
        await expect(
            page.locator(s('content-list--items')).locator(s('content-list-item')),
        ).toHaveCount(1);
    });

    test('pinning an item marks it and disables dragging it', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('pin test');

        await addListItems(list._id, [FIXTURE_ARTICLES.inProgress.id, FIXTURE_ARTICLES.published.id]);

        await page.goto(`/#/content-lists/${list._id}`);

        const firstItem = page
            .locator(s('content-list--items'))
            .locator(s(`content-list-item=${FIXTURE_ARTICLES.inProgress.id}`));

        await firstItem.getByRole('button', {name: 'Pin'}).click();

        await expect(firstItem.getByText('pinned')).toBeVisible();

        await page.locator(s('content-list--items-pane')).getByRole('button', {name: 'Save'}).click();

        await page.reload();
        await expect(
            page
                .locator(s('content-list--items'))
                .locator(s(`content-list-item=${FIXTURE_ARTICLES.inProgress.id}`))
                .getByText('pinned'),
        ).toBeVisible();
    });

    test('limit notification is shown for items over the limit', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('limited list', {limit: 1});

        await addListItems(list._id, [FIXTURE_ARTICLES.inProgress.id, FIXTURE_ARTICLES.published.id]);

        await page.goto(`/#/content-lists/${list._id}`);

        await expect(page.locator(s('content-list--limit-notification'))).toBeVisible();
        await expect(
            page.getByText('This list is limited to 1 items. Articles below will be removed.'),
        ).toBeVisible();
    });

    test('saving stale changes shows a conflict error', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('conflict test');

        await addListItems(list._id, [FIXTURE_ARTICLES.inProgress.id]);

        await page.goto(`/#/content-lists/${list._id}`);

        // make a local change
        await page
            .locator(s('content-list--items'))
            .locator(s(`content-list-item=${FIXTURE_ARTICLES.inProgress.id}`))
            .getByRole('button', {name: 'Remove'})
            .click();

        // meanwhile the list is modified by "another user"
        await updateListItems(list._id, [
            {action: 'add', contentId: FIXTURE_ARTICLES.published.id, position: 1},
        ]);

        await page.locator(s('content-list--items-pane')).getByRole('button', {name: 'Save'}).click();

        await expect(
            page.getByText('Cannot save. The list has been modified by another user.'),
        ).toBeVisible();
    });
});
