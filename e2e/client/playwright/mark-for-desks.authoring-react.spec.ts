import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';
import {TreeSelectDriver} from './utils/tree-select-driver';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

test('mark for desks: per-action toggle via modal (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot();
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        'Edit',
    );

    await authoring.waitForAuthoringReactToInitialize();

    // No desks marked initially: the topbar bell widget should be absent.
    const bell = page.locator('#marked-for-desks');

    await expect(bell).toHaveCount(0);

    await page.getByRole('button', {name: 'Actions menu'}).click();
    await page.getByText('Marked for desks', {exact: true}).click();

    const modal = page.locator(s('modal-mark-for-desks'));

    await expect(modal).toBeVisible();

    // Selecting a desk fires the toggle endpoint immediately. No Save button.
    await new TreeSelectDriver(page, modal.locator(s('desks-select'))).addValues('Finance');

    await expect(bell).toBeVisible();

    // Clearing the chip fires the toggle again, unmarking Finance.
    await new TreeSelectDriver(page, modal.locator(s('desks-select'))).setValues();

    await expect(bell).toHaveCount(0);
});

test('mark for desks: clear-all removes every desk and keeps list bell hidden (authoring-react)', async ({page}) => {
    await restoreDatabaseSnapshot();
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const listItem = page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'));

    await monitoring.executeActionOnMonitoringItem(listItem, 'Edit');

    await authoring.waitForAuthoringReactToInitialize();

    const bell = page.locator('#marked-for-desks');

    await expect(bell).toHaveCount(0);

    await page.getByRole('button', {name: 'Actions menu'}).click();
    await page.getByText('Marked for desks', {exact: true}).click();

    const modal = page.locator(s('modal-mark-for-desks'));

    await expect(modal).toBeVisible();

    const desksSelect = new TreeSelectDriver(page, modal.locator(s('desks-select')));

    await desksSelect.addValues('Finance', 'Education');

    await expect(bell).toBeVisible();

    const listBell = listItem.locator(s('mark-for-desk--bell'));

    await expect(listBell).toBeVisible();

    // Wait for the list re-query that will be triggered after clearing all desks.
    const listRefresh = page.waitForResponse((response) => (
        response.request().method() === 'GET'
        && (
            response.url().includes('/api/archive')
            || response.url().includes('/api/search')
        )
    ));

    // Clear-all empties the whole selection in one change. The handler must toggle every marked
    // desk, not just the first one, so the article ends up with no marked desks.
    await desksSelect.setValues();

    await expect(bell).toHaveCount(0);
    expect(await desksSelect.getValues()).toEqual([]);

    // After the scheduled list query returns, the bell must still be gone.
    // This guards against stale ES data resurrecting the bell.
    await listRefresh;
    await expect(listBell).toHaveCount(0);
});

test('mark for desks: editor reflects a desk unmarked from the monitoring list (authoring-react)', async ({
    page,
}) => {
    await restoreDatabaseSnapshot();
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const listItem = page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'));

    await monitoring.executeActionOnMonitoringItem(listItem, 'Edit');
    await authoring.waitForAuthoringReactToInitialize();

    // Mark a desk from the editor.
    await page.getByRole('button', {name: 'Actions menu'}).click();
    await page.getByText('Marked for desks', {exact: true}).click();

    const modal = page.locator(s('modal-mark-for-desks'));

    await expect(modal).toBeVisible();
    await new TreeSelectDriver(page, modal.locator(s('desks-select'))).addValues('Education');

    const bell = page.locator('#marked-for-desks');

    await expect(bell).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    // Unmark it from the monitoring list, a surface outside the open, locked editor.
    const listBell = listItem.locator(s('mark-for-desk--bell'));

    await expect(listBell).toBeVisible();
    await listBell.click();

    const listMarks = page.locator(s('marked-desk-list'));

    await expect(listMarks).toBeVisible();
    await listMarks.getByRole('button', {name: 'remove'}).click();

    // The editor must reflect the external change: its marked-for-desks bell disappears.
    await expect(bell).toHaveCount(0);
});
