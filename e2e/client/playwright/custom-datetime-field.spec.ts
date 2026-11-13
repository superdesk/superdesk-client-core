import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {MetadataSettings} from './page-object-models/settings/metadata';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {Monitoring} from './page-object-models/monitoring';

/*
 * Lifecycle of a custom datetime field under Settings -> Metadata -> Other fields, then used on an article.
 *
 * Every test sets the `auth-react` localStorage flag with `addInitScript`: without it no field types
 * are registered and the create dialog's "Field type" select is empty. Not `getStorageState`, which
 * rebuilds state keyed to localhost:9000 and leaves the session missing on slots using another port.
 *
 * Deviations from the QA cases (the product is asserted):
 * - The type is labelled "Datetime (authoring-react)" (`datetime-v2`), not "Datetime".
 * - "Close button" is the footer's Cancel. The delete dialogs were redesigned (VocabularyDeletionModal.tsx).
 * - Label is single-select, per-item Edit/Remove icons are always visible, and a field can sit in only
 *   one profile section at a time (`existsInFields` in ContentProfileFieldsConfig.tsx).
 *
 * Not covered: 1335328976, 1335328978 and 1344443801 (initial time offset, time increment steps): that
 * config lives in the `datetime` type, which the e2e app never registers, and `datetime-v2` has
 * `configComponent: null`. 1344443801 step 5 (re-open to re-read the value) asserts the save response
 * instead, since a reload does not restore the editor. Date entry is not typed: the calendar input is
 * popup-only, so the test sets the time and asserts the derived date.
 */

const FIELD_ID = 'New_other_datetime_Item_1';
const FIELD_NAME = 'New other datetime Item 1';
const FIELD_TYPE_LABEL = 'Datetime (authoring-react)';
const FIELD_TYPE_ID = 'datetime-v2';

const FIELD_PICKER_OPTION = `${FIELD_NAME} (custom vocabulary)`;

const FIELD_TIME = '14:30';

const STOCK_HEADER_FIELD_OPTIONS = ['Company Codes', 'Keywords', 'Language', 'Take Key'];

const NEW_FIELD_VALUES = {
    id: FIELD_ID,
    name: FIELD_NAME,
    fieldTypeLabel: FIELD_TYPE_LABEL,
    description: 'Datetime the item refers to',
    helperText: 'Pick a date and a time',
};

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

    // Check both sections while the field is unconfigured. Reload between them: an open picker swallows tab clicks.
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

    // Gate on the full stock set so absence is checked against a rendered list.
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

    // The deletion modal reads `sdApi.contentProfiles.getAll()` (dataStore seeded at boot), so reload to see
    // the new profile. Reload on the destination route: reload-then-hash-navigate leaves settings half built.
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

    // New articles use the boot-time dataStore profile, so reload to pick up the added field.
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

    // The date input is `inputmode="none"`; DateTimePicker.handleTimeChange seeds today when empty.
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

    // Stored as a UTC instant. Compare in local time to the minute: seconds come from `new Date()`.
    const saved = new Date((await saveResponse.json()).extra[FIELD_ID]);

    expect(formatAsDateInput(saved)).toEqual(formatAsDateInput(new Date()));
    expect(`${saved.getHours()}:${String(saved.getMinutes()).padStart(2, '0')}`).toEqual(FIELD_TIME);
});
