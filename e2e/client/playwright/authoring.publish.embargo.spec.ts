import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({ui: {publishEmbargo: false}}),
});

test('disabling publish embargo by adjusting instance configuration', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(s('authoring', 'open-send-publish-pane')).click();

    // "target" section is not relevant for this test
    // but is used as a control to make sure panel content has finished loading
    await expect(
        page.locator(s('authoring', 'interactive-actions-panel')).getByRole('button', {name: 'Target'}),
    ).toBeVisible();

    await expect(
        page.locator(s('authoring', 'interactive-actions-panel')).getByRole('button', {name: 'Embargo'}),
    ).not.toBeVisible();
});
