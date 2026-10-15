import {test, expect, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Related items" (Authoring widgets, 1310294133).
 *
 * The widget only ever searches on slugline: the keyword typed into its search box is matched
 * against `slugline` (exact phrase by default), so "same slugline or keywords" from the case
 * description is a single behaviour in the product, covered here as one search round trip.
 *
 * The `authoring-header` snapshot is used because the widget also filters on
 * `versioncreated >= today`, and that snapshot is the only one carrying an item recent enough to
 * survive it: "Story 3 sibling", dated 2099 and sharing the slugline "Story 3". Under the `main`
 * snapshot every item predates the current day, so any search returns nothing.
 */

const ARTICLE = 'Story 3';
const SLUGLINE = 'Story 3';
const MATCHING_ITEM = 'Story 3 sibling';

function relatedItemsTab(page: Page) {
    return page.getByTestId('authoring-widget').and(page.locator('[data-test-value="Related Items"]'));
}

async function openFromSportsWorkingStage(page: Page, label: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    // matched on data-test-value rather than hasText: the fixture holds items whose labels are
    // prefixes of one another ("Story 3" / "Story 3 rewrite")
    await monitoring.executeActionOnMonitoringItem(
        page
            .getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'))
            .getByTestId('article-item')
            .and(page.locator(`[data-test-value="${label}"]`)),
        'Edit',
    );

    await expect(page.getByTestId('authoring')).toBeVisible();
}

test.describe('related items widget', () => {
    test('lists same-slugline items and re-lists them from a keyword typed in the search box', {
        annotation: [
            {type: 'confluence', description: '1310294133 complete'}, // Related items
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});
        await openFromSportsWorkingStage(page, ARTICLE);

        // the tab label flips to "Relate an item" once the widget has loaded and found no
        // existing relations, so it can only be selected by its initial label
        await expect(relatedItemsTab(page)).toBeVisible();
        await relatedItemsTab(page).click();

        const widget = page.getByTestId('authoring-widget-panel').getByTestId('related-items-widget');
        const searchInput = widget.getByTestId('related-items-search-input');
        const searchButton = widget.getByTestId('related-items-search-button');
        const results = widget.getByTestId('related-items-list-item');

        await expect(widget.getByTestId('related-items-search')).toBeVisible();
        await expect(searchInput).toHaveValue(SLUGLINE);

        await expect(results).toHaveCount(1);
        await expect(results).toHaveAttribute('data-test-value', SLUGLINE);
        await expect(results).toContainText(MATCHING_ITEM);

        await searchInput.fill('slugline nothing shares');
        await searchButton.click();
        await expect(results).toHaveCount(0);

        // the widget refuses to search on fewer than two characters
        await searchInput.fill('S');
        await expect(searchButton).toBeDisabled();

        await searchInput.fill(SLUGLINE);
        await expect(searchButton).toBeEnabled();
        await searchButton.click();

        await expect(results).toHaveCount(1);
        await expect(results).toContainText(MATCHING_ITEM);
    });

    test('is not offered while editing a package', {
        annotation: [
            {type: 'confluence', description: '1310294133 complete'}, // Related items
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await openFromSportsWorkingStage(page, 'Package Highlight 1');

        // an unrelated tab of the same bar, to tell "no Related Items tab" apart from
        // "the widget bar has not rendered yet"
        await expect(
            page.getByTestId('authoring-widget').and(page.locator('[data-test-value="Versions/History"]')),
        ).toBeVisible();

        await expect(relatedItemsTab(page)).toHaveCount(0);
    });
});
