import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case 1318323011 "Configure personal Monitoring view in custom workspace".
 *
 * The monitoring settings of a custom workspace are personal: they are reached from the
 * monitoring toolbar rather than from the desks settings page, and their Saved Searches
 * step also lists the user's private saved searches.
 *
 * Covered here: steps 1-2 (the settings button sits to the left of the "+" menu and opens
 * the dialog), step 6 (the Saved Searches tab also offers private saved searches) and the
 * case's single documented expected result, i.e. the dialog offering the Desks, Saved
 * searches, Reorder sections and Items count tabs.
 *
 * Steps 3-5 delegate to the per-tab cases 1315934713 (Desks tab), 1315934717 (Reorder
 * sections tab) and 1315934719 (Items count tab), which carry their own expected results
 * and their own coverage: 1315934713 is covered by `monitoring.settings.spec.ts` (desk
 * entry point), 1315934717 and 1315934719 have no spec yet.
 */
test.describe('monitoring settings of a custom workspace', () => {
    const TAB_TITLES = ['Desks', 'Saved Searches', 'Reorder Sections', 'Items Count'];

    test('open from the toolbar and expose the desks, saved searches, reorder and items count tabs', {
        annotation: [
            // Configure personal Monitoring view in custom workspace
            {type: 'confluence', description: '1318323011 complete'},
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Workspace 1');

        const settingsButton = monitoring.getMonitoringSettingsButton();
        const createItemButton = monitoring.getCreateItemButton();

        await expect(settingsButton).toBeVisible();
        await expect(createItemButton).toBeVisible();

        const settingsBox = await settingsButton.boundingBox();
        const createItemBox = await createItemButton.boundingBox();

        if (settingsBox == null || createItemBox == null) {
            throw new Error('monitoring toolbar buttons are not laid out');
        }

        // both buttons live in the toolbar's right-aligned stack (scoped by the locators
        // above); the geometry is what tells them apart as "settings left of the + menu"
        expect(settingsBox.x + settingsBox.width).toBeLessThanOrEqual(createItemBox.x);
        expect(Math.abs(settingsBox.y - createItemBox.y)).toBeLessThan(settingsBox.height);

        const dialog = monitoring.getMonitoringSettingsDialog();

        await expect(dialog).toBeHidden();

        await monitoring.openMonitoringSettings();

        await expect(dialog.getByRole('heading', {name: 'Monitoring settings'})).toBeVisible();
        await expect(monitoring.getMonitoringSettingsTabs()).toHaveText(TAB_TITLES);

        await expect(dialog.getByText('Select desks for view')).toBeVisible();

        await monitoring.openMonitoringSettingsTab('Saved Searches');
        await expect(dialog.getByText('Select saved searches for view')).toBeVisible();
        await expect(dialog.getByText('Select desks for view')).toBeHidden();

        // both toggle boxes are offered on this step; note that the private one showing up
        // does not by itself prove the workspace entry point, `showPrivateSavedSearches`
        // starts out true everywhere and is only turned off for desks (`AggregateSettings.ts`)
        await expect(dialog.getByText('Global saved searches')).toBeVisible();
        await expect(dialog.getByText('Private saved searches')).toBeVisible();

        await monitoring.openMonitoringSettingsTab('Reorder Sections');
        await expect(dialog.getByText('Reorder stages and saved searches for monitoring view')).toBeVisible();
        await expect(dialog.getByText('Select saved searches for view')).toBeHidden();

        await monitoring.openMonitoringSettingsTab('Items Count');
        await expect(dialog.getByText('Set maximum items per stages and saved searches for view')).toBeVisible();
        await expect(dialog.getByText('Reorder stages and saved searches for monitoring view')).toBeHidden();

        await monitoring.openMonitoringSettingsTab('Desks');
        await expect(dialog.getByText('Select desks for view')).toBeVisible();

        await monitoring.closeMonitoringSettings();
    });
});
