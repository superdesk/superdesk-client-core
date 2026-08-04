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

    function openWidget(page: Page): Promise<void> {
        return page.getByTestId('widget-icon').and(page.locator('[data-test-value="related-item"]')).click();
    }

    test('lists the items already sharing an event id with the article', async ({page}) => {
        // the fixture adds a second archive item carrying the event id of "test sports story"
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.executeActionOnMonitoringItem(articleInWorkingStage(page, 'test sports story'), 'Edit');
        await authoring.waitForAuthoringReactToInitialize();

        await openWidget(page);

        const widget = page.getByTestId('related-items-widget');

        await expect(widget).toBeVisible();
        await expect(
            widget.getByTestId('related-item').filter({hasText: 'related story fixture'}),
        ).toBeVisible();

        // relations exist, so the widget must not offer the "relate an item" search
        await expect(page.getByTestId('related-items-search-input')).toHaveCount(0);
    });

    test('offers a slugline search when the article has no relations', async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'related-items'});

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.executeActionOnMonitoringItem(articleInWorkingStage(page, 'story 2'), 'Edit');
        await authoring.waitForAuthoringReactToInitialize();

        await openWidget(page);

        const widget = page.getByTestId('related-items-widget');

        await expect(widget).toBeVisible();

        // the search starts from the article's own slugline, as in authoring-angular
        await expect(widget.getByTestId('related-items-search-input')).toHaveValue('story 2');
        await expect(widget.getByTestId('related-items-last-updated')).toBeVisible();

        // No snapshot item can match: every one of them predates the default "today" window. So the
        // query itself is what gets asserted, rather than the (always empty) result list.
        const exactMatchQuery = page.waitForRequest(
            (request) => searchQueryContains(request.url(), 'slugline.phrase:("story 2")'),
        );

        await widget.getByTestId('related-items-search-button').click();
        await exactMatchQuery;

        const prefixMatchQuery = page.waitForRequest(
            (request) => searchQueryContains(request.url(), '"match_phrase_prefix":{"slugline.phrase":"story 2"}'),
        );

        // changing the match mode must re-run the search with the other query shape
        await widget.getByTestId('related-items-slugline-match').selectOption('PREFIX');
        await prefixMatchQuery;
    });
});
