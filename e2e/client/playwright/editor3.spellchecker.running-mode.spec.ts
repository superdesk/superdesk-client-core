import {Monitoring} from './page-object-models/monitoring';
import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({spellchecking: {defaultRunningMode: 'initially-disabled'}}),
});

test('configuring spellchecker to be disabled until user enables it manually', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'spellchecker'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=spellchecker test'),
    ).dblclick();

    /**
     * Wait for dictionary to load.
     * Using a timeout is not ideal, but there are no UI elements that indicate it.
     * It doesn't make sense at the moment to build it either before angular based authoring is removed.
     */
    await page.waitForTimeout(3000);

    // ensure body_html has loaded before asserting 0 spellchecker warnings count
    await expect(page.locator(s('authoring', 'authoring-field=body_html', 'editor3'))).toBeVisible();

    await expect(page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning'))).toHaveCount(0);

    await page.locator(s('authoring-topbar', 'actions-button')).click();
    await page.locator(s('actions-list')).getByRole('button', {name: 'Ctrl+Shift+Y Check spelling'}).click();

    await expect(page.locator(s('authoring', 'authoring-field=body_html', 'spellchecker-warning'))).toHaveCount(2);
});
