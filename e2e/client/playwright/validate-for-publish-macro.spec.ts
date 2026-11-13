import {test, expect, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

// Covers the "Validate for Publish" macro. The in-flight state (macro list behind `sd-loading`)
// is not asserted: it is part of "waits for server response", not an outcome.

const ARTICLE = 'test sports story';
const MACRO = 'Validate for Publish';

// The `Story` profile caps slugline at 24 chars; the header input has no maxlength, so saving still works.
const TOO_LONG_SLUGLINE = 'a slugline well past the profile limit';
const SLUGLINE_ERROR = 'SLUGLINE is too long';

test.setTimeout(60000);

async function openArticleForEditing(page: Page): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const workingStage = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports / Working Stage"]'));

    await monitoring.executeActionOnMonitoringItem(
        workingStage.getByTestId('article-item').filter({hasText: ARTICLE}),
        'Edit',
    );
}

test.describe('validate for publish macro', {
    annotation: [
        {type: 'confluence', description: '1332117823 complete'}, // Validate For Publish
    ],
}, () => {
    test('reports the validation errors a publish attempt would raise', async ({page}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await openArticleForEditing(page);

        await page.getByTestId('authoring').getByTestId('field-slugline').fill(TOO_LONG_SLUGLINE);

        // the macro validates the stored item, not the editor contents
        await authoring.save();

        await authoring.openWidget('Macros');
        await authoring.runMacro(MACRO);

        const error = page.getByTestId('notification--error').filter({hasText: SLUGLINE_ERROR});

        await expect(error).toBeVisible();

        // toasts are de-duplicated by text: dismiss this one or the later assertion could pass on it
        await error.click();
        await expect(error).toBeHidden();

        await authoring.publish({subscribers: []});

        await expect(error).toBeVisible();

        // a successful publish closes authoring, so it staying open confirms the rejection
        await expect(page.getByTestId('authoring')).toBeVisible();
    });

    test('reports no error when the item passes publish validation', async ({page}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await openArticleForEditing(page);

        const panel = await authoring.openWidget('Macros');
        const response = await authoring.runMacro(MACRO);

        // no toast on success: the response and the widget closing are the outcome
        expect(response.ok()).toBe(true);

        await expect(panel).toBeHidden();
        await expect(page.getByTestId('notification--error')).toHaveCount(0);
    });
});
