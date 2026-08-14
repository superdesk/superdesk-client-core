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
