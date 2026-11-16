import {Browser, Locator, Page, test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {DeskRouting} from './page-object-models/desk-routing';
import {GlobalSearch} from './page-object-models/global-search';
import {Monitoring} from './page-object-models/monitoring';
import {loginAs, restoreDatabaseSnapshot} from './utils';
import {getLoggedOutStorageState} from './utils/storage-state';
import {TreeSelectDriver} from './utils/tree-select-driver';

// QA case "Desk routing" (1311834332), SDANSA-153 AC 1, 3, 4 b-c, 5, 6 and "routing disabled".
// Not covered:
// - AC 4 a (ingest routing): no ingest provider in the e2e stack polls a feed.
// - AC 7 (publishing from the target desk): routing only adds a mark and never moves the item, so
//   this is ordinary publishing with nothing routing-specific to assert.

// `samgamgee` rather than `frodobaggins`: the router is a dashboard widget, so the user needs the
// `dashboard` privilege (held by `Sub Editor`, which has no `desk_routing`).
async function asUserWithoutDeskRouting(browser: Browser, run: (page: Page) => Promise<void>): Promise<void> {
    const context = await browser.newContext({storageState: getLoggedOutStorageState()});

    // a context made from `browser` outlives a failed test, leaving a logged-in session behind
    try {
        const page = await context.newPage();

        await loginAs(page, 'samgamgee', 'samgamgee');
        await run(page);
    } finally {
        await context.close();
    }
}

const INGEST_ITEM = 'Indonesia opens pasteurized milk facility to back free meals program';

// "Finances Story" starts on Finance, an open desk, so any mark it picks up comes from the Sports
// stage it is sent to.
async function sendFinanceStoryToSports(page: Page): Promise<Locator> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.waitUntilReady();
    await monitoring.selectDeskOrWorkspace('Finance');
    await monitoring.executeActionOnMonitoringItem(
        monitoring.getGroupedArticleLocator('Finance / Working Stage', 'Finances Story'),
        'Edit',
    );
    await new Authoring(page).sendTo({desk: 'Sports', stage: 'Working Stage'});

    await monitoring.selectDeskOrWorkspace('Sports');

    const item = monitoring.getGroupedArticleLocator('Sports / Working Stage', 'Finances Story');

    await expect(item).toBeVisible();

    return item;
}

async function fetchIngestItemToSports(page: Page): Promise<Locator> {
    const monitoring = new Monitoring(page);
    const panel = page.getByTestId('interactive-actions-panel');

    await page.goto('/#/search?repo=ingest');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').and(page.locator(`[data-test-value="${INGEST_ITEM}"]`)),
        'Fetch To',
    );
    await new TreeSelectDriver(page, page.getByTestId('destination-select')).setValues('Sports');
    await panel.getByTestId('stage-select').getByTestId('item')
        .and(page.locator('[data-test-value="Incoming Stage"]'))
        .click();
    await panel.getByTestId('fetch').click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.waitUntilReady();
    await monitoring.selectDeskOrWorkspace('Sports');

    const item = monitoring.getGroupedArticleLocator('Sports / Incoming Stage', INGEST_ITEM);

    await expect(item).toBeVisible();

    return item;
}

test.describe('desk routing', {
    annotation: [
        {type: 'confluence', description: '1311834332 partial'}, // Desk routing
    ],
}, () => {
    test('closes a desk onto another one and reports the direction on both', async ({page}) => {
        const deskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await deskRouting.openOn('Sports');

        await expect(deskRouting.destinationSelect).toBeEnabled();
        await expect(deskRouting.startButton).toBeDisabled();
        await deskRouting.expectNoRoutingIndicated();

        await deskRouting.selectDestination('Education');
        await expect(deskRouting.startButton).toBeEnabled();

        await deskRouting.startRouting();

        await expect(deskRouting.startButton).toHaveCount(0);
        await expect(deskRouting.infoRoutingTo).toHaveText('Education');
        await expect(deskRouting.infoRoutedFrom).toBeHidden();

        await deskRouting.openOn('Education');

        await expect(deskRouting.infoRoutedFrom).toHaveText('Sports');
        await expect(deskRouting.infoRoutingTo).toBeHidden();
        await expect(deskRouting.routedFromItem('Sports')).toBeVisible();
    });

    test('keeps the desk closed across a reload and reopens it on stop', async ({page}) => {
        const deskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await deskRouting.routeTo('Sports', 'Education');

        await page.reload();

        await expect(deskRouting.stopButton).toBeVisible();
        await expect(deskRouting.selectedDestination).toHaveText('Education');
        await expect(deskRouting.infoRoutingTo).toHaveText('Education');

        await deskRouting.stopRouting();

        await expect(deskRouting.stopButton).toHaveCount(0);
        await deskRouting.expectNoRoutingIndicated();

        // Stop only sends `is_closed`, so the destination stays configured.
        await expect(deskRouting.selectedDestination).toHaveText('Education');
        await expect(deskRouting.startButton).toBeEnabled();

        await deskRouting.openOn('Education');

        await deskRouting.expectNoRoutingIndicated();
    });

    test('routes a desk that is already a routing target on to a third desk', async ({page}) => {
        const deskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await deskRouting.routeTo('Sports', 'Education');

        await deskRouting.openOn('Education');

        await expect(deskRouting.routedFromItem('Sports')).toBeVisible();
        await expect(deskRouting.startButton).toBeVisible();

        await deskRouting.selectDestination('Finance');
        await deskRouting.startRouting();

        // `TopMenuInfoDirective` computes "Routed from" only for a desk that is not itself closed.
        await expect(deskRouting.infoRoutingTo).toHaveText('Finance');
        await expect(deskRouting.infoRoutedFrom).toBeHidden();

        await deskRouting.openOn('Finance');

        await expect(deskRouting.infoRoutedFrom).toHaveText('Education');

        // The widget lists direct sources only, not the whole chain.
        await expect(deskRouting.routedFromItem('Education')).toBeVisible();
        await expect(deskRouting.routedFromItem('Sports')).toHaveCount(0);
    });

    test('lists every desk that routes to the same target desk', async ({page}) => {
        const deskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await deskRouting.routeTo('Sports', 'Finance');
        await deskRouting.routeTo('Education', 'Finance');

        await deskRouting.openOn('Finance');

        await expect(deskRouting.routedFromItem('Sports')).toBeVisible();
        await expect(deskRouting.routedFromItem('Education')).toBeVisible();

        // Names come in the order `DesksFactory.fetchDesks` sorts them, by name.
        await expect(deskRouting.infoRoutedFrom).toHaveText('Education, Sports');
    });

    // The admin sets the desk up first: the dashboard is shared by the desk's members, and the user
    // holds no `desks` privilege to add the widget with.
    test('offers a user without the privilege no way to start routing', async ({page, browser}) => {
        const adminDeskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await adminDeskRouting.openOn('Sports');
        await adminDeskRouting.selectDestination('Education');

        await asUserWithoutDeskRouting(browser, async (userPage) => {
            const deskRouting = new DeskRouting(userPage);

            await deskRouting.openOn('Sports');

            await expect(deskRouting.selectedDestination).toHaveText('Education');
            await expect(deskRouting.destinationSelect).toBeDisabled();
            await expect(deskRouting.startButton).toBeDisabled();
            await expect(deskRouting.stopButton).toHaveCount(0);
            await deskRouting.expectNoRoutingIndicated();
        });
    });

    test('shows a user without the privilege a closed desk but no way to reopen it', async ({page, browser}) => {
        await restoreDatabaseSnapshot();
        await new DeskRouting(page).routeTo('Sports', 'Education');

        await asUserWithoutDeskRouting(browser, async (userPage) => {
            const deskRouting = new DeskRouting(userPage);

            await deskRouting.openOn('Sports');

            await expect(deskRouting.infoRoutingTo).toHaveText('Education');
            await expect(deskRouting.stopButton).toBeDisabled();
            await expect(deskRouting.startButton).toHaveCount(0);
            await expect(deskRouting.destinationSelect).toBeDisabled();
        });
    });

    test('marks an item sent to a closed desk for the desk it routes to', async ({page}) => {
        const monitoring = new Monitoring(page);
        const search = new GlobalSearch(page);

        await restoreDatabaseSnapshot({snapshotName: 'desk-routing'});
        await new DeskRouting(page).routeTo('Sports', 'Education');

        const item = await sendFinanceStoryToSports(page);
        const markedDesks = await monitoring.openMarkedDesks(item);

        await expect(markedDesks).toContainText('Education');

        // Only content arriving after the desk closed is routed.
        const itemAlreadyOnDesk = monitoring.getGroupedArticleLocator('Sports / Working Stage', 'test sports story');

        await expect(itemAlreadyOnDesk).toBeVisible();
        await expect(monitoring.getMarkedDesksIndicator(itemAlreadyOnDesk)).toHaveCount(0);

        await search.open();
        await search.filterByMarkedDesk('Education');

        await expect(search.results).toHaveCount(1);
        await expect(search.results).toContainText('Finances Story');
    });

    test('marks an item fetched into a closed desk for the desk it routes to', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: 'desk-routing'});
        await new DeskRouting(page).routeTo('Sports', 'Education');

        const item = await fetchIngestItemToSports(page);
        const markedDesks = await monitoring.openMarkedDesks(item);

        await expect(markedDesks).toContainText('Education');
    });

    test('marks an item for the last desk of a routing chain only', async ({page}) => {
        const deskRouting = new DeskRouting(page);
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: 'desk-routing'});
        await deskRouting.routeTo('Sports', 'Education');
        await deskRouting.routeTo('Education', 'Finance');

        const item = await sendFinanceStoryToSports(page);
        const markedDesks = await monitoring.openMarkedDesks(item);

        await expect(markedDesks).toContainText('Finance');
        await expect(markedDesks).not.toContainText('Education');
    });

    test('unmarks the routed items when the desk is reopened', async ({page}) => {
        const deskRouting = new DeskRouting(page);
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: 'desk-routing'});
        await deskRouting.routeTo('Sports', 'Education');

        const item = await sendFinanceStoryToSports(page);

        await expect(monitoring.getMarkedDesksIndicator(item)).toBeVisible();

        await deskRouting.openOn('Sports');
        await deskRouting.stopRouting();

        await page.goto('/#/workspace/monitoring');
        await monitoring.waitUntilReady();

        await expect(item).toBeVisible();
        await expect(monitoring.getMarkedDesksIndicator(item)).toHaveCount(0);
    });
});
