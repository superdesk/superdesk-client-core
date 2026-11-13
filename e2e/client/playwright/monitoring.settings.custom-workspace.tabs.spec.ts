import {test, expect, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MonitoringSettings} from './page-object-models/monitoring-settings';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case 1318323011 "Configure personal Monitoring view in custom workspace": the Monitoring
 * settings wizard opened from the toolbar of the custom workspace "Workspace 1". The first test
 * covers steps 1-2, the four tabs of the expected result and the step 6 note (the Saved Searches
 * tab also offers private saved searches). Steps 3-5 run the desk cases 1315934713 (Desks),
 * 1315934717 (Reorder sections) and 1315934719 (Items count) from their step 3 in the workspace;
 * each has a test below that changes the tab, presses Done and checks the monitoring view. Their
 * Previous / Next / Cancel steps are the same wizard and are covered for a desk by
 * `monitoring.settings.desk-tabs.spec.ts`.
 *
 * A custom workspace stores its groups in the `agg:view` user preference under the workspace id
 * (`AggregateSettings.save()`), not on a desk. "Workspace 1" has no entry in the `main` snapshot,
 * so until the first Done it shows the default groups of the user's current desk, Sports
 * (`getDefaultGroups` in `AggregateCtrl.ts`).
 *
 * The Items count setting is how many items a group shows before it scrolls, not a cap on the
 * items it lists; `monitoring.settings.desk-tabs.spec.ts` explains why.
 */

const WORKSPACE = 'Workspace 1';
const DESK = 'Sports';
const SAVED_SEARCH = 'Malaysia';

const WORKING_STAGE = `${DESK} : Working Stage`;
const INCOMING_STAGE = `${DESK} : Incoming Stage`;
const DESK_OUTPUT = `${DESK} : Desk Output`;

/** `data-test-value` of the monitoring groups the sections above map to in the Monitoring view. */
const WORKING_STAGE_GROUP = `${DESK} / Working Stage`;
const INCOMING_STAGE_GROUP = `${DESK} / Incoming Stage`;
const DESK_OUTPUT_GROUP = `${DESK} desk output`;

/** Labels of a desk's buttons on the Desks tab: its stages, then the three desk outputs. */
const STAGE_BUTTONS = ['Working Stage', 'Incoming Stage', 'Output/Scheduled', 'Output/Published', 'Output/Sent'];

/** Number of items the Sports / Working Stage group lists in the `main` snapshot. */
const WORKING_STAGE_ITEMS = 4;

/** `ITEM_HEIGHT` in `scripts/apps/monitoring/directives/MonitoringGroup.ts`. */
const ITEM_HEIGHT = 57;

/** `defaultMaxItems` in `scripts/apps/monitoring/controllers/AggregateCtrl.ts`. */
const DEFAULT_MAX_ITEMS = 10;

async function openWorkspace(page: Page): Promise<void> {
    await page.goto('/#/workspace/monitoring');
    await new Monitoring(page).selectDeskOrWorkspace(WORKSPACE);
}

/** A fresh app start reads the groups back from the saved preference instead of the open view. */
async function reopenWorkspace(page: Page): Promise<void> {
    await page.reload();
    await new Monitoring(page).selectDeskOrWorkspace(WORKSPACE);
}

/**
 * The wizard fills its selection from the workspace's groups only after it is shown
 * (`AggregateCtrl.edit()`), so a click before that can be overwritten. The Sports switch being on
 * is the sign the selection has arrived.
 */
async function openSettings(settings: MonitoringSettings): Promise<void> {
    await settings.open();
    await settings.expectDeskActive(DESK, true);
}

test.describe('monitoring settings of a custom workspace', () => {
    test('open from the toolbar and expose the desks, saved searches, reorder and items count tabs', {
        annotation: [
            // Configure personal Monitoring view in custom workspace
            {type: 'confluence', description: '1318323011 complete'},
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const settings = new MonitoringSettings(page);

        await restoreDatabaseSnapshot();
        await openWorkspace(page);

        const settingsButton = monitoring.getMonitoringSettingsButton();
        const createItemButton = monitoring.getCreateItemButton();

        await expect(settingsButton).toBeVisible();
        await expect(createItemButton).toBeVisible();

        const settingsBox = await settingsButton.boundingBox();
        const createItemBox = await createItemButton.boundingBox();

        if (settingsBox == null || createItemBox == null) {
            throw new Error('monitoring toolbar buttons are not laid out');
        }

        // The geometry is what asserts "settings left of the + menu".
        expect(settingsBox.x + settingsBox.width).toBeLessThanOrEqual(createItemBox.x);
        expect(Math.abs(settingsBox.y - createItemBox.y)).toBeLessThan(settingsBox.height);

        const dialog = settings.modal;

        await expect(dialog).toBeHidden();

        await settings.open();

        await expect(dialog.getByRole('heading', {name: 'Monitoring settings'})).toBeVisible();
        await expect(settings.tabs).toHaveText(['Desks', 'Saved Searches', 'Reorder Sections', 'Items Count']);

        await settings.expectActiveTab('Desks');
        await expect(dialog.getByText('Select desks for view')).toBeVisible();

        await settings.goToTab('Saved Searches');
        await expect(dialog.getByText('Select saved searches for view')).toBeVisible();
        await expect(dialog.getByText('Select desks for view')).toBeHidden();

        // The private box showing up does not by itself prove the workspace entry point:
        // `showPrivateSavedSearches` starts true everywhere and is only turned off for desks
        // (`AggregateSettings.ts`).
        await expect(dialog.getByText('Global saved searches')).toBeVisible();
        await expect(dialog.getByText('Private saved searches')).toBeVisible();

        await settings.goToTab('Reorder Sections');
        await expect(dialog.getByText('Reorder stages and saved searches for monitoring view')).toBeVisible();
        await expect(dialog.getByText('Select saved searches for view')).toBeHidden();

        await settings.goToTab('Items Count');
        await expect(dialog.getByText('Set maximum items per stages and saved searches for view')).toBeVisible();
        await expect(dialog.getByText('Reorder stages and saved searches for monitoring view')).toBeHidden();

        await settings.goToTab('Desks');
        await expect(dialog.getByText('Select desks for view')).toBeVisible();

        await settings.closeWithCancel();
    });

    test('Desks tab switches desks and stages, and Done shows only the selected stages of active desks', {
        annotation: [
            {type: 'confluence', description: '1318323011 complete'},
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const settings = new MonitoringSettings(page);

        await restoreDatabaseSnapshot();
        await openWorkspace(page);
        await monitoring.expectGroups([WORKING_STAGE_GROUP, INCOMING_STAGE_GROUP, DESK_OUTPUT_GROUP]);

        await openSettings(settings);
        await settings.expectActiveTab('Desks');

        await expect(settings.stageButtons(DESK)).toHaveText(STAGE_BUTTONS);
        await expect(settings.selectedStageButtons(DESK))
            .toHaveText(['Working Stage', 'Incoming Stage', 'Output/Published']);

        await settings.expectDeskActive('Finance', false);
        await expect(settings.stageButtons('Finance')).toHaveCount(0);

        await settings.deskToggle('Finance').click();
        await settings.expectDeskActive('Finance', true);
        await expect(settings.stageButtons('Finance')).toHaveText(STAGE_BUTTONS);
        await expect(settings.selectedStageButtons('Finance')).toHaveCount(0);

        await settings.deskToggle('Finance').click();
        await settings.expectDeskActive('Finance', false);
        await expect(settings.stageButtons('Finance')).toHaveCount(0);

        await settings.deskToggle('Finance').click();
        await settings.expectDeskActive('Finance', true);

        await settings.stageButton('Finance', 'Working Stage').click();
        await settings.stageButton('Finance', 'Incoming Stage').click();
        await expect(settings.selectedStageButtons('Finance')).toHaveText(['Working Stage', 'Incoming Stage']);

        await settings.stageButton('Finance', 'Incoming Stage').click();
        await expect(settings.selectedStageButtons('Finance')).toHaveText(['Working Stage']);

        await settings.stageButton(DESK, 'Incoming Stage').click();
        await expect(settings.selectedStageButtons(DESK)).toHaveText(['Working Stage', 'Output/Published']);

        // switched on with no stage selected
        await settings.deskToggle('Education').click();
        await settings.expectDeskActive('Education', true);
        await expect(settings.selectedStageButtons('Education')).toHaveCount(0);

        // a stage selected under a desk that is then switched off
        await settings.deskToggle('Without members').click();
        await settings.stageButton('Without members', 'Working Stage').click();
        await expect(settings.selectedStageButtons('Without members')).toHaveText(['Working Stage']);
        await settings.deskToggle('Without members').click();
        await settings.expectDeskActive('Without members', false);

        await settings.closeWithDone();

        const expected = [WORKING_STAGE_GROUP, DESK_OUTPUT_GROUP, 'Finance / Working Stage'];

        await monitoring.expectGroups(expected);

        await reopenWorkspace(page);
        await monitoring.expectGroups(expected);
    });

    test('Reorder Sections tab lists the active sections and drag and drop reorders the workspace', {
        annotation: [
            {type: 'confluence', description: '1318323011 complete'},
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const settings = new MonitoringSettings(page);

        await restoreDatabaseSnapshot();
        await openWorkspace(page);
        await monitoring.expectGroups([WORKING_STAGE_GROUP, INCOMING_STAGE_GROUP, DESK_OUTPUT_GROUP]);

        await openSettings(settings);

        await settings.goToTab('Saved Searches');

        const savedSearchToggle = settings.savedSearchToggle(settings.globalSavedSearches, SAVED_SEARCH);

        await savedSearchToggle.click();
        await expect(savedSearchToggle).toHaveClass(/checked/);

        await settings.goToTab('Reorder Sections');
        await expect(settings.reorderSections)
            .toHaveText([WORKING_STAGE, INCOMING_STAGE, DESK_OUTPUT, SAVED_SEARCH]);

        await settings.dragSectionOnto(SAVED_SEARCH, WORKING_STAGE);
        await expect(settings.reorderSections)
            .toHaveText([SAVED_SEARCH, WORKING_STAGE, INCOMING_STAGE, DESK_OUTPUT]);

        await settings.closeWithDone();

        const expected = [SAVED_SEARCH, WORKING_STAGE_GROUP, INCOMING_STAGE_GROUP, DESK_OUTPUT_GROUP];

        await monitoring.expectGroups(expected);

        await reopenWorkspace(page);
        await monitoring.expectGroups(expected);
    });

    test('Items Count tab sets how many items a workspace monitoring group shows before it scrolls', {
        annotation: [
            {type: 'confluence', description: '1318323011 complete'},
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);
        const settings = new MonitoringSettings(page);

        await restoreDatabaseSnapshot();
        await openWorkspace(page);

        const workingStageItems = monitoring.getGroupLocator(WORKING_STAGE_GROUP).getByTestId('article-item');
        const workingStageViewport = monitoring.getGroupLocator(WORKING_STAGE_GROUP).getByTestId('item-list-viewport');
        const deskOutputViewport = monitoring.getGroupLocator(DESK_OUTPUT_GROUP).getByTestId('item-list-viewport');

        await expect(workingStageItems).toHaveCount(WORKING_STAGE_ITEMS);
        await expect(workingStageViewport).toHaveCSS('max-height', `${DEFAULT_MAX_ITEMS * ITEM_HEIGHT}px`);
        await expect(deskOutputViewport).toHaveCSS('max-height', `${DEFAULT_MAX_ITEMS * ITEM_HEIGHT}px`);

        await openSettings(settings);

        await settings.goToTab('Items Count');
        await expect(settings.itemsCountSections).toHaveText([WORKING_STAGE, INCOMING_STAGE, DESK_OUTPUT]);
        await expect(settings.maxItemsInput(WORKING_STAGE)).toHaveValue(String(DEFAULT_MAX_ITEMS));

        await settings.setMaxItems(WORKING_STAGE, 2);
        await settings.setMaxItems(DESK_OUTPUT, 3);

        await settings.closeWithDone();

        await expect(workingStageViewport).toHaveCSS('max-height', `${2 * ITEM_HEIGHT}px`);
        await expect(deskOutputViewport).toHaveCSS('max-height', `${3 * ITEM_HEIGHT}px`);

        await reopenWorkspace(page);

        await expect(workingStageViewport).toHaveCSS('max-height', `${2 * ITEM_HEIGHT}px`);
        await expect(deskOutputViewport).toHaveCSS('max-height', `${3 * ITEM_HEIGHT}px`);
        await expect(workingStageItems).toHaveCount(WORKING_STAGE_ITEMS);
    });
});
