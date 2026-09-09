import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot} from '../../utils';
import {ContentLists} from '../../page-object-models/content-lists';
import {createContentList} from './api-helpers';

test.describe('content lists grid', () => {
    test('empty state and creating a list', async ({page}) => {
        await restoreDatabaseSnapshot();

        const contentLists = new ContentLists(page);

        await contentLists.openGrid();
        await expect(page.getByText('No content lists yet')).toBeVisible();

        await contentLists.createList('breaking news');

        await expect(contentLists.getCard('breaking news')).toBeVisible();
    });

    test('renaming a list via settings', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('sports');

        const contentLists = new ContentLists(page);

        await contentLists.openGrid();
        await contentLists.openListSettings('sports');

        await contentLists.settingsModal.getByTestId('content-list-settings--name').fill('sports updated');
        await contentLists.saveListSettings();

        await expect(contentLists.getCard('sports updated')).toBeVisible();
    });

    test('editing list settings', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('politics');

        const contentLists = new ContentLists(page);

        await contentLists.openGrid();
        await contentLists.openListSettings('politics');

        await contentLists.settingsModal.getByTestId('content-list-settings--limit').fill('2');
        await contentLists.settingsModal
            .getByTestId('content-list-settings--description')
            .fill('top political stories');
        await contentLists.saveListSettings();

        // re-open to verify persistence
        await contentLists.openListSettings('politics');

        await expect(contentLists.settingsModal.getByTestId('content-list-settings--limit')).toHaveValue('2');
        await expect(contentLists.settingsModal.getByTestId('content-list-settings--description'))
            .toHaveValue('top political stories');
    });

    test('deleting a list', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('to delete');

        const contentLists = new ContentLists(page);

        await contentLists.openGrid();
        await contentLists.removeList('to delete');

        await expect(contentLists.getCard('to delete')).toHaveCount(0);
    });

    test('filtering lists with the search bar', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('alpha list');
        await createContentList('beta list');

        const contentLists = new ContentLists(page);

        await contentLists.openGrid();

        await expect(contentLists.getCard('alpha list')).toBeVisible();
        await expect(contentLists.getCard('beta list')).toBeVisible();

        await contentLists.filterLists('alpha');

        await expect(contentLists.getCard('beta list')).toHaveCount(0);
        await expect(contentLists.getCard('alpha list')).toBeVisible();
    });
});
