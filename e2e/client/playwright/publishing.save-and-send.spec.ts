import {test, expect} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';

test.setTimeout(60000);

test('publishing with a single "Save and send" after fixing a validation error', {
    annotation: [
        {type: 'jira', description: 'SDESK-7993'},
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    // 'main' plus a Story profile that requires a non-empty headline for publishing
    await restoreDatabaseSnapshot({snapshotName: 'required-headline'});
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: 'test sports story'}),
        'Edit',
    );

    const headline = page.getByTestId('field--headline').getByRole('textbox');

    const saveButton = page.getByTestId('authoring-topbar').getByTestId('save');

    // the editor initializes asynchronously; clearing before content arrives is a no-op
    await expect(headline).toHaveText('test sports story');
    await authoring.replaceEditor3FieldText(headline, '');

    // the editor propagates changes to the angular scope with a debounce;
    // the save button enabling is the signal that the edit registered
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(
        page.getByTestId('notification--success').filter({hasText: 'Item updated.'}),
    ).toBeVisible();

    await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

    const panel = page.getByTestId('interactive-actions-panel');

    await panel.getByTestId('tabs').getByRole('tab', {name: 'Publish'}).click();

    /**
     * The failed attempt is part of the regression scenario: it unlocks the item,
     * and the fix under test is that a later "Save and send" still publishes even
     * though its own unlock request then fails.
     */
    await panel.getByTestId('publish').click();

    await expect(
        page.getByTestId('notification--error').filter({hasText: 'HEADLINE'}),
    ).toBeVisible();

    await authoring.replaceEditor3FieldText(headline, 'sports story with headline');

    // publishing before the debounced edit reaches the scope would skip the "Save changes?" prompt
    await expect(saveButton).toBeEnabled();

    await panel.getByTestId('publish').click();

    await page.getByTestId('modal-confirm').getByRole('button', {name: 'save and send'}).click();

    await expect(page.getByTestId('authoring')).toBeHidden();

    await expect(
        page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports desk output"]'))
            .getByTestId('article-item')
            .filter({hasText: 'sports story with headline'}),
    ).toBeVisible();
});

test('aborting publishing when saving from "Save and send" fails', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: 'test sports story'}),
        'Edit',
    );

    const headline = page.getByTestId('field--headline').getByRole('textbox');

    await expect(headline).toHaveText('test sports story');
    await authoring.replaceEditor3FieldText(headline, 'headline that will not be saved');

    // the editor propagates changes to the scope with a debounce; publishing before the
    // edit registers would skip the "Save changes?" prompt
    await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeEnabled();

    // fail the save issued by "Save and send"; autosave (archive_autosave) and
    // publish (archive_publish) live on other paths and are not affected
    await page.route('**/api/archive/*', (route) => {
        if (route.request().method() === 'PATCH') {
            route.fulfill({status: 500, contentType: 'application/json', body: '{}'});
        } else {
            route.continue();
        }
    });

    await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

    const panel = page.getByTestId('interactive-actions-panel');

    await panel.getByTestId('tabs').getByRole('tab', {name: 'Publish'}).click();
    await panel.getByTestId('publish').click();

    /**
     * The user-visible assertions below can all pass in the gap between the failed save
     * and a wrongly issued publish request (the error toast renders before the publish
     * request is even sent), so the airtight check is that no publish request leaves the
     * browser within an observation window that comfortably covers that gap.
     */
    const publishRequested = page.waitForRequest(
        (request) => request.method() === 'PATCH' && request.url().includes('publish'),
        {timeout: 3000},
    ).then(() => true, () => false);

    await page.getByTestId('modal-confirm').getByRole('button', {name: 'save and send'}).click();

    await expect(
        page.getByTestId('notification--error').filter({hasText: 'Item not updated'}),
    ).toBeVisible();

    // the item must be neither published (with its stale content) nor closed
    expect(await publishRequested).toBe(false);
    await expect(page.getByTestId('authoring')).toBeVisible();

    await expect(
        page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports desk output"]'))
            .getByTestId('article-item')
            .filter({hasText: 'test sports story'}),
    ).toHaveCount(0);
});
