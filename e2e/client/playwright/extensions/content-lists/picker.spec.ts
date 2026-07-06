import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../../utils';
import {FIXTURE_ARTICLES, createContentList} from './api-helpers';

test.describe('content list editor article picker', () => {
    test('published source is the default and shows published articles', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('picker test');

        await page.goto(`/#/content-lists/${list._id}`);

        const results = page.locator(s('content-list--picker-results'));

        await expect(
            results.locator(s(`content-list-item=${FIXTURE_ARTICLES.published.id}`)),
        ).toBeVisible();
        await expect(
            results.locator(s(`content-list-item=${FIXTURE_ARTICLES.inProgress.id}`)),
        ).toHaveCount(0);
    });

    test('switching the source to "In progress"', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('picker source test');

        await page.goto(`/#/content-lists/${list._id}`);

        await page.locator(s('content-list--picker-pane')).getByRole('button', {name: 'Published'}).click();
        await page.getByRole('button', {name: 'In progress'}).click();

        const results = page.locator(s('content-list--picker-results'));

        await expect(
            results.locator(s(`content-list-item=${FIXTURE_ARTICLES.inProgress.id}`)),
        ).toBeVisible();
        await expect(
            results.locator(s(`content-list-item=${FIXTURE_ARTICLES.published.id}`)),
        ).toHaveCount(0);
    });

    test('searching articles', async ({page}) => {
        await restoreDatabaseSnapshot();

        const list = await createContentList('picker search test');

        await page.goto(`/#/content-lists/${list._id}`);

        const pickerPane = page.locator(s('content-list--picker-pane'));
        const results = page.locator(s('content-list--picker-results'));

        await expect(
            results.locator(s(`content-list-item=${FIXTURE_ARTICLES.published.id}`)),
        ).toBeVisible();

        await pickerPane.getByPlaceholder('Search articles').fill('no-such-article-anywhere');

        await expect(page.getByText('No results')).toBeVisible();
    });
});
