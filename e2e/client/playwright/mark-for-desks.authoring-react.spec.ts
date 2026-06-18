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
