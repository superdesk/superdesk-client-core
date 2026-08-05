import {test, expect, type Locator, type Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';
import {TreeSelectDriver} from './utils/tree-select-driver';

test.use({
    storageState: getStorageState({}, {authoringReact: true}),
});

// A snapshot restore plus a save/reopen round trip does not fit in the default 30s budget.
test.setTimeout(90000);

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

        const editView = page.getByTestId('template-edit-view');

        // Saving refetches the template list, so the row and its actions popover can be swapped out
        // from under the click. Retry the whole open until the modal is actually up.
        await expect(async () => {
            if (!await editView.isVisible()) {
                await page.getByTestId('template-content')
                    .getByTestId('content-template')
                    .and(page.locator(`[data-test-value="${templateName}"]`))
                    .getByTestId('template-actions')
                    .click({timeout: 5000});

                await page.getByTestId('template-actions--options')
                    .getByRole('button', {name: 'Edit'})
                    .click({timeout: 5000});
            }

            await expect(editView).toBeVisible({timeout: 5000});
        }).toPass({timeout: 30000});
    }

    function saveButton(page: Page): Locator {
        return page.getByTestId('template-edit-view').getByRole('button', {name: 'Save'});
    }

    /**
     * The metadata box is a `sd-toggle-box`; its header comes from the ui framework and carries no
     * test id, and its content is not in the DOM until it is expanded. Clicking the header toggles,
     * so only click when it is still collapsed.
     */
    async function expandMetadataBox(page: Page): Promise<Locator> {
        const metadata = page.getByTestId('template-metadata');
        const usageTerms = metadata.getByTestId('usage-terms');

        if (!await usageTerms.isVisible()) {
            await metadata.getByText('Metadata').click();
        }

        await expect(usageTerms).toBeVisible();

        return metadata;
    }

    /**
     * Typing before authoring-react finishes initializing updates the DOM but not its state,
     * leaving the modal clean and Save disabled. Retry the first edit of a freshly opened
     * template until Save enables; that is the only signal that the editor is live. Later edits
     * in the same modal can use `setBody`, since the form is dirty and the signal is gone.
     */
    async function setBodyOnceEditorIsLive(page: Page, value: string): Promise<void> {
        await expect(async () => {
            await setBody(page, value);
            await expect(saveButton(page)).toBeEnabled({timeout: 1000});
        }).toPass({timeout: 15000});
    }

    async function setBody(page: Page, value: string): Promise<void> {
        await setEditor3FieldValue(templateField(page, 'body_html').getByRole('textbox'), value);
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

        await expect(templateField(page, 'body_html')).toContainText('FIXME');

        await setBodyOnceEditorIsLive(page, editedBody);

        await saveButton(page).click();
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

    /**
     * A template is embedded JSON, not a stored article. Authoring chrome that addresses the entity
     * by `_id`, or writes back through a path the template editor does not read, has no business
     * rendering here: it either does nothing or discards what the user did.
     */
    test('article chrome that cannot apply to a template is not rendered', async ({page}) => {
        const requestsForUndefinedIds: Array<string> = [];

        page.on('request', (request) => {
            const url = request.url();

            if (url.includes('/api/') && url.includes('undefined')) {
                requestsForUndefinedIds.push(url);
            }
        });

        await restoreDatabaseSnapshot();
        await openTemplateEditor(page, 'story 2');

        const editView = page.getByTestId('template-edit-view');

        // Hard gates: these widgets sit in the same two react toolbars as the chrome asserted
        // absent below, so they make those assertions about what was left out rather than about
        // what had not rendered yet.
        await expect(editView.getByTestId('authoring-header-word-count')).toBeVisible();
        await expect(editView.getByRole('button', {name: 'Print preview'})).toBeVisible();

        // Soft, so that one piece of chrome coming back does not hide the state of the others.
        await expect.soft(editView.getByLabel('Content Profile')).toBeVisible();

        // The angular header keeps the working control; the react one wrote the switch through
        // `reinitialize`, which never reaches `template.data`.
        await expect.soft(editView.getByTestId('content-profile-select')).toHaveCount(0);

        await expect.soft(editView.getByRole('button', {name: 'Actions menu'})).toHaveCount(0);

        expect.soft(requestsForUndefinedIds).toEqual([]);
    });

    /**
     * The react editor and the angular metadata panel both write to `template.data`. Whichever of
     * them replaced that object last used to win the save, silently discarding the other's edits.
     */
    test('metadata edited after a react field edit is saved', async ({page}) => {
        const editedBody = 'Body edited in the react editor.';
        const usageTerms = 'Editorial use only';

        await restoreDatabaseSnapshot();
        await openTemplateEditor(page, 'story 2');

        await setBodyOnceEditorIsLive(page, editedBody);

        await (await expandMetadataBox(page)).getByTestId('usage-terms').fill(usageTerms);

        await saveButton(page).click();
        await expect(page.getByTestId('template-edit-view')).toBeHidden();

        await openTemplateEditor(page, 'story 2');

        await expect(templateField(page, 'body_html')).toContainText(editedBody);
        await expect((await expandMetadataBox(page)).getByTestId('usage-terms')).toHaveValue(usageTerms);
    });

    test('a react field edited after target subscribers were set is saved', async ({page}) => {
        const editedBody = 'Body edited after targeting.';

        await restoreDatabaseSnapshot();
        await openTemplateEditor(page, 'story 2');

        async function selectedSubscribers(): Promise<Locator> {
            return (await expandMetadataBox(page)).getByTestId('target-subscribers').getByTestId('item');
        }

        // Establishes that the react editor is live before the angular write, so the edit that
        // follows it is known to register.
        await setBodyOnceEditorIsLive(page, 'Body edited before targeting.');

        await new TreeSelectDriver(
            page,
            (await expandMetadataBox(page)).getByTestId('target-subscribers'),
        ).addValues('Subscriber 1');

        // Counting the selected chips rather than reading their labels: the server does not
        // necessarily round-trip the subscriber name, only whether the targeting survived matters.
        await expect(await selectedSubscribers()).toHaveCount(1);

        await setBody(page, editedBody);

        await saveButton(page).click();
        await expect(page.getByTestId('template-edit-view')).toBeHidden();

        await openTemplateEditor(page, 'story 2');

        await expect(templateField(page, 'body_html')).toContainText(editedBody);
        await expect(await selectedSubscribers()).toHaveCount(1);
    });
});
