import {expect, test} from '@playwright/test';
import {readFile} from 'fs/promises';
import {ExportDialog} from './page-object-models/export';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {readZipEntries} from './utils/zip';

// restoreDatabaseSnapshot allows the restore itself 30s, the whole default budget, and
// this test walks the case end to end afterwards.
test.setTimeout(60000);

/**
 * QA case "Export article" (1311835225).
 *
 * A text item is exported from Monitoring through its 3-dot menu: the Export dialog
 * preselects the NINJS formatter and offers a Validate toggle, Cancel closes it without
 * exporting, and Export downloads the item's NINJS rendition.
 *
 * Two points where the product does not match the case's wording. The spec asserts what
 * the product actually does:
 *  - the case calls the preselected formatter "NINJS". The select is filled from
 *    `GET /api/formatters?criteria=can_export`, which returns formatter class names, so
 *    the option reads "NINJSFormatter".
 *  - the case says the item is saved "in txt format". The backend always packs the
 *    formatted items into a ZIP and serves it as `attachment; filename="export.zip"`,
 *    so the browser saves `export.zip` and the txt file the case describes is its single
 *    entry, named `<slugline>_<unique_id>.txt`. The archive also arrives through a new
 *    tab rather than the current one; see `ExportDialog.submit`.
 *
 * The case's "Validate checkbox slide" expected result documents no behaviour beyond the
 * control itself, so the spec asserts the toggle's own state and, separately, that the
 * export request carries the default `validate: false`. What `validate: true` does to an
 * export is not covered.
 *
 * "Export is available for text items only" needs a non-text item; the `main` snapshot's
 * only one is `Package Highlight 1` (type `composite`), in Sports / Working Stage next to
 * the text item this case exports.
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

        // toHaveCount(0) would pass just as well on a mis-targeted locator, so anchor
        // on an action the package does offer before asserting that Export is absent.
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

        // The directive preselects the first formatter the endpoint returns, so both
        // assertions together are what "NINJS is preselected" means here.
        await expect(exportDialog.formatterSelect.locator('option').first()).toHaveText('NINJSFormatter');
        await expect(exportDialog.selectedFormatter).toHaveText('NINJSFormatter');

        // sd-switch replaces its element with a plain span and mirrors the ng-model
        // onto a `checked` attribute, which jQuery drops entirely while the toggle is
        // off. There is no input whose checked state could be read instead.
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

        // The toggle is left untouched here, so `false` is the directive's own default
        // (Export.ts init()). This pins the default payload, not the toggle's wiring.
        expect(requestPayload.validate).toBe(false);
        expect(requestPayload.item_ids).toHaveLength(1);

        expect(download.suggestedFilename()).toBe('export.zip');

        const archivePath = await download.path();
        const entries = readZipEntries(await readFile(archivePath));

        // The backend names the entry `<slugline>_<unique_id>.txt`; both come from the
        // snapshot's "test sports story".
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
