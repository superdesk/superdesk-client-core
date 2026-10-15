import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {MetadataSettings} from './page-object-models/settings/metadata';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {Monitoring} from './page-object-models/monitoring';

/*
 * Lifecycle of a custom datetime field: created, edited and removed under
 * Settings -> Metadata -> Other fields, then used on an article.
 *
 * Custom field types are contributed by the authoring-react field registry, which
 * `setupAuthoringReact` (scripts/core/menu/authoring-switch.ts) registers only while the
 * localStorage flag `auth-react` is set. Without it the create dialog's "Field type" select has
 * no options at all and no custom field can be created, so every test here opts in. The flag is
 * set with `addInitScript` rather than `getStorageState({}, {authoringReact: true})` because that
 * helper rebuilds the state from the committed playwright/.auth/user.json, whose localStorage is
 * keyed to http://localhost:9000; on a slot the client is served from another port, so the
 * rebuilt state carries no session for that origin and the app stays logged out.
 *
 * Where the cases and the product disagree, the product is asserted:
 * - The cases call the field type "Datetime". The registered generic type is labelled
 *   "Datetime (authoring-react)" (id `datetime-v2`, scripts/apps/authoring-react/fields/datetime).
 * - The cases' "Close button" is the footer's "Cancel"; the close icon sits in the dialog header.
 * - The delete confirmation the cases describe ("Confirm" / "Please confirm you want to delete
 *   the vocabulary." / Cancel + OK) has been redesigned: the dialog is headed "Delete
 *   vocabulary?" and its buttons are Cancel and Delete (VocabularyDeletionModal.tsx).
 * - The in-use message the cases quote ("The vocabulary is used in the following content types:")
 *   is now a separate "Cannot delete vocabulary" dialog that lists the content profiles.
 * - The cases call Label a multiselect; the control takes a single label (`data-max-items="1"`
 *   in vocabulary-config-modal.html) and its own hint says so.
 * - The cases expect the per-item Edit and Remove icons to appear on hover. They are laid out
 *   unconditionally, so they are already visible before the cursor reaches the row.
 * - The cases say a custom datetime field "can be used in both header and content". Both sections
 *   do offer it, but only one at a time: the field picker hides any field already configured in
 *   any section (`existsInFields` in ContentProfileFieldsConfig.tsx).
 *
 * Expected results left uncovered:
 * - 1335328976 and 1335328978: the "Initial time offset" number field and the "Time increment
 *   steps" list (Add step button, per-step Remove icon and minutes spinner). Those controls are
 *   the config component of the `datetime` field type in scripts/extensions/datetimeField, and
 *   e2e/client/index.js starts the app with the availability-manager extension only, so that type
 *   is never registered. The type that is registered, `datetime-v2`, declares
 *   `configComponent: null`, so CustomFieldConfigs renders no configuration block whatsoever.
 * - 1344443801: "the date is set to current day and the time is current time + 5 min", blocked by
 *   the same missing Initial time offset configuration.
 * - 1344443801 step 5, re-opening the saved article to see the value again. The value is asserted
 *   on the archive save response instead: after a reload the authoring workspace restores the
 *   article's route but not its editor, so there is nothing stable to re-read the field from.
 * - 1344443801's explicit date entry. The date half of the field only takes input from the
 *   calendar popup, so the test sets the time and asserts the date the component derives.
 */

const FIELD_ID = 'New_other_datetime_Item_1';
const FIELD_NAME = 'New other datetime Item 1';
const FIELD_TYPE_LABEL = 'Datetime (authoring-react)';
const FIELD_TYPE_ID = 'datetime-v2';

/** How the content profile field picker labels the field: display name plus its type. */
const FIELD_PICKER_OPTION = `${FIELD_NAME} (custom vocabulary)`;

const FIELD_TIME = '14:30';

/** What the field picker offers in the Story profile's Header section, minus any custom field. */
const STOCK_HEADER_FIELD_OPTIONS = ['Company Codes', 'Keywords', 'Language', 'Take Key'];

const NEW_FIELD_VALUES = {
    id: FIELD_ID,
    name: FIELD_NAME,
    fieldTypeLabel: FIELD_TYPE_LABEL,
    description: 'Datetime the item refers to',
    helperText: 'Pick a date and a time',
};

/** Renders a date the way the field's date input does; this instance formats dates as dd/mm/yyyy. */
function formatAsDateInput(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${day}/${month}/${date.getFullYear()}`;
}

test.describe.configure({timeout: 120000});

test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('auth-react', 'true');
    });
});

async function createDatetimeField(page: Page): Promise<void> {
    const metadata = new MetadataSettings(page);

    await metadata.openTab('Other fields');
    await metadata.createCustomField(NEW_FIELD_VALUES);
}

test('the create dialog only saves a custom datetime field from its Save button', {
    annotation: [
        {type: 'confluence', description: '1335328976 partial'}, // Add new custom datetime field
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const metadata = new MetadataSettings(page);

    await metadata.openTab('Other fields');
    await metadata.openCreateDialog();

    const dialog = metadata.getDialog();

    await expect(dialog.getByRole('heading', {name: 'Create', exact: true})).toBeVisible();
    await expect(page.getByTestId('vocabulary-edit--id')).toBeVisible();
    await expect(page.getByTestId('vocabulary-edit-field--name')).toBeVisible();
    await expect(dialog.getByLabel('Field type')).toBeVisible();
    await expect(dialog.getByLabel('Description')).toBeVisible();
    await expect(
        dialog.getByRole('textbox', {name: 'Type to search or create a new label'}),
    ).toBeVisible();
    await expect(dialog.getByLabel('Helper text')).toBeVisible();
    await expect(dialog.getByTestId('vocabulary-edit-modal--cancel')).toBeVisible();
    await expect(dialog.getByTestId('vocabulary-edit-modal--close')).toBeVisible();

    await expect(
        dialog.getByLabel('Field type').locator('option').filter({hasText: FIELD_TYPE_LABEL}),
    ).toHaveCount(1);

    await expect(metadata.getSaveButton()).toBeDisabled();

    await metadata.fillDialog(NEW_FIELD_VALUES);
    await expect(metadata.getSaveButton()).toBeEnabled();

    // Spaces are rejected by the id pattern `^[a-zA-Z0-9-_]+$` on the ID input.
    await metadata.fillDialog({id: 'New other datetime Item 1'});
    await expect(metadata.getSaveButton()).toBeDisabled();

    await metadata.fillDialog({id: FIELD_ID});
    await metadata.cancel();
    await expect(metadata.getAddNewButton()).toBeVisible();
    await expect(metadata.getListItem(FIELD_NAME)).toHaveCount(0);

    await metadata.openCreateDialog();
    await metadata.fillDialog(NEW_FIELD_VALUES);
    await metadata.closeWithIcon();
    await expect(metadata.getAddNewButton()).toBeVisible();
    await expect(metadata.getListItem(FIELD_NAME)).toHaveCount(0);

    await metadata.openCreateDialog();
    await metadata.fillDialog(NEW_FIELD_VALUES);
    await metadata.save();
    await expect(metadata.getListItem(FIELD_NAME)).toBeVisible();

    await metadata.openEditDialog(FIELD_NAME);
    expect(await metadata.readDialogValues()).toEqual({
        id: FIELD_ID,
        name: FIELD_NAME,
        fieldType: FIELD_TYPE_ID,
        description: NEW_FIELD_VALUES.description,
        helperText: NEW_FIELD_VALUES.helperText,
    });
});

test('a saved custom datetime field is available to both content profile sections', {
    annotation: [
        {type: 'confluence', description: '1335328976 partial'}, // Add new custom datetime field
        {type: 'confluence', description: '1335328978 partial'}, // Edit custom datetime field
        {type: 'confluence', description: '1344443801 partial'}, // Custom (other) Datetime
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createDatetimeField(page);

    const contentProfileSettings = new ContentProfileSettings(page);

    /*
     * `existsInFields` in ContentProfileFieldsConfig.tsx looks across every section, so once the
     * field is configured anywhere the picker stops offering it. Both sections therefore have to
     * be checked while it is still unconfigured, and the editor is reopened from a fresh load
     * between the two because the open field picker swallows clicks on the section tabs.
     */
    for (const section of ['Header', 'Content']) {
        await page.goto('/#/settings/content-profiles');
        await page.reload();
        await contentProfileSettings.openEditor('Story');
        await contentProfileSettings.openSection(section);

        const picker = await contentProfileSettings.openFieldPicker();

        await expect(picker.getByRole('treeitem', {name: FIELD_PICKER_OPTION, exact: true})).toBeVisible();
    }

    await page.goto('/#/settings/content-profiles');
    await page.reload();
    await contentProfileSettings.addFieldsToContentProfileAndWait('Story', [
        {tabName: 'Content', fieldId: FIELD_NAME, fieldType: 'custom vocabulary'},
    ]);

    await contentProfileSettings.openEditor('Story');
    await contentProfileSettings.openSection('Content');
    await expect(contentProfileSettings.getConfiguredField(FIELD_NAME)).toBeVisible();
});

test('the edit dialog only persists changes from its Save button', {
    annotation: [
        {type: 'confluence', description: '1335328978 partial'}, // Edit custom datetime field
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createDatetimeField(page);

    const metadata = new MetadataSettings(page);
    const item = metadata.getListItem(FIELD_NAME);

    await expect(item).toBeVisible();
    await item.hover();
    await expect(item.getByTestId('vocabulary-item--start-editing')).toBeVisible();
    await expect(item.getByTestId('vocabulary-item--start-removing')).toBeVisible();

    await metadata.openEditDialog(FIELD_NAME);
    await expect(
        metadata.getDialog().getByRole('heading', {name: `Edit ${FIELD_NAME}`, exact: true}),
    ).toBeVisible();
    await expect(page.getByTestId('vocabulary-edit--id')).toHaveJSProperty('readOnly', true);
    await expect(metadata.getSaveButton()).toBeDisabled();

    await metadata.fillDialog({description: 'discarded by Cancel'});
    await expect(metadata.getSaveButton()).toBeEnabled();
    await metadata.cancel();

    await metadata.openEditDialog(FIELD_NAME);
    expect((await metadata.readDialogValues()).description).toEqual(NEW_FIELD_VALUES.description);

    await metadata.fillDialog({description: 'discarded by the close icon'});
    await metadata.closeWithIcon();

    await metadata.openEditDialog(FIELD_NAME);
    expect((await metadata.readDialogValues()).description).toEqual(NEW_FIELD_VALUES.description);

    await metadata.fillDialog({name: 'Renamed datetime field', helperText: 'Pick a moment'});
    await metadata.save();

    await expect(metadata.getListItem('Renamed datetime field')).toBeVisible();
    await metadata.openEditDialog('Renamed datetime field');
    expect(await metadata.readDialogValues()).toEqual({
        id: FIELD_ID,
        name: 'Renamed datetime field',
        fieldType: FIELD_TYPE_ID,
        description: NEW_FIELD_VALUES.description,
        helperText: 'Pick a moment',
    });
});

test('an unused custom datetime field is removed only after confirming', {
    annotation: [
        {type: 'confluence', description: '1335328980 partial'}, // Remove custom datetime field
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createDatetimeField(page);

    const metadata = new MetadataSettings(page);

    await metadata.openDeletionModal(FIELD_NAME);

    const confirmation = page.getByTestId('vocabulary-deletion-modal--can-delete');

    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText('Delete vocabulary?');
    await expect(confirmation).toContainText(
        `You are about to delete the vocabulary ${FIELD_NAME}. This action can't be undone.`,
    );
    await expect(confirmation).toContainText(
        'This vocabulary is not currently used in any Content Profile and can be safely removed.',
    );

    await confirmation.getByRole('button', {name: 'Cancel'}).click();
    await expect(confirmation).toHaveCount(0);
    await expect(metadata.getListItem(FIELD_NAME)).toBeVisible();

    await metadata.openDeletionModal(FIELD_NAME);
    await Promise.all([
        page.waitForResponse(
            (response) => response.url().includes(`/api/vocabularies/${FIELD_ID}`)
                && response.request().method() === 'DELETE',
        ),
        confirmation.getByRole('button', {name: 'Delete'}).click(),
    ]);

    await expect(metadata.getAddNewButton()).toBeVisible();
    await expect(metadata.getListItem(FIELD_NAME)).toHaveCount(0);

    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.openEditor('Story');
    await contentProfileSettings.openSection('Header');

    const picker = await contentProfileSettings.openFieldPicker();

    // Gate on the full stock option set: the removed field must be absent from a loaded list,
    // not from a list that has not rendered yet.
    await expect(picker.getByRole('treeitem')).toHaveText(STOCK_HEADER_FIELD_OPTIONS);
});

test('a custom datetime field used in a content profile cannot be removed', {
    annotation: [
        {type: 'confluence', description: '1335328980 partial'}, // Remove custom datetime field
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createDatetimeField(page);

    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.addFieldsToContentProfileAndWait('Story', [
        {tabName: 'Header', fieldId: FIELD_NAME, fieldType: 'custom vocabulary'},
    ]);

    /*
     * The deletion modal decides which variant to show from `sdApi.contentProfiles.getAll()`,
     * which reads the in-memory dataStore seeded at boot and refreshed only by websocket resource
     * messages. Reload so it sees the profile that now uses the field. The reload has to happen
     * on the destination route: reloading first and navigating by hash straight after leaves the
     * settings view half built.
     */
    await page.goto('/#/settings/vocabularies');
    await page.reload();

    const metadata = new MetadataSettings(page);

    await metadata.openTab('Other fields');
    await metadata.openDeletionModal(FIELD_NAME);

    const refusal = page.getByTestId('vocabulary-deletion-modal--cannot-delete');

    await expect(refusal).toBeVisible();
    await expect(refusal).toContainText('Cannot delete vocabulary');
    await expect(refusal).toContainText(
        `The vocabulary ${FIELD_NAME} can't be deleted because it is currently used `
        + 'in the following Content Profile:',
    );
    await expect(refusal.getByRole('listitem')).toHaveText(['Story']);
    await expect(refusal).toContainText(
        'To delete this vocabulary, you must first remove it from all Content Profiles listed above.',
    );

    await refusal.getByRole('button', {name: 'Go back'}).click();
    await expect(refusal).toHaveCount(0);
    await expect(metadata.getListItem(FIELD_NAME)).toBeVisible();
});

test('a custom datetime field on the content profile is editable and saved with the article', {
    annotation: [
        {type: 'confluence', description: '1344443801 partial'}, // Custom (other) Datetime
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createDatetimeField(page);

    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.addFieldsToContentProfileAndWait('Story', [
        {tabName: 'Header', fieldId: FIELD_NAME, fieldType: 'custom vocabulary'},
    ]);

    /*
     * The content profile a new article is built from comes from the dataStore seeded at boot, so
     * without a reload the article would be built from the profile as it was before the add.
     */
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await page.reload();
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');

    const field = page
        .getByTestId('authoring')
        .getByTestId('authoring-field')
        .and(page.locator(`[data-test-value="${FIELD_ID}"]`));

    await expect(field).toBeVisible();
    await expect(field.getByTestId('date-input')).toBeVisible();
    await expect(field.getByTestId('time-input')).toBeVisible();

    /*
     * Only the time is typed. The date half is a PrimeReact calendar whose input is
     * `inputmode="none"` and ignores typed text, and DateTimePicker.handleTimeChange seeds the
     * date from `new Date()` when the field is still empty, so entering a time alone sets today.
     */
    await field.getByTestId('time-input').fill(FIELD_TIME);
    await expect(field.getByTestId('date-input')).toHaveValue(formatAsDateInput(new Date()));

    const toolbar = page.getByTestId('authoring').getByTestId('authoring-toolbar-1');

    const [saveResponse] = await Promise.all([
        page.waitForResponse(
            (response) => response.url().includes('/api/archive/')
                && ['PATCH', 'PUT'].includes(response.request().method()),
        ),
        toolbar.getByRole('button', {name: 'Save'}).click(),
    ]);

    expect(saveResponse.status()).toBeLessThan(400);

    /*
     * The field is stored as a UTC instant. Compare the parsed value in local time, and only down
     * to the minute: handleTimeChange sets hours and minutes on `new Date()` and leaves the
     * seconds it started with.
     */
    const saved = new Date((await saveResponse.json()).extra[FIELD_ID]);

    expect(formatAsDateInput(saved)).toEqual(formatAsDateInput(new Date()));
    expect(`${saved.getHours()}:${String(saved.getMinutes()).padStart(2, '0')}`).toEqual(FIELD_TIME);
});
