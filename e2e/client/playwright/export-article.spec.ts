import {expect, test} from '@playwright/test';
import {readFile} from 'fs/promises';
import {ExportDialog} from './page-object-models/export';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {readZipEntries} from './utils/zip';

// restoreDatabaseSnapshot alone can use the whole 30s default budget.
test.setTimeout(60000);

/**
 * QA case "Export article" (1311835225). Deviations from the case's wording:
 *  - the preselected formatter reads "NINJSFormatter", not "NINJS" (class name from
 *    `GET /api/formatters?criteria=can_export`).
 *  - the item is not saved as txt: the backend always serves `export.zip`, and the txt
 *    is its single entry. See `ExportDialog.submit` for how the archive arrives.
 *  - "Validate checkbox slide" is asserted as the toggle's state plus the default
 *    `validate: false` in the request; what `validate: true` does is not covered.
 *  - the non-text item for "text items only" is the snapshot's `Package Highlight 1`.
 */
test('exporting a text item as NINJS from the monitoring 3-dot menu', {
    annotation: [
        {type: 'confluence', description: '1311835225 complete'}, // Export article (AUTOMATED)
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);
    const exportDialog = new ExportDialog(page);
    const exportRequests: Array<string> = [];

    page.on('request', (request) => {
        if (request.url().includes('/api/export') && request.method() === 'POST') {
            exportRequests.push(request.url());
        }
    });

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const workingStage = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports / Working Stage"]'));
    const textItem = workingStage.getByTestId('article-item')
        .and(page.locator('[data-test-value="test sports story"]'));
    const packageItem = workingStage.getByTestId('article-item')
        .and(page.locator('[data-test-value="Package Highlight 1"]'));

    await expect(textItem).toBeVisible();
    await expect(packageItem).toBeVisible();

    await test.step('Export is offered on the text item and withheld from the package', async () => {
        const packageMenu = await monitoring.openActionsMenu(packageItem);

        // Anchor on an action the package does offer, so toHaveCount(0) cannot pass on a
        // mis-targeted locator.
        await expect(packageMenu.getByRole('button', {name: 'Edit', exact: true})).toBeVisible();
        await expect(packageMenu.getByRole('button', {name: 'Export', exact: true})).toHaveCount(0);

        await monitoring.closeActionsMenu();

        const textMenu = await monitoring.openActionsMenu(textItem);

        await expect(textMenu.getByRole('button', {name: 'Export', exact: true})).toBeVisible();

        await monitoring.closeActionsMenu();
    });

    await test.step('the dialog preselects NINJSFormatter and toggles Validate', async () => {
        await monitoring.executeActionOnMonitoringItem(textItem, 'Export');

        await expect(exportDialog.modal).toBeVisible();

        // The directive preselects the first formatter the endpoint returns.
        await expect(exportDialog.formatterSelect.locator('option').first()).toHaveText('NINJSFormatter');
        await expect(exportDialog.selectedFormatter).toHaveText('NINJSFormatter');

        // sd-switch is a plain span; its state is a `checked` attribute that jQuery
        // removes while off. There is no input to read.
        await expect(exportDialog.validateSwitch).toBeVisible();
        await expect(exportDialog.validateSwitch).not.toHaveAttribute('checked');

        await exportDialog.validateSwitch.click();
        await expect(exportDialog.validateSwitch).toHaveAttribute('checked', 'checked');

        await exportDialog.validateSwitch.click();
        await expect(exportDialog.validateSwitch).not.toHaveAttribute('checked');
    });

    await test.step('Cancel closes the dialog without exporting', async () => {
        await exportDialog.cancel();

        expect(exportRequests).toEqual([]);
    });

    await test.step('Export downloads a ZIP holding the item as NINJS', async () => {
        await monitoring.executeActionOnMonitoringItem(textItem, 'Export');

        await expect(exportDialog.modal).toBeVisible();

        const {response, download} = await exportDialog.submit();

        expect(response.status()).toBe(201);

        const requestPayload = response.request().postDataJSON();

        expect(requestPayload.format_type).toBe('NINJSFormatter');

        // Toggle untouched: `false` is the directive's default (Export.ts init()).
        expect(requestPayload.validate).toBe(false);
        expect(requestPayload.item_ids).toHaveLength(1);

        expect(download.suggestedFilename()).toBe('export.zip');

        const archivePath = await download.path();
        const entries = readZipEntries(await readFile(archivePath));

        // Entry name is `<slugline>_<unique_id>.txt`.
        expect([...entries.keys()]).toEqual(['test sports story_1.txt']);

        const ninjs = JSON.parse(entries.get('test sports story_1.txt') as string);

        expect(ninjs).toMatchObject({
            type: 'text',
            headline: 'test sports story',
            slugline: 'test sports story',
            body_html: '<p>test sport story body</p>',
            language: 'en',
            priority: 6,
        });
        expect(ninjs.guid).toBe(requestPayload.item_ids[0]);

        await expect(exportDialog.modal).toBeHidden();
    });
});
