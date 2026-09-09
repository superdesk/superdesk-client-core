import {test, expect, Locator, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test.describe('related items widget in authoring-react', () => {
    function articleInWorkingStage(page: Page, title: string): Locator {
        return page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .filter({hasText: title});
    }

    /**
     * The elasticsearch query travels as a JSON url param, where angular encodes spaces as `+` and
     * the JSON itself escapes the inner quotes. Neither survives a plain `decodeURIComponent`.
     */
    function searchQueryContains(url: string, fragment: string): boolean {
        const decoded = decodeURIComponent(url).replace(/\+/g, ' ').replace(/\\/g, '');

        return decoded.includes('/api/search') && decoded.includes(fragment);
    }

    async function openArticleFor(page: Page, articleTitle: string): Promise<void> {
        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.executeActionOnMonitoringItem(articleInWorkingStage(page, articleTitle), 'Edit');
        await authoring.waitForAuthoringReactToInitialize();
    }

    async function openWidgetFor(page: Page, articleTitle: string): Promise<Locator> {
        await openArticleFor(page, articleTitle);

        await page.getByTestId('widget-icon').and(page.locator('[data-test-value="related-item"]')).click();

        const widget = page.getByTestId('related-items-widget');

        await expect(widget).toBeVisible();

        return widget;
    }

    /**
     * The text of an item once collapsed to nothing in this ~270px panel. The box is measured
     * rather than the text, whose width only tracks the fixture's slugline, and a box that is not
     * found fails rather than passes.
     */
    async function expectTextColumnNotCollapsed(item: Locator): Promise<void> {
        const contentWidth = await item.evaluate((el) => {
            const content = el.querySelector('.boxed-list__item-content');

            return content == null ? null : content.getBoundingClientRect().width;
        });
        const itemBox = await item.boundingBox();

        expect(contentWidth).not.toBeNull();
        expect(itemBox).not.toBeNull();
        expect(contentWidth!).toBeGreaterThan(itemBox!.width / 3);
    }

    test('lists the items already sharing an event id with the article', async ({page}) => {
        // the fixture adds a second archive item carrying the event id of "test sports story"
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        const widget = await openWidgetFor(page, 'test sports story');
        const relatedItem = widget.getByTestId('related-item').filter({hasText: 'related story fixture'});

        await expect(relatedItem).toBeVisible();
        await expect(relatedItem.getByTestId('field--slugline')).toHaveText('related story fixture');
        await expect(relatedItem.getByTestId('related-item-desk')).toHaveText('desk: Sports');
        await expect(relatedItem.getByTestId('related-item-stage')).toHaveText('stage: Working Stage');

        await expectTextColumnNotCollapsed(relatedItem);

        // the search, and the settings that shape it, belong to the other mode
        await expect(page.getByTestId('related-items-search-input')).toHaveCount(0);
        await expect(page.getByTestId('widget-configuration')).toHaveCount(0);
    });

    test('previews a related item when its row is clicked', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        const widget = await openWidgetFor(page, 'test sports story');

        await widget.getByTestId('related-item').filter({hasText: 'related story fixture'}).click();

        await expect(page.getByTestId('print-preview-last-modified')).toBeVisible();

        // the label names the item the preview rendered, not the article being edited
        await expect(page.getByTestId('print-preview-label')).toHaveText('related story fixture');
    });

    test('previews a related item reached with the keyboard', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        const widget = await openWidgetFor(page, 'test sports story');

        // tabbing on from the control before it must land on the row, not skip past it
        await widget.getByTestId('related-item').first().getByTestId('related-item-actions')
            .locator('button').focus();
        await page.keyboard.press('Tab');

        const focused = await page.evaluate(() => ({
            testId: document.activeElement?.getAttribute('data-test-id') ?? null,
            item: document.activeElement
                ?.closest('[data-test-id="related-item"]')?.getAttribute('data-test-value') ?? null,
        }));

        expect(focused).toEqual({testId: 'related-item-content', item: 'related story fixture'});

        await page.keyboard.press('Enter');

        await expect(page.getByTestId('print-preview-label')).toHaveText('related story fixture');
    });

    test('previews a related item that carries no content profile', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        // the widget is offered on items with no content profile, and resolving a profile for one
        // throws. No fixture carries such an item, so the search results are stripped of theirs.
        await page.route('**/api/search*', async (route) => {
            const response = await route.fetch();
            const body = await response.json();

            for (const item of body._items ?? []) {
                delete item.profile;
            }

            await route.fulfill({response, json: body});
        });

        const widget = await openWidgetFor(page, 'test sports story');

        await widget.getByTestId('related-item').filter({hasText: 'related story fixture'}).click();

        await expect(page.getByTestId('print-preview-last-modified')).toBeVisible();
    });

    test('offers the standard item actions on an existing relation', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        const widget = await openWidgetFor(page, 'test sports story');

        await widget.getByTestId('related-item')
            .filter({hasText: 'related story fixture'})
            .getByTestId('related-item-actions')
            .click();

        const menu = page.getByTestId('context-menu');

        await expect(menu).toBeVisible();
        await expect(menu.getByRole('button', {name: 'Spike Item', exact: true})).toBeVisible();
    });

    test('drops and restores its tab as the article moves between content profiles', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        // the widget searches on the slugline, so a profile without one hides it. No two profiles
        // in the snapshot differ that way, so the Text profile is stripped of its slugline here.
        await page.route('**/api/content_types*', async (route) => {
            const response = await route.fetch();
            const body = await response.json();

            for (const profile of body._items ?? []) {
                if (profile._id === 'text') {
                    delete profile.schema?.slugline;
                }
            }

            await route.fulfill({response, json: body});
        });

        await openArticleFor(page, 'test sports story');

        const tab = page.getByTestId('widget-icon').and(page.locator('[data-test-value="related-item"]'));

        await expect(tab).toBeVisible();

        await page.getByTestId('content-profile-select').selectOption('text');
        await expect(tab).toHaveCount(0);

        await page.getByTestId('content-profile-select').selectOption('655494fc71839faddb615a24');
        await expect(tab).toBeVisible();
    });

    test('offers a slugline search when the article has no relations', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        const widget = await openWidgetFor(page, 'story 2');

        // the search starts from the article's own slugline, as in authoring-angular
        await expect(widget.getByTestId('related-items-search-input')).toHaveValue('story 2');

        // no snapshot item can match: every one of them predates the default "today" window
        await expect(widget.getByTestId('related-items-empty-state')).toHaveText(/No items found/);

        await expect(widget.getByTestId('related-items-slugline-match')).toHaveCount(0);
        await expect(page.getByTestId('widget-configuration')).toBeVisible();
    });

    test('searches when enter is pressed in the search field', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        const widget = await openWidgetFor(page, 'story 2');

        // a repeat of the query the widget runs when it opens would be answered from the
        // duplicate-request cache in `api-service`, without a request being made at all
        const search = page.waitForRequest(
            (request) => searchQueryContains(request.url(), 'slugline.phrase:("test sports story")'),
        );

        await widget.getByTestId('related-items-search-input').fill('test sports story');
        await widget.getByTestId('related-items-search-input').press('Enter');

        await search;
    });

    test('runs the search with the match mode saved in the widget configuration', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        await openWidgetFor(page, 'story 2');

        await page.getByTestId('widget-configuration').click();

        const configuration = page.getByTestId('side-widget-configuration-modal');

        await expect(configuration).toBeVisible();
        await configuration.getByTestId('related-items-slugline-match').selectOption('PREFIX');

        const prefixMatchQuery = page.waitForRequest(
            (request) => searchQueryContains(request.url(), '"match_phrase_prefix":{"slugline.phrase":"story 2"}'),
        );

        await configuration.getByTestId('side-widget-configuration-save').click();
        await prefixMatchQuery;

        await expect(configuration).toHaveCount(0);
    });
});
