import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s, sleep} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({corrections_workflow: true}),
});

test('can correct published item', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=Story 5')),
    ).not.toBeVisible();

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=Story 5')),
        'Publishing actions',
        'Correct item',
    );

    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=Story 5')),
    ).toBeVisible();
    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=Story 5')).getByTitle('Correction'),
    ).toBeVisible();

    // edit item
    await page.locator(s('authoring')).locator(s('field--headline')).getByRole('textbox').clear();
    await page.locator(s('authoring')).locator(s('field--headline')).getByRole('textbox').fill('Story 5.1');
    await page.locator(s('authoring-topbar')).getByRole('button', {name: 'Save'}).click();
    await authoring.waitingForToastMsg('success', 'Item updated.');

    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page
        .locator(s('authoring', 'interactive-actions-panel'))
        .getByRole('button', {name: 'Send correction'})
        .click();

    await expect(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=Story 5.1')),
    ).toBeVisible();

    await page.goto('/#/publish_queue');
    await expect(page.locator(s('publish-queue-item=Story 5.1'))).toBeAttached({timeout: 10000});
});
