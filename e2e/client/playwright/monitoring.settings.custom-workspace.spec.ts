import {test, expect, Locator, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MonitoringSettings} from './page-object-models/monitoring-settings';
import {restoreDatabaseSnapshot} from './utils';

/**
 * Saved searches tab in the Monitoring settings of a custom workspace (confluence 1318323123).
 * All three tests in this file cover that one case; the annotation sits on the first of them,
 * because the suite keeps one annotation per case id.
 *
 * The desk variant of the same wizard (confluence 1315934715) is covered by
 * `monitoring.settings.spec.ts`; it reaches the wizard from `/#/settings/desks` and only
 * asserts that an enabled global saved search shows up on the desk's monitoring view. The
 * workspace variant covered here uses the monitoring toolbar entry point, which is the only
 * one that offers private saved searches (`showPrivateSavedSearches` in AggregateSettings).
 */

const WORKSPACE = 'Workspace 1';
const PRIVATE_SEARCH = 'my private search';

function monitoringGroup(page: Page, name: string): Locator {
    return page.getByTestId('monitoring-view').getByTestId('monitoring-group').filter({hasText: name});
}

/**
 * The `main` snapshot ships two global saved searches and no private one, so the private
 * list has to be seeded here. Saving a search is a single atomic flow (the narrow
 * in-test precondition allowed by e2e/WRITING_TESTS.md), not a loop of UI actions.
 *
 * `Save Search` is gated on `searching()`, which is just "the URL carries query params"
 * (SearchPanel.ts), so a `q` parameter is enough to reveal it. That same `q` also opens the
 * filters panel (`flags.facets` in SearchContainer.ts), so the panel must not be toggled here.
 */
async function createPrivateSavedSearch(page: Page, name: string): Promise<void> {
    await page.goto('/#/search?q=story');
    await expect(page.getByTestId('advanced-search-panel')).toBeVisible();
    await page.getByTestId('save-search').click();

    const panel = page.getByTestId('save-search-panel');

    await expect(panel).toBeVisible();
    await panel.getByTestId('search-name').fill(name);
    await panel.getByTestId('save').click();

    // The panel closes on both success and failure (SaveSearch.ts), so confirm the search was
    // really persisted: only a successful save switches the side panel to the "Saved" tab.
    await expect(
        page.getByTestId('user-saved-searches').getByTestId('saved-search').filter({hasText: name}),
    ).toHaveCount(1);
}

async function openWorkspaceMonitoringSettings(page: Page): Promise<MonitoringSettings> {
    const monitoring = new Monitoring(page);
    const settings = new MonitoringSettings(page);

    await page.goto('/#/workspace/monitoring');

    // Superdesk routes on the URL fragment, so arriving from another view never reboots the
    // Angular app. SavedSearchService caches the whole saved-search list for the app's lifetime
    // and only drops it on the `savedsearch:update` websocket event, whose arrival is not
    // ordered against navigation, so a search created earlier in the test can be missing from
    // the wizard. Reloading starts the app fresh on the monitoring view.
    await page.reload();

    await monitoring.selectDeskOrWorkspace(WORKSPACE);
    await settings.open();

    return settings;
}

test('saved searches tab groups global and private saved searches', {
    annotation: [
        // Saved searches tab in Monitoring settings of custom workspace
        {type: 'confluence', description: '1318323123 complete'},
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createPrivateSavedSearch(page, PRIVATE_SEARCH);

    const settings = await openWorkspaceMonitoringSettings(page);

    await expect(settings.tab('Desks')).toBeVisible();
    await expect(settings.tab('Saved Searches')).toBeVisible();
    await expect(settings.tab('Reorder Sections')).toBeVisible();
    await expect(settings.tab('Items Count')).toBeVisible();
    await settings.expectActiveTab('Desks');

    await settings.goToTab('Saved Searches');

    const globalSearches = settings.globalSavedSearches;
    const privateSearches = settings.privateSavedSearches;

    await expect(globalSearches.getByTestId('saved-search')).toHaveCount(2);
    await expect(settings.savedSearch(globalSearches, 'Malaysia')).toBeVisible();
    await expect(settings.savedSearch(globalSearches, 'Technology')).toBeVisible();
    await expect(settings.savedSearch(globalSearches, 'Malaysia')).toContainText('by John Doe');
    await expect(settings.savedSearchToggle(globalSearches, 'Malaysia')).toBeVisible();

    await expect(privateSearches.getByTestId('saved-search')).toHaveCount(1);
    await expect(settings.savedSearch(privateSearches, PRIVATE_SEARCH)).toBeVisible();
    await expect(settings.savedSearchToggle(privateSearches, PRIVATE_SEARCH)).toBeVisible();
    await expect(settings.savedSearch(globalSearches, PRIVATE_SEARCH)).toHaveCount(0);
    await expect(settings.savedSearch(privateSearches, 'Malaysia')).toHaveCount(0);

    const malaysiaToggle = settings.savedSearchToggle(globalSearches, 'Malaysia');

    await expect(malaysiaToggle).not.toHaveClass(/checked/);
    await malaysiaToggle.click();
    await expect(malaysiaToggle).toHaveClass(/checked/);
    await malaysiaToggle.click();
    await expect(malaysiaToggle).not.toHaveClass(/checked/);

    await settings.toggleBoxHeader(globalSearches).click();
    await expect(globalSearches.getByTestId('saved-search')).toHaveCount(0);
    await settings.toggleBoxHeader(globalSearches).click();
    await expect(globalSearches.getByTestId('saved-search')).toHaveCount(2);

    await settings.toggleBoxHeader(privateSearches).click();
    await expect(privateSearches.getByTestId('saved-search')).toHaveCount(0);
    await settings.toggleBoxHeader(privateSearches).click();
    await expect(privateSearches.getByTestId('saved-search')).toHaveCount(1);
});

test('wizard navigation preserves saved search selection and Done applies it', async ({page}) => {
    await restoreDatabaseSnapshot();
    await createPrivateSavedSearch(page, PRIVATE_SEARCH);

    const monitoring = new Monitoring(page);
    const settings = await openWorkspaceMonitoringSettings(page);

    await settings.expectActiveTab('Desks');
    await expect(settings.previousButton).toBeHidden();
    await expect(settings.nextButton).toBeVisible();

    await settings.goToTab('Saved Searches');
    await expect(settings.previousButton).toBeVisible();

    const malaysiaToggle = settings.savedSearchToggle(settings.globalSavedSearches, 'Malaysia');
    const privateToggle = settings.savedSearchToggle(settings.privateSavedSearches, PRIVATE_SEARCH);

    await malaysiaToggle.click();
    await expect(malaysiaToggle).toHaveClass(/checked/);
    await privateToggle.click();
    await expect(privateToggle).toHaveClass(/checked/);

    await settings.previousButton.click();
    await settings.expectActiveTab('Desks');
    await expect(settings.previousButton).toBeHidden();

    await settings.nextButton.click();
    await settings.expectActiveTab('Saved Searches');
    await expect(settings.savedSearchToggle(settings.globalSavedSearches, 'Malaysia')).toHaveClass(/checked/);
    await expect(settings.savedSearchToggle(settings.privateSavedSearches, PRIVATE_SEARCH))
        .toHaveClass(/checked/);

    await settings.nextButton.click();
    await settings.expectActiveTab('Reorder Sections');
    await settings.nextButton.click();
    await settings.expectActiveTab('Items Count');
    await expect(settings.nextButton).toBeHidden();
    await expect(settings.previousButton).toBeVisible();

    await settings.closeWithDone();

    // Saving kicks off the preference write and the in-place group refresh at the same time
    // (AggregateSettings.save), so the still-open view can be one refresh behind. The QA case
    // leaves and re-enters the monitoring view here, which is what this reload reproduces.
    await page.reload();
    await monitoring.selectDeskOrWorkspace(WORKSPACE);

    await expect(monitoringGroup(page, 'Malaysia')).toBeVisible();
    await expect(monitoringGroup(page, PRIVATE_SEARCH)).toBeVisible();
});

test('cancelling monitoring settings discards the saved search selection', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);
    const settings = await openWorkspaceMonitoringSettings(page);

    await settings.goToTab('Saved Searches');

    const technologyToggle = settings.savedSearchToggle(settings.globalSavedSearches, 'Technology');

    await technologyToggle.click();
    await expect(technologyToggle).toHaveClass(/checked/);

    await settings.closeWithCancel();

    await page.reload();
    await monitoring.selectDeskOrWorkspace(WORKSPACE);

    // the toolbar button only renders for a workspace selection, so it anchors the negative
    // assertion below to a monitoring view that has actually finished rendering
    await expect(page.getByTestId('monitoring-settings-button')).toBeVisible();
    await expect(monitoringGroup(page, 'Technology')).toHaveCount(0);

    await settings.open();
    await settings.goToTab('Saved Searches');

    await expect(settings.savedSearchToggle(settings.globalSavedSearches, 'Technology')).not.toHaveClass(/checked/);
});
