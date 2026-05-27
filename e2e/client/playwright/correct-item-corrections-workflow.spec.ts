import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s, waitForToastMessage} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({corrections_workflow: true}),
});

test.setTimeout(60000);

test('can correct published item using corrections workflow', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await expect(
        page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
    ).toBeVisible();

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
        page
            .locator(s('monitoring-group=Sports / Working Stage', 'article-item=Story 5'))
            .getByText('Correction', {exact: true}),
    ).toBeVisible();

    await setEditor3FieldValue(
        page.locator(s('authoring')).locator(s('field--headline')).getByRole('textbox'),
        'Story 5.1',
    );
    await page.locator(s('authoring-topbar')).getByRole('button', {name: 'Save'}).click();
    await waitForToastMessage(page, 'success', 'Item updated.');

    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page
        .locator(s('authoring', 'interactive-actions-panel'))
        .getByRole('button', {name: 'Send correction'})
        .click();

    await expect(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=Story 5.1')),
    ).toBeVisible();
    await expect(
        page.locator(s('monitoring-group=Sports desk output', 'article-item=Story 5.1')).getByText('Corrected'),
    ).toBeVisible();
    await expect(
        page
            .locator(s('monitoring-group=Sports desk output', 'article-item=Story 5.1'))
            .getByText('Correction', {exact: true}),
    ).not.toBeVisible();

    await page.goto('/#/publish_queue');
    await expect(page.locator(s('publish-queue-item=Story 5.1'))).toBeVisible();
});
