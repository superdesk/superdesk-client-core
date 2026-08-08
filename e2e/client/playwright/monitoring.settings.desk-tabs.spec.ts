import {test, expect, Locator, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MonitoringSettings} from './page-object-models/monitoring-settings';
import {restoreDatabaseSnapshot} from './utils';

/**
 * The "Reorder sections" (confluence 1315934717) and "Items count" (confluence 1315934719) tabs
 * of a desk's Monitoring settings. Both cases open the same wizard from the desk card's 3-dot
 * menu on `/#/settings/desks` and share their first two expected results (the actions menu and
 * the list of tabs) plus the Previous / Next / Cancel / Done behaviour, so those are asserted
 * once in a test annotated with both case ids.
 *
 * The custom-workspace entry point to the same wizard belongs to other cases and is covered by
 * `monitoring.settings.custom-workspace.spec.ts`; the desk's Saved searches tab by
 * `monitoring.settings.spec.ts`. Only the desk variant writes `monitoring_settings` on the desk
 * itself (`AggregateSettings.save()`); the other two entry points write a user preference or a
 * dashboard widget's configuration.
 *
 * Wording: the cases name the tabs "Saved searches", "Reorder sections" and "Items count"; the
 * product renders them title-cased ("Saved Searches", "Reorder Sections", "Items Count") and
 * those are the strings asserted here.
 *
 * Behaviour, 1315934719 expected result 4.1: the case reads the number field as "the maximum
 * items count", but the product does not cap how many items a group holds. `MonitoringGroup.ts`
 * queries `PAGE_SIZE` (25) items whatever the setting is and spends `max_items` on the group's
 * `maxHeight` instead, so the setting is how many items are visible before the group scrolls.
 * That is what the assertions below check.
 *
 * Not covered, 1315934719 expected result 4.3 ("up and down arrows are displayed when hovering
 * over the number field"): the spinner of an `<input type="number">` is drawn by Chromium in the
 * user-agent shadow DOM, so it has no node and no computed style a spec can reach, and visual
 * snapshots are not used in this suite. What the arrows do (expected result 4.4) is asserted by
 * stepping the field with ArrowUp / ArrowDown, which runs the same `stepUp` / `stepDown`.
 */

test.setTimeout(60000);

const DESK = 'Sports';
const SAVED_SEARCH = 'Malaysia';

const WORKING_STAGE = `${DESK} : Working Stage`;
const INCOMING_STAGE = `${DESK} : Incoming Stage`;
const DESK_OUTPUT = `${DESK} : Desk Output`;

/** `data-test-value` of the monitoring groups the sections above map to in the Monitoring view. */
const WORKING_STAGE_GROUP = `${DESK} / Working Stage`;
const INCOMING_STAGE_GROUP = `${DESK} / Incoming Stage`;
const DESK_OUTPUT_GROUP = `${DESK} desk output`;

/** Sports / Working Stage holds this many unspiked items in the `main` snapshot. */
const WORKING_STAGE_ITEMS = 4;

/**
 * Height of one list row in pixels, `ITEM_HEIGHT` in
 * `scripts/apps/monitoring/directives/MonitoringGroup.ts`. It is what the group multiplies the
 * Items count setting by to get its `maxHeight`. Single-line lists use 29 instead, which needs
 * `appConfig.list.singleLine`; `superdesk.config.js` does not set it.
 */
const ITEM_HEIGHT = 57;

/** `defaultMaxItems` in `scripts/apps/monitoring/controllers/AggregateCtrl.ts`. */
const DEFAULT_MAX_ITEMS = 10;

function monitoringGroup(page: Page, testValue: string): Locator {
    return page
        .getByTestId('monitoring-view')
        .getByTestId('monitoring-group')
        .and(page.locator(`[data-test-value="${testValue}"]`));
}

function monitoringGroups(page: Page): Locator {
    return page.getByTestId('monitoring-view').getByTestId('monitoring-group');
}

async function expectMonitoringGroupOrder(page: Page, testValues: Array<string>): Promise<void> {
    const groups = monitoringGroups(page);

    await expect(groups).toHaveCount(testValues.length);
    await expect
        .poll(() => groups.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-test-value'))))
        .toEqual(testValues);
}

/**
 * Enables a global saved search so the Reorder sections and Items count tabs list a saved search
 * next to the desk stages. Only global searches are offered here: the wizard sets
 * `showPrivateSavedSearches` from the active workspace type, and a desk is not a custom workspace
 * (`AggregateSettings.ts`).
 */
async function enableSavedSearch(settings: MonitoringSettings, name: string): Promise<void> {
    await settings.goToTab('Saved Searches');

    const toggle = settings.savedSearchToggle(settings.globalSavedSearches, name);

    await toggle.click();
    await expect(toggle).toHaveClass(/checked/);
}

async function openMonitoringView(page: Page): Promise<void> {
    await page.goto('/#/workspace/monitoring');

    // Superdesk routes on the URL fragment, so arriving from the settings page never reboots the
    // Angular app and the monitoring view can be built from a desk that the just-saved
    // `monitoring_settings` have not reached yet. Reloading starts the app fresh.
    await page.reload();

    await new Monitoring(page).selectDeskOrWorkspace(DESK);
}

test('desk actions offer Monitoring settings and the wizard opens on the Desks tab', {
    annotation: [
        // Items count tab in Monitoring settings
        {type: 'confluence', description: '1315934719 partial'},
        // Reorder sections tab in Monitoring settings
        {type: 'confluence', description: '1315934717 complete'},
    ],
}, async ({page}) => {
    const settings = new MonitoringSettings(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/desks');

    await expect(settings.deskCard(DESK)).toBeVisible();
    await expect(settings.deskCard('Finance')).toBeVisible();

    const actions = await settings.openDeskActions(DESK);

    await expect(actions.getByTestId('desk-actions--edit')).toBeVisible();
    await expect(actions.getByTestId('desk-actions--monitoring-settings')).toBeVisible();
    await expect(actions.getByTestId('desk-actions--remove')).toBeVisible();
    await expect(actions.getByRole('button')).toHaveCount(3);

    await actions.getByTestId('desk-actions--monitoring-settings').click();
    await expect(settings.modal).toBeVisible();

    await expect(settings.tabs).toHaveText(['Desks', 'Saved Searches', 'Reorder Sections', 'Items Count']);
    await settings.expectActiveTab('Desks');
});

test('Previous and Next walk the tabs, are hidden at the ends and keep pending edits', {
    annotation: [
        {type: 'confluence', description: '1315934719 partial'},
        {type: 'confluence', description: '1315934717 complete'},
    ],
}, async ({page}) => {
    const settings = new MonitoringSettings(page);

    await restoreDatabaseSnapshot();
    await settings.openForDesk(DESK);

    await settings.expectActiveTab('Desks');
    await expect(settings.previousButton).toBeHidden();
    await expect(settings.nextButton).toBeVisible();

    await settings.nextButton.click();
    await settings.expectActiveTab('Saved Searches');
    await expect(settings.previousButton).toBeVisible();

    await settings.nextButton.click();
    await settings.expectActiveTab('Reorder Sections');
    await expect(settings.previousButton).toBeVisible();
    await expect(settings.nextButton).toBeVisible();

    await settings.dragSectionOnto(DESK_OUTPUT, WORKING_STAGE);
    await expect(settings.reorderSections)
        .toHaveText([DESK_OUTPUT, WORKING_STAGE, INCOMING_STAGE]);

    await settings.nextButton.click();
    await settings.expectActiveTab('Items Count');
    await expect(settings.nextButton).toBeHidden();
    await expect(settings.previousButton).toBeVisible();

    await settings.setMaxItems(WORKING_STAGE, 7);

    await settings.previousButton.click();
    await settings.expectActiveTab('Reorder Sections');
    await expect(settings.reorderSections)
        .toHaveText([DESK_OUTPUT, WORKING_STAGE, INCOMING_STAGE]);

    await settings.nextButton.click();
    await settings.expectActiveTab('Items Count');
    await expect(settings.maxItemsInput(WORKING_STAGE)).toHaveValue('7');

    await settings.tab('Desks').click();
    await settings.expectActiveTab('Desks');
    await expect(settings.previousButton).toBeHidden();
});

test('Reorder sections tab lists the active sections and drag and drop reorders the view', {
    annotation: [
        {type: 'confluence', description: '1315934717 complete'},
    ],
}, async ({page}) => {
    const settings = new MonitoringSettings(page);

    await restoreDatabaseSnapshot();
    await settings.openForDesk(DESK);

    await enableSavedSearch(settings, SAVED_SEARCH);

    await settings.goToTab('Reorder Sections');
    await expect(settings.reorderSections)
        .toHaveText([WORKING_STAGE, INCOMING_STAGE, DESK_OUTPUT, SAVED_SEARCH]);

    await settings.dragSectionOnto(SAVED_SEARCH, WORKING_STAGE);
    await expect(settings.reorderSections)
        .toHaveText([SAVED_SEARCH, WORKING_STAGE, INCOMING_STAGE, DESK_OUTPUT]);

    await settings.closeWithDoneOnDesk();

    await openMonitoringView(page);
    await expectMonitoringGroupOrder(page, [
        SAVED_SEARCH,
        WORKING_STAGE_GROUP,
        INCOMING_STAGE_GROUP,
        DESK_OUTPUT_GROUP,
    ]);
});

test('Items count tab sets how many items a monitoring group shows before it scrolls', {
    annotation: [
        {type: 'confluence', description: '1315934719 partial'},
    ],
}, async ({page}) => {
    const settings = new MonitoringSettings(page);

    await restoreDatabaseSnapshot();

    await openMonitoringView(page);

    const workingStageItems = monitoringGroup(page, WORKING_STAGE_GROUP).getByTestId('article-item');
    const workingStageViewport = monitoringGroup(page, WORKING_STAGE_GROUP).getByTestId('item-list-viewport');

    await expect(workingStageItems).toHaveCount(WORKING_STAGE_ITEMS);
    await expect(workingStageViewport).toHaveCSS('max-height', `${DEFAULT_MAX_ITEMS * ITEM_HEIGHT}px`);

    await settings.openForDesk(DESK);
    await enableSavedSearch(settings, SAVED_SEARCH);

    await settings.goToTab('Items Count');
    await expect(settings.itemsCountSections)
        .toHaveText([WORKING_STAGE, INCOMING_STAGE, DESK_OUTPUT, SAVED_SEARCH]);

    const workingStageMax = settings.maxItemsInput(WORKING_STAGE);

    await expect(workingStageMax).toHaveAttribute('type', 'number');
    await expect(workingStageMax).toHaveAttribute('min', '1');
    await expect(workingStageMax).toHaveAttribute('max', '25');
    await expect(workingStageMax).toHaveValue(String(DEFAULT_MAX_ITEMS));
    await expect(settings.maxItemsInput(SAVED_SEARCH)).toHaveValue(String(DEFAULT_MAX_ITEMS));

    // the spinner arrows are not reachable from the DOM; the keyboard runs the same stepUp/stepDown
    await workingStageMax.press('ArrowUp');
    await expect(workingStageMax).toHaveValue('11');
    await workingStageMax.press('ArrowDown');
    await workingStageMax.press('ArrowDown');
    await expect(workingStageMax).toHaveValue('9');

    await settings.setMaxItems(WORKING_STAGE, 2);
    await settings.setMaxItems(SAVED_SEARCH, 3);

    await settings.closeWithDoneOnDesk();

    await openMonitoringView(page);
    await expect(workingStageViewport).toHaveCSS('max-height', `${2 * ITEM_HEIGHT}px`);
    await expect(monitoringGroup(page, SAVED_SEARCH).getByTestId('item-list-viewport'))
        .toHaveCSS('max-height', `${3 * ITEM_HEIGHT}px`);

    // the setting sizes the group, it does not shrink the result set the group scrolls through
    await expect(workingStageItems).toHaveCount(WORKING_STAGE_ITEMS);
});

test('Cancel closes the wizard and discards both the order and the items count', {
    annotation: [
        {type: 'confluence', description: '1315934719 partial'},
        {type: 'confluence', description: '1315934717 complete'},
    ],
}, async ({page}) => {
    const settings = new MonitoringSettings(page);

    await restoreDatabaseSnapshot();
    await settings.openForDesk(DESK);

    await settings.goToTab('Reorder Sections');
    await settings.dragSectionOnto(DESK_OUTPUT, WORKING_STAGE);
    await expect(settings.reorderSections)
        .toHaveText([DESK_OUTPUT, WORKING_STAGE, INCOMING_STAGE]);

    await settings.goToTab('Items Count');
    await settings.setMaxItems(WORKING_STAGE, 2);

    await settings.closeWithCancel();

    await settings.openForDesk(DESK);

    await settings.goToTab('Reorder Sections');
    await expect(settings.reorderSections)
        .toHaveText([WORKING_STAGE, INCOMING_STAGE, DESK_OUTPUT]);

    await settings.goToTab('Items Count');
    await expect(settings.maxItemsInput(WORKING_STAGE)).toHaveValue(String(DEFAULT_MAX_ITEMS));
});
