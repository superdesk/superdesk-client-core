import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {IDatetimeFieldConfig, MetadataSettings} from './page-object-models/settings/metadata';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';

/*
 * Lifecycle of a custom datetime field under Settings -> Metadata -> Other fields, then used on an article.
 *
 * The type is "Datetime" (`datetime`) from the datetimeField extension that e2e/client/index.js loads.
 * The article test sets the `auth-react` localStorage flag with `addInitScript` so the field renders
 * in authoring-react, which addresses it by id; angular renders it too, without a test id. Not
 * `getStorageState`, which rebuilds state keyed to localhost:9000 and leaves the session missing on
 * slots using another port.
 *
 * Deviations from the QA cases (the product is asserted):
 * - "Close button" is the footer's Cancel. The delete dialogs were redesigned (VocabularyDeletionModal.tsx).
 * - Label is single-select, per-item Edit/Remove icons are always visible, and a field can sit in only
 *   one profile section at a time (`existsInFields` in ContentProfileFieldsConfig.tsx).
 * - On a new article the field starts empty with its switch off, unless the template carries a value.
 *   Switching it on fills in the current time plus the initial offset.
 */

const FIELD_ID = 'New_other_datetime_Item_1';
const FIELD_NAME = 'New other datetime Item 1';
const FIELD_TYPE_LABEL = 'Datetime';
const FIELD_TYPE_ID = 'datetime';

const FIELD_PICKER_OPTION = `${FIELD_NAME} (custom vocabulary)`;

const STOCK_HEADER_FIELD_OPTIONS = ['Company Codes', 'Keywords', 'Language', 'Take Key'];

const NEW_FIELD_VALUES = {
    id: FIELD_ID,
    name: FIELD_NAME,
    fieldTypeLabel: FIELD_TYPE_LABEL,
    description: 'Datetime the item refers to',
    helperText: 'Pick a date and a time',
};

const NEW_FIELD_CONFIG: IDatetimeFieldConfig = {
    initialOffsetMinutes: 5,
    incrementSteps: [15],
};

const ARTICLE_SLUGLINE = 'datetime offset story';

function parseDateAndTimeInputs(date: string, time: string): number {
    const [day, month, year] = date.split('/').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes).getTime();
}

test.describe.configure({timeout: 120000});

async function createDatetimeField(page: Page): Promise<void> {
    const metadata = new MetadataSettings(page);

    await metadata.openTab('Other fields');
    await metadata.createCustomField(NEW_FIELD_VALUES, () => metadata.fillDatetimeConfig(NEW_FIELD_CONFIG));
}

test('the create dialog only saves a custom datetime field from its Save button', {
    annotation: [
        {type: 'confluence', description: '1335328976 complete'}, // Add new custom datetime field
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
        dialog.getByLabel('Field type').locator('option').filter({hasText: new RegExp(`^${FIELD_TYPE_LABEL}$`)}),
    ).toHaveCount(1);

    await expect(metadata.getSaveButton()).toBeDisabled();

    await metadata.fillDialog(NEW_FIELD_VALUES);
    await expect(metadata.getSaveButton()).toBeEnabled();

    await expect(metadata.getInitialTimeOffsetInput()).toHaveValue('0');
    await expect(metadata.getIncrementStepRemoveButtons()).toHaveCount(0);

    await metadata.getAddStepButton().click();
    await expect(metadata.getIncrementStepRemoveButtons()).toHaveCount(1);
    await expect(metadata.getIncrementStepInput(0)).toHaveValue('0');

    await metadata.getIncrementStepInput(0).fill('30');
    await expect(metadata.getIncrementStepInput(0)).toHaveValue('30');

    await metadata.getIncrementStepRemoveButtons().first().click();
    await expect(metadata.getIncrementStepRemoveButtons()).toHaveCount(0);

    // Spaces are rejected by the id pattern `^[a-zA-Z0-9-_]+$` on the ID input.
    await metadata.fillDialog({id: 'New other datetime Item 1'});
    await expect(metadata.getSaveButton()).toBeDisabled();

    await metadata.fillDialog({id: FIELD_ID, name: ''});
    await expect(metadata.getSaveButton()).toBeDisabled();

    await metadata.fillDialog({name: FIELD_NAME});
    await expect(metadata.getSaveButton()).toBeEnabled();

    await metadata.fillDatetimeConfig(NEW_FIELD_CONFIG);
    await metadata.cancel();
    await expect(metadata.getAddNewButton()).toBeVisible();
    await expect(metadata.getListItem(FIELD_NAME)).toHaveCount(0);

    await metadata.openCreateDialog();
    await metadata.fillDialog(NEW_FIELD_VALUES);
    await metadata.fillDatetimeConfig(NEW_FIELD_CONFIG);
    await metadata.closeWithIcon();
    await expect(metadata.getAddNewButton()).toBeVisible();
    await expect(metadata.getListItem(FIELD_NAME)).toHaveCount(0);

    await metadata.openCreateDialog();
    await metadata.fillDialog(NEW_FIELD_VALUES);
    await metadata.fillDatetimeConfig(NEW_FIELD_CONFIG);
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
    expect(await metadata.readDatetimeConfig()).toEqual(NEW_FIELD_CONFIG);
});

test('a saved custom datetime field is available to both content profile sections', {
    annotation: [
        {type: 'confluence', description: '1335328976 complete'}, // Add new custom datetime field
        {type: 'confluence', description: '1335328978 complete'}, // Edit custom datetime field
        {type: 'confluence', description: '1344443801 complete'}, // Custom (other) Datetime
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
        {type: 'confluence', description: '1335328978 complete'}, // Edit custom datetime field
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

    const dialog = metadata.getDialog();

    await expect(dialog.getByRole('heading', {name: `Edit ${FIELD_NAME}`, exact: true})).toBeVisible();
    await expect(page.getByTestId('vocabulary-edit--id')).toHaveJSProperty('readOnly', true);
    await expect(page.getByTestId('vocabulary-edit-field--name')).toBeVisible();
    await expect(dialog.getByLabel('Field type')).toBeVisible();
    await expect(dialog.getByLabel('Description')).toBeVisible();
    await expect(
        dialog.getByRole('textbox', {name: 'Type to search or create a new label'}),
    ).toBeVisible();
    await expect(dialog.getByLabel('Helper text')).toBeVisible();
    await expect(metadata.getInitialTimeOffsetInput()).toBeVisible();
    await expect(metadata.getIncrementStepRemoveButtons()).toHaveCount(1);
    await expect(metadata.getAddStepButton()).toBeVisible();
    await expect(dialog.getByTestId('vocabulary-edit-modal--cancel')).toBeVisible();
    await expect(dialog.getByTestId('vocabulary-edit-modal--close')).toBeVisible();
    await expect(metadata.getSaveButton()).toBeDisabled();

    await metadata.getInitialTimeOffsetInput().fill('10');
    await expect(metadata.getSaveButton()).toBeEnabled();

    await metadata.getAddStepButton().click();
    await expect(metadata.getIncrementStepInput(1)).toHaveValue('0');
    await metadata.getIncrementStepInput(1).fill('45');
    await metadata.getIncrementStepRemoveButtons().first().click();
    await metadata.fillDialog({description: 'discarded by Cancel'});
    await metadata.cancel();

    await metadata.openEditDialog(FIELD_NAME);
    expect((await metadata.readDialogValues()).description).toEqual(NEW_FIELD_VALUES.description);
    expect(await metadata.readDatetimeConfig()).toEqual(NEW_FIELD_CONFIG);

    await metadata.fillDatetimeConfig({initialOffsetMinutes: 10, incrementSteps: [20, 45]});
    await metadata.fillDialog({description: 'discarded by the close icon'});
    await metadata.closeWithIcon();

    await metadata.openEditDialog(FIELD_NAME);
    expect((await metadata.readDialogValues()).description).toEqual(NEW_FIELD_VALUES.description);
    expect(await metadata.readDatetimeConfig()).toEqual(NEW_FIELD_CONFIG);

    await metadata.fillDialog({name: 'Renamed datetime field', helperText: 'Pick a moment'});
    await metadata.fillDatetimeConfig({initialOffsetMinutes: 10, incrementSteps: [20, 45]});
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
    expect(await metadata.readDatetimeConfig()).toEqual({initialOffsetMinutes: 10, incrementSteps: [20, 45]});
});

test('an unused custom datetime field is removed only after confirming', {
    annotation: [
        {type: 'confluence', description: '1335328980 complete'}, // Remove custom datetime field
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
        {type: 'confluence', description: '1335328980 complete'}, // Remove custom datetime field
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

test('a new article fills the custom datetime field with the current time plus the initial offset', {
    annotation: [
        {type: 'confluence', description: '1344443801 complete'}, // Custom (other) Datetime
    ],
}, async ({page}) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('auth-react', 'true');
    });

    await restoreDatabaseSnapshot();
    await createDatetimeField(page);

    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.addFieldsToContentProfileAndWait('Story', [
        {tabName: 'Header', fieldId: FIELD_NAME, fieldType: 'custom vocabulary'},
    ]);

    // New articles use the boot-time dataStore profile, so reload to pick up the added field.
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');
    await page.reload();
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');

    const field = authoring.fieldContainer(FIELD_ID);
    const fieldSwitch = field.getByRole('checkbox');
    const dateInput = field.getByRole('textbox', {name: 'Date'});
    // TimePicker labels its input with an empty label, so it has no accessible name.
    const timeInput = field.locator('input[type="time"]');

    await expect(fieldSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(dateInput).toHaveCount(0);

    const beforeSwitchingOn = Date.now();

    await fieldSwitch.click();

    const afterSwitchingOn = Date.now();

    await expect(fieldSwitch).toHaveAttribute('aria-checked', 'true');

    const shownDate = await dateInput.inputValue();
    const shownTime = await timeInput.inputValue();
    const shown = parseDateAndTimeInputs(shownDate, shownTime);
    const offsetMs = NEW_FIELD_CONFIG.initialOffsetMinutes * 60000;

    // The field drops the seconds, so it can read up to a minute behind the moment it was switched on.
    expect(shown).toBeGreaterThan(beforeSwitchingOn + offsetMs - 60000);
    expect(shown).toBeLessThanOrEqual(afterSwitchingOn + offsetMs);

    await authoring.waitForAuthoringReactToInitialize();
    await authoring.fieldContainer('slugline').getByRole('textbox').fill(ARTICLE_SLUGLINE);

    const toolbar = page.getByTestId('authoring').getByTestId('authoring-toolbar-1');

    const [saveResponse] = await Promise.all([
        page.waitForResponse(
            (response) => response.url().includes('/api/archive/')
                && ['PATCH', 'PUT'].includes(response.request().method()),
        ),
        toolbar.getByRole('button', {name: 'Save', exact: true}).click(),
    ]);

    expect(saveResponse.status()).toBeLessThan(400);

    await page.getByTestId('authoring').getByRole('button', {name: 'Close', exact: true}).click();
    await expect(page.getByTestId('authoring')).toHaveCount(0);

    await monitoring
        .getGroupLocator('Sports / Working Stage')
        .getByTestId('article-item')
        .filter({hasText: ARTICLE_SLUGLINE})
        .dblclick();

    await expect(fieldSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(dateInput).toHaveValue(shownDate);
    await expect(timeInput).toHaveValue(shownTime);
});
