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
 * the dialog), step 6 (the Saved Searches tab also offers private saved searches, unlike a
 * desk's) and the case's single documented expected result, i.e. the dialog offering the
 * Desks, Saved searches, Reorder sections and Items count tabs.
 *
 * BLOCKER: steps 3-5 ask the tester to run the per-tab cases 1315934713 (Desks tab),
 * 1315934717 (Reorder sections tab) and 1315934719 (Items count tab) starting from a custom
 * workspace, which is where the monitoring view actually gets configured. None of that is
 * automated for this entry point: 1315934713 has a spec (`monitoring.settings.spec.ts`,
 * itself partial) that only exercises the desk entry point, and 1315934717 / 1315934719 have
 * no spec at all. Those steps still have to be run manually, hence the partial annotation.
 */
test.describe('monitoring settings of a custom workspace', () => {
    const TAB_TITLES = ['Desks', 'Saved Searches', 'Reorder Sections', 'Items Count'];

    test('open from the toolbar and expose the desks, saved searches, reorder and items count tabs', {
        annotation: [
            // Configure personal Monitoring view in custom workspace
            {type: 'confluence', description: '1318323011 partial'},
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

        // the private saved searches box is what makes this step differ from the same
        // step opened on a desk, where only global saved searches are offered
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
