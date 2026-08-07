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
 *   space has no package creation entry point. `InitialView` renders the
 *   "Create package" option behind `!sdApi.navigation.isPersonalSpace()`
 *   (scripts/core/ui/components/content-create-dropdown/initial-view.tsx), and
 *   on top of that the whole "+" dropdown fails to render there: its
 *   componentDidMount reads `getCurrentDesk().default_content_template` and
 *   `getCurrentDesk()` is null in personal space, so the popup stays empty.
 *   That second half is a live regression which also fails the existing
 *   `monitoring.personal-space.spec.ts` "creating an article" test on develop.
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

    // Sports carries five items in the `main` snapshot. Pinning the number is
    // what lets the discard test prove nothing was left behind: a locator
    // matched on HEADLINE cannot see an untitled leftover.
    const SPORTS_ITEM_COUNT = 5;

    function monitoringItems(page: Page): Locator {
        return page.getByTestId('monitoring-view').getByTestId('article-item');
    }

    function monitoringItem(page: Page): Locator {
        return monitoringItems(page).and(page.locator(`[data-test-value="${HEADLINE}"]`));
    }

    function packageHeadline(page: Page): Locator {
        return page.getByTestId('authoring').getByTestId('package-title');
    }

    function packageSlugline(page: Page): Locator {
        return page.getByTestId('authoring').getByTestId('field-slugline');
    }

    async function openSportsMonitoring(page: Page): Promise<void> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await expect(monitoringItems(page)).toHaveCount(SPORTS_ITEM_COUNT);
    }

    /**
     * Opens an empty package from the "+" menu and fills the two fields the
     * package editor exposes: Headline (the package header) and Slugline (the
     * authoring header).
     */
    async function createAndFillPackage(page: Page): Promise<void> {
        await new Monitoring(page).createEmptyPackage();

        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(packageHeadline(page)).toBeVisible();

        await packageHeadline(page).fill(HEADLINE);
        await packageSlugline(page).fill(SLUGLINE);

        await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeEnabled();
    }

    // The global search bar carries no data-test-id; #search-input plus ENTER is
    // the established way to drive it (search.spec.ts, monitoring.misc.spec.ts).
    async function runGlobalSearch(page: Page, query: string): Promise<void> {
        await page.goto('/#/search');

        // Assert the unfiltered result list first: without it a search that never
        // ran is indistinguishable from a search that returned nothing.
        await expect(page.getByTestId('article-item').first()).toBeVisible();

        const input = page.locator('#search-input');

        await input.click();
        await input.fill(query);
        await input.press('Enter');
    }

    test('Cancel returns to the package and Ignore discards it without creating anything', async ({page}) => {
        await restoreDatabaseSnapshot();
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
        await expect(monitoringItems(page)).toHaveCount(SPORTS_ITEM_COUNT);
        await expect(monitoringItem(page)).toHaveCount(0);

        await runGlobalSearch(page, HEADLINE);
        await expect(page.getByTestId('article-item')).toHaveCount(0);
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
        await expect(monitoringItem(page)).toBeVisible();
    });

    test('the topbar Save keeps the package open, deactivates Save and persists the fields', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openSportsMonitoring(page);
        await createAndFillPackage(page);

        const topbar = page.getByTestId('authoring-topbar');

        await topbar.getByTestId('save').click();

        await expect(topbar.getByTestId('save')).toBeDisabled();
        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(monitoringItem(page)).toBeVisible();

        // A saved package is no longer dirty, so Close must go through without
        // raising the unsaved-changes dialog.
        await topbar.getByTestId('close').click();
        await expect(page.getByTestId('authoring')).toBeHidden();
        await expect(page.getByTestId('unsaved-changes-dialog')).toHaveCount(0);

        await runGlobalSearch(page, HEADLINE);

        const results = page.getByTestId('article-item');

        // The unfiltered listing already holds the package, so "one item with
        // this Headline is present" is true before the query is applied. Only
        // the whole result list being that single item proves the search ran.
        await expect(results).toHaveCount(1);
        await expect(results).toHaveAttribute('data-test-value', HEADLINE);

        // Reopening is the last step on purpose: a reopened package intermittently
        // reports itself dirty with no edit made, so closing it again raises the
        // unsaved-changes dialog. Nothing needs asserting past this point, so the
        // test ends with the package open instead of racing that dialog.
        await page.goto('/#/workspace/monitoring');
        await monitoringItem(page).dblclick();

        await expect(page.getByTestId('authoring')).toBeVisible();
        await expect(packageHeadline(page)).toHaveValue(HEADLINE);
        await expect(packageSlugline(page)).toHaveValue(SLUGLINE);
    });
});
