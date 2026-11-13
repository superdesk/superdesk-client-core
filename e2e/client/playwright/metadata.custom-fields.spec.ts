import {test, expect, Locator, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {MetadataSettings} from './page-object-models/settings/metadata';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';

/*
 * Removal of a custom field of every type Settings -> Metadata has a tab for, and editing a custom
 * URL field. Creating the fields is covered by authoring.custom-fields.spec.ts.
 *
 * Deviations from the QA cases (the product is asserted):
 * - The delete dialog is now "Delete vocabulary?" with Cancel/Delete, and the in-use message is a
 *   separate "Cannot delete vocabulary" dialog listing the content profiles.
 * - 1311835081: Label takes a single value, not a multiselect; its "Close button" is the footer
 *   Cancel (the header icon is asserted too); its expected results come from the related content case.
 * - Not covered: the content profile consequences of a removal are asserted once, on a text field
 *   (same code path for every type), and only in the Header section picker, because the Content
 *   section can keep offering a deleted id from a cached content type response. The "ID ... spaces
 *   are not allowed" check is impossible: the ID input is read-only once the field exists.
 */

interface ICustomFieldType {
    caseId: string;
    tabName: string;
    label: string;
    id: string;
    name: string;
    pickerTypeLabel?: string;
    configureDialog?: (metadata: MetadataSettings) => Promise<void>;
}

const TEXT_FIELD: ICustomFieldType = {
    caseId: '1311835048', // Remove custom text field (AUTOMATED)
    tabName: 'Custom text fields',
    label: 'text',
    id: 'removable_text_field',
    name: 'Removable text field',
    pickerTypeLabel: 'text',
};

const REMOVABLE_FIELD_TYPES: Array<ICustomFieldType> = [
    TEXT_FIELD,
    {
        caseId: '1311835058', // Remove custom date field (AUTOMATED)
        tabName: 'Custom date fields',
        label: 'date',
        id: 'removable_date_field',
        name: 'Removable date field',
    },
    {
        caseId: '1311835066', // Remove custom embed field (AUTOMATED)
        tabName: 'Custom embed fields',
        label: 'embed',
        id: 'removable_embed_field',
        name: 'Removable embed field',
    },
    {
        caseId: '1311835074', // Remove related content field (AUTOMATED)
        tabName: 'Related content',
        label: 'related content',
        id: 'removable_related_content_field',
        name: 'Removable related content field',
        configureDialog: (metadata) => metadata.setAllowedContentTypes(['Image']),
    },
    {
        caseId: '1311835083', // Remove URL field (AUTOMATED)
        tabName: 'URLs',
        label: 'URL',
        id: 'removable_url_field',
        name: 'Removable URL field',
    },
];

const URL_FIELD_ID = 'editable_url_field';
const URL_FIELD_NAME = 'Editable URL field';

const URL_FIELD_VALUES = {
    id: URL_FIELD_ID,
    name: URL_FIELD_NAME,
    description: 'Where the story was first published',
    helperText: 'Paste a full URL',
};

const URL_FIELD_LABEL = 'Web links';

const URL_FIELD_PICKER_OPTION = `${URL_FIELD_NAME} (custom vocabulary)`;

const STOCK_HEADER_FIELD_OPTIONS = ['Company Codes', 'Keywords', 'Language', 'Take Key'];

const REMOVAL_CASE_ANNOTATIONS = REMOVABLE_FIELD_TYPES.map((fieldType) => ({
    type: 'confluence',
    description: `${fieldType.caseId} partial`,
}));

test.describe.configure({timeout: 120000});

// The actions are always in the DOM; only the wrapping menu's opacity (class only, no test id)
// changes on hover, so `toBeVisible` alone would prove nothing.
async function expectActionsShownOnHover(page: Page, item: Locator): Promise<void> {
    const actions = item.locator('.sd-list-item__action-menu');

    await page.mouse.move(0, 0);
    await expect(actions).toHaveCSS('opacity', '0');

    await item.hover();
    await expect(actions).toHaveCSS('opacity', '1');
    await expect(item.getByTestId('vocabulary-item--start-editing')).toBeVisible();
    await expect(item.getByTestId('vocabulary-item--start-removing')).toBeVisible();
}

// ngTagsInput chips, reachable by class only.
function labelTags(dialog: Locator): Locator {
    return dialog.locator('tags-input .tags-input__tag-item');
}

async function createCustomField(page: Page, fieldType: ICustomFieldType): Promise<void> {
    const metadata = new MetadataSettings(page);

    await metadata.openTab(fieldType.tabName);
    await metadata.createCustomField(
        {id: fieldType.id, name: fieldType.name},
        async () => {
            await fieldType.configureDialog?.(metadata);
        },
    );
}

for (const fieldType of REMOVABLE_FIELD_TYPES) {
    test(`a custom ${fieldType.label} field is removed only after confirming`, {
        annotation: [
            {type: 'confluence', description: `${fieldType.caseId} partial`},
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await createCustomField(page, fieldType);

        const metadata = new MetadataSettings(page);
        const item = metadata.getListItem(fieldType.name);

        await expect(item).toBeVisible();
        await expectActionsShownOnHover(page, item);

        await metadata.openDeletionModal(fieldType.name);

        const confirmation = metadata.getDeletionModal();

        await expect(confirmation).toBeVisible();
        await expect(confirmation).toContainText('Delete vocabulary?');
        await expect(confirmation).toContainText(
            `You are about to delete the vocabulary ${fieldType.name}. This action can't be undone.`,
        );
        await expect(confirmation).toContainText(
            'This vocabulary is not currently used in any Content Profile and can be safely removed.',
        );

        await confirmation.getByRole('button', {name: 'Cancel'}).click();
        await expect(confirmation).toHaveCount(0);
        await expect(metadata.getListItem(fieldType.name)).toBeVisible();

        await metadata.openDeletionModal(fieldType.name);
        await metadata.confirmDeletion(fieldType.id);

        await expect(metadata.getAddNewButton()).toBeVisible();
        await expect(metadata.getListItem(fieldType.name)).toHaveCount(0);
    });
}

test('a removed custom field is no longer offered by the content profile header section', {
    annotation: REMOVAL_CASE_ANNOTATIONS,
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createCustomField(page, TEXT_FIELD);

    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.openEditor('Story');
    await contentProfileSettings.openSection('Header');

    const pickerBeforeRemoval = await contentProfileSettings.openFieldPicker();

    // Assert the whole list so a missing field cannot mean the list has not rendered yet.
    await expect(pickerBeforeRemoval.getByRole('treeitem')).toHaveText([
        'Company Codes',
        'Keywords',
        'Language',
        `${TEXT_FIELD.name} (${TEXT_FIELD.pickerTypeLabel})`,
        'Take Key',
    ]);

    const metadata = new MetadataSettings(page);

    await metadata.openTab(TEXT_FIELD.tabName);
    await metadata.openDeletionModal(TEXT_FIELD.name);
    await metadata.confirmDeletion(TEXT_FIELD.id);

    // The reload is required: the picker filters through `getAllActiveVocabularies`
    // (VocabularyService.ts), cached per page load and not refreshed by a deletion.
    await page.goto('/#/settings/content-profiles');
    await page.reload();
    await contentProfileSettings.openEditor('Story');
    await contentProfileSettings.openSection('Header');

    const pickerAfterRemoval = await contentProfileSettings.openFieldPicker();

    await expect(pickerAfterRemoval.getByRole('treeitem')).toHaveText(STOCK_HEADER_FIELD_OPTIONS);
});

test('a custom field used in a content profile cannot be removed', {
    annotation: REMOVAL_CASE_ANNOTATIONS,
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createCustomField(page, TEXT_FIELD);

    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.addFieldsToContentProfileAndWait('Story', [
        {tabName: 'Content', fieldId: TEXT_FIELD.name, fieldType: TEXT_FIELD.pickerTypeLabel},
    ]);

    // The deletion modal reads `sdApi.contentProfiles.getAll()` from the dataStore, refreshed only
    // by websocket messages, so reload. Reload on the destination route: navigating by hash right
    // after a reload leaves the settings view half built.
    await page.goto('/#/settings/vocabularies');
    await page.reload();

    const metadata = new MetadataSettings(page);

    await metadata.openTab(TEXT_FIELD.tabName);
    await metadata.openDeletionModal(TEXT_FIELD.name);

    const refusal = metadata.getDeletionRefusal();

    await expect(refusal).toBeVisible();
    await expect(refusal).toContainText('Cannot delete vocabulary');
    await expect(refusal).toContainText(
        `The vocabulary ${TEXT_FIELD.name} can't be deleted because it is currently used `
        + 'in the following Content Profile:',
    );
    await expect(refusal.getByRole('listitem')).toHaveText(['Story']);
    await expect(refusal).toContainText(
        'To delete this vocabulary, you must first remove it from all Content Profiles listed above.',
    );

    await refusal.getByRole('button', {name: 'Go back'}).click();
    await expect(refusal).toHaveCount(0);
    await expect(metadata.getListItem(TEXT_FIELD.name)).toBeVisible();
});

test('the edit dialog only persists changes to a custom URL field from its Save button', {
    annotation: [
        {type: 'confluence', description: '1311835081 partial'}, // Edit URL field (AUTOMATED)
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const metadata = new MetadataSettings(page);

    await metadata.openTab('URLs');
    await metadata.createCustomField(URL_FIELD_VALUES);

    const item = metadata.getListItem(URL_FIELD_NAME);

    await expect(item).toBeVisible();
    await expectActionsShownOnHover(page, item);

    await metadata.openEditDialog(URL_FIELD_NAME);

    const dialog = metadata.getDialog();

    await expect(dialog.getByRole('heading', {name: `Edit ${URL_FIELD_NAME}`, exact: true})).toBeVisible();
    await expect(page.getByTestId('vocabulary-edit--id')).toHaveJSProperty('readOnly', true);
    await expect(page.getByTestId('vocabulary-edit-field--name')).toBeVisible();
    await expect(dialog.getByLabel('Description')).toBeVisible();
    await expect(dialog.getByRole('textbox', {name: 'Type to search or create a new label'})).toBeVisible();
    await expect(labelTags(dialog)).toHaveCount(0);
    await expect(dialog.getByLabel('Helper text')).toBeVisible();
    await expect(dialog.getByTestId('vocabulary-edit-modal--cancel')).toBeVisible();
    await expect(dialog.getByTestId('vocabulary-edit-modal--close')).toBeVisible();

    await expect(metadata.getSaveButton()).toBeDisabled();

    await metadata.fillDialog({description: 'discarded by Cancel'});
    await expect(metadata.getSaveButton()).toBeEnabled();
    await metadata.cancel();

    await metadata.openEditDialog(URL_FIELD_NAME);
    expect((await metadata.readSharedDialogValues()).description).toEqual(URL_FIELD_VALUES.description);

    await metadata.fillDialog({description: 'discarded by the close icon'});
    await metadata.closeWithIcon();

    await metadata.openEditDialog(URL_FIELD_NAME);
    expect((await metadata.readSharedDialogValues()).description).toEqual(URL_FIELD_VALUES.description);

    await metadata.fillDialog({name: 'Renamed URL field', helperText: 'Paste a shortened URL'});

    const labelInput = dialog.getByRole('textbox', {name: 'Type to search or create a new label'});

    await labelInput.fill(URL_FIELD_LABEL);
    await labelInput.press('Enter');
    await expect(labelTags(dialog)).toHaveText([URL_FIELD_LABEL]);

    await metadata.save();

    await expect(metadata.getListItem('Renamed URL field')).toBeVisible();
    await metadata.openEditDialog('Renamed URL field');
    expect(await metadata.readSharedDialogValues()).toEqual({
        id: URL_FIELD_ID,
        name: 'Renamed URL field',
        description: URL_FIELD_VALUES.description,
        helperText: 'Paste a shortened URL',
    });
    await expect(labelTags(dialog)).toHaveText([URL_FIELD_LABEL]);
});

test('a saved custom URL field is offered to the content profile content section only', {
    annotation: [
        {type: 'confluence', description: '1311835081 partial'}, // Edit URL field (AUTOMATED)
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const metadata = new MetadataSettings(page);

    await metadata.openTab('URLs');
    await metadata.createCustomField(URL_FIELD_VALUES);

    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.openEditor('Story');
    await contentProfileSettings.openSection('Header');

    const headerPicker = await contentProfileSettings.openFieldPicker();

    // Assert the whole list so absence cannot mean the list has not rendered yet.
    await expect(headerPicker.getByRole('treeitem')).toHaveText(STOCK_HEADER_FIELD_OPTIONS);

    // Reload instead of switching tabs: the open field picker swallows clicks on the section tabs.
    await page.goto('/#/settings/content-profiles');
    await page.reload();
    await contentProfileSettings.openEditor('Story');
    await contentProfileSettings.openSection('Content');

    const contentPicker = await contentProfileSettings.openFieldPicker();

    await expect(contentPicker.getByRole('treeitem', {name: URL_FIELD_PICKER_OPTION, exact: true})).toBeVisible();

    await page.goto('/#/settings/content-profiles');
    await page.reload();
    await contentProfileSettings.addFieldsToContentProfileAndWait('Story', [
        {tabName: 'Content', fieldId: URL_FIELD_NAME, fieldType: 'custom vocabulary'},
    ]);

    await contentProfileSettings.openEditor('Story');
    await contentProfileSettings.openSection('Content');
    await expect(contentProfileSettings.getConfiguredField(URL_FIELD_NAME)).toBeVisible();
});
