import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test.setTimeout(50000);

/**
 * publish an item
 * correct it - change headline, body
 * send correction, open the item again and see if changes persist
 *
 * test added after discovering a bug SDESK-7248
 */
test('correcting with unsaved changes', async ({page}) => {
    const getHeadlineField = async () => await page.locator(s('authoring', 'field--headline')).getByRole('textbox');
    const getBodyField = async () =>
        await page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox');

    await restoreDatabaseSnapshot();

    await page.goto('/#/workspace/monitoring');

    // publishing the article start

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page.locator(s('authoring', 'publish')).click();

    // publishing the article end

    await page.locator(
        s('monitoring-group=Sports desk output', 'article-item=test sports story'),
    ).dblclick({timeout: 10000}); // need to wait until published item appears in output

    await page.locator(s('authoring', 'authoring-topbar')).getByLabel('Correct').click();

    await (await getHeadlineField()).clear();
    await (await getHeadlineField()).fill('test sports story [corrected]');

    await (await getBodyField()).clear();
    await (await getBodyField()).fill('test sport story body [corrected]');

    await page.locator(s('authoring', 'authoring-topbar')).getByRole('button', {name: 'Send Correction'}).click();

    await page.locator(
        s('monitoring-group=Sports desk output', 'article-item=test sports story [corrected]'),
    ).dblclick({timeout: 10000}); // need to wait until published item appears in output

    // initialize correction only to make field editable and accessible using the same selector
    await page.locator(s('authoring', 'authoring-topbar')).getByLabel('Correct').click();

    await expect((await getHeadlineField())).toHaveText('test sports story [corrected]');
    await expect((await getBodyField())).toHaveText('test sport story body [corrected]');
});
