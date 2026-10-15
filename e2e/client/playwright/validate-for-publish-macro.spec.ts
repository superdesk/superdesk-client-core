import {test, expect, Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * Covers the "Validate for Publish" macro: it runs publish validation on demand so an
 * author learns about validation errors before the deadline instead of at publish time.
 *
 * Every documented expected result is asserted, so there is no blocker on this case.
 * The in-flight state of the widget (the macro list sits behind `sd-loading` while the
 * request runs) is not asserted: it is a mechanism of "waits for server response", not
 * an outcome, and holding the response back to observe it buys no extra coverage.
 */

const ARTICLE = 'test sports story';
const MACRO = 'Validate for Publish';

/**
 * `Story`, the content profile every article in the `main` snapshot carries, caps slugline
 * at 24 characters, so a longer one fails publish validation while still saving fine: the
 * authoring header renders slugline as a plain input with no maxlength of its own.
 */
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

        // the macro validates the item as stored in `archive`, not what sits in the editor,
        // so the edit has to be persisted before the macro can see it
        await authoring.save();

        await authoring.openWidget('Macros');
        await authoring.runMacro(MACRO);

        const error = page.getByTestId('notification--error').filter({hasText: SLUGLINE_ERROR});

        await expect(error).toBeVisible();

        // notifications are de-duplicated by message text, so the macro's own toast has to be
        // gone before publishing or the assertion after it would pass on the toast still shown
        await error.click();
        await expect(error).toBeHidden();

        await authoring.publish({subscribers: []});

        await expect(error).toBeVisible();

        // a successful publish closes authoring, and the toast above is raised on the branch
        // that leaves it open, so by now the publish is known to have been rejected
        await expect(page.getByTestId('authoring')).toBeVisible();
    });

    test('reports no error when the item passes publish validation', async ({page}) => {
        const authoring = new Authoring(page);

        await restoreDatabaseSnapshot();
        await openArticleForEditing(page);

        const panel = await authoring.openWidget('Macros');
        const response = await authoring.runMacro(MACRO);

        // the macro raises no toast when validation passes, so the server's answer and the
        // widget closing itself are the whole of the reported outcome
        expect(response.ok()).toBe(true);

        await expect(panel).toBeHidden();
        await expect(page.getByTestId('notification--error')).toHaveCount(0);
    });
});
