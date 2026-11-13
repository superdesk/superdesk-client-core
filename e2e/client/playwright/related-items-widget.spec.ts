import {test, expect, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Related items" (1310294133). The widget searches on slugline only, so "same slugline or keywords"
 * is a single search.
 * Uses `authoring-header`: the widget also filters on `versioncreated >= today` and only that snapshot has a recent
 * item ("Story 3 sibling", 2099). Under `main` every search is empty.
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

    // data-test-value, not hasText: some labels are prefixes of others ("Story 3" / "Story 3 rewrite")
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

        // the label flips to "Relate an item" once loaded with no relations, so select by the initial label
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

        // another tab of the bar, to tell "no Related Items tab" from "bar not rendered yet"
        await expect(
            page.getByTestId('authoring-widget').and(page.locator('[data-test-value="Versions/History"]')),
        ).toBeVisible();

        await expect(relatedItemsTab(page)).toHaveCount(0);
    });
});
