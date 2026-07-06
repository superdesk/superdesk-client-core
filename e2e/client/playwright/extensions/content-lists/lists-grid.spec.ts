import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../../utils';
import {createContentList} from './api-helpers';

test.describe('content lists grid', () => {
    test('empty state and creating a list', async ({page}) => {
        await restoreDatabaseSnapshot();

        await page.goto('/#/content-lists');

        await expect(page.locator(s('content-lists--grid'))).toBeVisible();
        await expect(page.getByText('No content lists yet')).toBeVisible();

        await page.getByRole('button', {name: 'Create new content list'}).click();
        await page.locator(s('content-lists--new-list-name')).fill('breaking news');
        await page.getByRole('button', {name: 'Create list'}).click();

        await expect(
            page.locator(s('content-list-card=breaking news')),
        ).toBeVisible();
    });

    test('renaming a list inline', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('sports');

        await page.goto('/#/content-lists');

        const card = page.locator(s('content-list-card=sports'));

        await card.locator(s('content-list-card--name')).click();
        await card.locator(s('content-list-card--name-input')).fill('sports updated');
        await card.getByRole('button', {name: 'Save name'}).click();

        await expect(page.locator(s('content-list-card=sports updated'))).toBeVisible();
    });

    test('editing list settings', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('politics');

        await page.goto('/#/content-lists');

        const card = page.locator(s('content-list-card=politics'));

        await card.getByRole('button', {name: 'Actions'}).click();
        await page.getByRole('button', {name: 'Settings'}).click();

        await page.locator(s('content-list-settings--limit')).fill('2');
        await page.locator(s('content-list-settings--description')).fill('top political stories');
        await page.getByRole('button', {name: 'Save', exact: true}).click();

        // re-open to verify persistence
        await card.getByRole('button', {name: 'Actions'}).click();
        await page.getByRole('button', {name: 'Settings'}).click();

        await expect(page.locator(s('content-list-settings--limit'))).toHaveValue('2');
        await expect(page.locator(s('content-list-settings--description'))).toHaveValue('top political stories');
    });

    test('deleting a list', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('to delete');

        await page.goto('/#/content-lists');

        const card = page.locator(s('content-list-card=to delete'));

        await card.getByRole('button', {name: 'Actions'}).click();
        await page.getByRole('button', {name: 'Remove'}).click();
        await page.locator(s('confirmation-modal')).getByRole('button', {name: 'Confirm'}).click();

        await expect(card).toHaveCount(0);
    });

    test('filtering lists with the search bar', async ({page}) => {
        await restoreDatabaseSnapshot();
        await createContentList('alpha list');
        await createContentList('beta list');

        await page.goto('/#/content-lists');

        await expect(page.locator(s('content-list-card=alpha list'))).toBeVisible();
        await expect(page.locator(s('content-list-card=beta list'))).toBeVisible();

        await page.locator(s('content-lists--grid')).getByPlaceholder('Search').fill('alpha');

        await expect(page.locator(s('content-list-card=beta list'))).toHaveCount(0);
        await expect(page.locator(s('content-list-card=alpha list'))).toBeVisible();
    });
});
