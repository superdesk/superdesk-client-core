import {test, expect, type Locator, type Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

/**
 * SDESK-7822. The Settings > Templates editor rendered an empty body under authoring-react for
 * every template: profile-less kill/takedown templates never reached the react branch at all,
 * and the ones that did crashed on mount.
 */
test.describe('settings template editor (authoring-react)', () => {
    function templateField(page: Page, fieldId: string): Locator {
        return page.getByTestId('template-edit-view')
            .getByTestId('authoring-field')
            .and(page.locator(`[data-test-value="${fieldId}"]`));
    }

    async function openTemplateEditor(page: Page, templateName: string): Promise<void> {
        await page.goto('/#/settings/templates');

        await page.getByTestId('template-content')
            .getByTestId('content-template')
            .and(page.locator(`[data-test-value="${templateName}"]`))
            .getByTestId('template-actions')
            .click();

        await page.getByTestId('template-actions--options').getByRole('button', {name: 'Edit'}).click();
    }

    test('kill template editor renders its stored field values', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTemplateEditor(page, 'kill');

        await expect(templateField(page, 'headline')).toContainText('Kill/Takedown notice');
        await expect(templateField(page, 'anpa_take_key')).toContainText('KILL/TAKEDOWN');
        await expect(templateField(page, 'body_html')).toContainText('FIXME');
        await expect(templateField(page, 'abstract')).toBeVisible();
        await expect(templateField(page, 'ednote')).toBeVisible();
    });

    test('editing a takedown template body persists after reopening', async ({page}) => {
        const editedBody = 'This item has been taken down.';

        await restoreDatabaseSnapshot();
        await openTemplateEditor(page, 'takedown');

        const body = templateField(page, 'body_html');

        await expect(body).toContainText('FIXME');

        const saveButton = page.getByTestId('template-edit-view').getByRole('button', {name: 'Save'});

        // Typing before authoring-react finishes initializing updates the DOM but not its
        // state, leaving the modal clean and Save disabled. Retry the edit until it registers.
        await expect(async () => {
            await setEditor3FieldValue(body.getByRole('textbox'), editedBody);
            await expect(saveButton).toBeEnabled({timeout: 1000});
        }).toPass({timeout: 15000});

        await saveButton.click();
        await expect(page.getByTestId('template-edit-view')).toBeHidden();

        await openTemplateEditor(page, 'takedown');
        await expect(templateField(page, 'body_html')).toContainText(editedBody);
    });

    test('template with a content profile renders its profile fields', async ({page}) => {
        await restoreDatabaseSnapshot();
        await openTemplateEditor(page, 'story 2');

        await expect(templateField(page, 'headline')).toBeVisible();
        await expect(templateField(page, 'body_html')).toBeVisible();

        // `genre` and `place` are in this profile but absent from the template data; reading them
        // used to throw and leave the whole editor unrendered.
        await expect(templateField(page, 'genre')).toBeVisible();
        await expect(templateField(page, 'place')).toBeVisible();

        // Only profile-less templates fall back to the fixed kill-template field set.
        await expect(templateField(page, 'anpa_take_key')).toBeHidden();
    });
});
