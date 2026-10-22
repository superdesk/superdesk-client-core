import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Create new empty package" (1308524902).
 *
 * An empty package is created from the "+" menu in Monitoring, its fields are
 * filled in, and the unsaved-changes dialog raised by Close is exercised in all
 * three directions (Cancel / Ignore / Save).
 *
 * Two documented expected results are not covered, both blocked on the product
 * rather than on the test:
 *
 * - "Packages can be created in Monitoring view and Personal space". Personal
 *   space has no package creation entry point: `InitialView` renders the
 *   "Create package" option behind `!sdApi.navigation.isPersonalSpace()`
 *   (scripts/core/ui/components/content-create-dropdown/initial-view.tsx).
 * - "Packages cannot be created in Custom Workspace". The option is offered in a
 *   custom workspace exactly as it is on a desk, and clicking it opens a package
 *   editor. The documented restriction does not exist in the product, and
 *   asserting the behaviour as it stands would encode the contradiction.
 */
test.setTimeout(90000);

test.describe('creating a new empty package', {
    annotation: [
        {type: 'confluence', description: '1308524902 partial'}, // Create new empty package
    ],
}, () => {
    const HEADLINE = 'empty package headline';
    const SLUGLINE = 'empty-package-slugline';

    // Everything the Sports desk lists in Monitoring on the `main` snapshot: four
    // items in the Working Stage plus the published one in the desk output group.
    const SPORTS_MONITORING_ITEMS = [
        'test sports story',
        'story 2',
        'Story 3',
        'Package Highlight 1',
        'Story 5',
    ];

    function monitoringItems(page: Page): Locator {
        return page.getByTestId('monitoring-view').getByTestId('article-item');
    }

    function monitoringItem(page: Page, label: string): Locator {
        return monitoringItems(page).and(page.locator(`[data-test-value="${label}"]`));
    }

    function packageHeadline(page: Page): Locator {
        return page.getByTestId('authoring').getByTestId('package-title');
    }

    function packageSlugline(page: Page): Locator {
        return page.getByTestId('authoring').getByTestId('field-slugline');
    }

    // Waits for the whole listing, not just the first item: every
    // `sd-monitoring-group` runs its own debounced query
    // (scripts/apps/monitoring/directives/MonitoringGroup.ts) and a desk switch
    // leaves the previous desk's items in the DOM until the new groups answer.
    async function openSportsMonitoring(page: Page): Promise<void> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        for (const label of SPORTS_MONITORING_ITEMS) {
            await expect(monitoringItem(page, label)).toBeVisible();
        }

        await expect(monitoringItems(page)).toHaveCount(SPORTS_MONITORING_ITEMS.length);
    }

    async function createAndFillPackage(page: Page): Promise<void> {
        await new Monitoring(page).createEmptyPackage();

        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(packageHeadline(page)).toBeVisible();

        await packageHeadline(page).fill(HEADLINE);
        await packageSlugline(page).fill(SLUGLINE);

        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeEnabled();
    }

    function globalSearchItems(page: Page): Locator {
        return page.getByTestId('article-item');
    }

    async function openGlobalSearch(page: Page): Promise<void> {
        await page.goto('/#/search');

        // Without the unfiltered list, a search that never ran looks the same as
        // one that returned nothing.
        await expect(globalSearchItems(page).first()).toBeVisible();
    }

    // The global search bar has no test id; #search-input plus Enter is how
    // search.spec.ts and monitoring.misc.spec.ts drive it.
    async function runGlobalSearch(page: Page, query: string): Promise<void> {
        await openGlobalSearch(page);

        const input = page.locator('#search-input');

        await input.click();
        await input.fill(query);
        await input.press('Enter');
    }

    test('Cancel returns to the package and Ignore discards it without creating anything', async ({page}) => {
        await restoreDatabaseSnapshot();

        await openGlobalSearch(page);

        const searchItemsBefore = await globalSearchItems(page).count();

        await openSportsMonitoring(page);
        await createAndFillPackage(page);

        const topbar = page.getByTestId('authoring-topbar');
        const prompt = page.getByTestId('unsaved-changes-dialog');

        await topbar.getByTestId('close').click();
        await expect(prompt).toBeVisible();

        await prompt.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(prompt).toBeHidden();
        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(packageHeadline(page)).toHaveValue(HEADLINE);
        await expect(packageSlugline(page)).toHaveValue(SLUGLINE);

        await topbar.getByTestId('close').click();
        await prompt.getByRole('button', {name: 'Ignore', exact: true}).click();

        await expect(page.getByTestId('authoring')).toBeHidden();

        // `createEmptyPackage` posts the package with an empty headline, so a
        // leftover could never be matched by a HEADLINE locator. The total is the
        // guard: a discarded package stays at `version: 0`, which
        // apps/archive/resource.py filters out of every archive query.
        await expect(monitoringItems(page)).toHaveCount(SPORTS_MONITORING_ITEMS.length);
        await expect(monitoringItem(page, HEADLINE)).toHaveCount(0);

        // The unfiltered total proves nothing was persisted. A HEADLINE query
        // cannot: the headline only reached the autosave record that Ignore drops.
        await openGlobalSearch(page);
        await expect(globalSearchItems(page)).toHaveCount(searchItemsBefore);

        await runGlobalSearch(page, HEADLINE);
        await expect(globalSearchItems(page)).toHaveCount(0);
    });

    test('Save in the unsaved changes dialog creates the package and closes it', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openSportsMonitoring(page);
        await createAndFillPackage(page);

        const prompt = page.getByTestId('unsaved-changes-dialog');

        await page.getByTestId('authoring-topbar').getByTestId('close').click();
        await expect(prompt).toBeVisible();

        await prompt.getByRole('button', {name: 'Save', exact: true}).click();

        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(monitoringItem(page, HEADLINE)).toBeVisible();
    });

    test('the topbar Save keeps the package open, deactivates Save and persists the fields', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openSportsMonitoring(page);
        await createAndFillPackage(page);

        const topbar = page.getByTestId('authoring-topbar');

        await topbar.getByTestId('save').click();

        // `saveTopbarLoading` disables Save on its own for the length of the
        // request (authoring-topbar.html), so a disabled Save only means the
        // package is clean once the spinner has gone.
        await expect(topbar.getByTestId('save').getByTestId('loading-indicator')).toBeVisible();
        await expect(topbar.getByTestId('save').getByTestId('loading-indicator')).toBeHidden();
        await expect(topbar.getByTestId('save')).toBeDisabled();
        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(monitoringItem(page, HEADLINE)).toBeVisible();

        await topbar.getByTestId('close').click();
        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(page.getByTestId('unsaved-changes-dialog')).toHaveCount(0);

        await runGlobalSearch(page, HEADLINE);

        const results = globalSearchItems(page);

        // The unfiltered listing already holds the package, so only the whole
        // result list being that single item proves the query was applied.
        await expect(results).toHaveCount(1);
        await expect(results).toHaveAttribute('data-test-value', HEADLINE);

        // Reopening is the last step on purpose: a reopened package intermittently
        // reports itself dirty with no edit made, so closing it again raises the
        // unsaved-changes dialog.
        await page.goto('/#/workspace/monitoring');
        await monitoringItem(page, HEADLINE).dblclick();

        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(packageHeadline(page)).toHaveValue(HEADLINE);
        await expect(packageSlugline(page)).toHaveValue(SLUGLINE);
    });
});
