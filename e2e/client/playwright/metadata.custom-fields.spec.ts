import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot} from './utils';
import {MetadataSettings} from './page-object-models/settings/metadata';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';

/*
 * Removing a custom field of every type Settings -> Metadata offers a tab for, and editing a
 * custom URL field. Creating those fields is covered by authoring.custom-fields.spec.ts.
 *
 * Where the cases and the product disagree, the product is asserted:
 * - The delete confirmation the cases describe ("Confirm" / "Please confirm you want to delete
 *   the vocabulary." / Cancel + OK) has been redesigned: the dialog is headed "Delete
 *   vocabulary?" and its buttons are Cancel and Delete (VocabularyDeletionModal.tsx).
 * - The in-use message the cases quote ("The vocabulary is used in the following content types:")
 *   is now a separate "Cannot delete vocabulary" dialog that lists the content profiles.
 * - 1311835081 calls Label a multiselect; the control takes a single label (`data-max-items="1"`
 *   in vocabulary-config-modal.html) and its own hint says so.
 * - 1311835081's "Close button" is the footer's "Cancel"; the close icon sits in the dialog
 *   header. Its expected results are also copied from the related content case ("Edit dialog for
 *   a custom related content field"); the controls asserted here are the ones the URL dialog
 *   renders.
 *
 * Expected results left uncovered:
 * - The two content profile consequences every removal case documents ("cannot be used in Content
 *   profiles configuration anymore", and the refusal to delete a field a profile uses) are
 *   asserted once, on a custom text field. Neither VocabularyConfigController.remove nor
 *   VocabularyDeletionModal branches on the field type, and the content profile field picker
 *   lists fields by vocabulary id, so both are the same code path for every type on this page.
 * - That first consequence is asserted on the Header section of the field picker only. Both
 *   sections offer the field ids of the content type response, and after a deletion the client
 *   can still be served a copy of that response carrying the deleted id, even across a reload - a
 *   direct API read no longer returns it, but deleting a vocabulary does not change the content
 *   type document itself. The field then stays on offer in the Content section, with its type
 *   label gone. Header options are filtered further, through the vocabulary list
 *   (`getAllCustomVocabulariesForArticleHeader` in apps/authoring/metadata/metadata.ts), which a
 *   fresh page rebuilds from the API.
 * - 1311835081's "ID text field (required) ... spaces are not allowed". The ID input is read-only
 *   once the field exists (`ng-readonly="!!vocabulary._links"`), so the Edit dialog cannot
 *   exercise it.
 */

interface ICustomFieldType {
    /** Confluence case id of the "Remove ..." case for this type. */
    caseId: string;
    tabName: string;
    /** Reads inside the test title, after "a custom" and before "field". */
    label: string;
    id: string;
    name: string;
    /** How the content profile field picker labels the type, where a test needs it. */
    pickerTypeLabel?: string;
    /** Input the type needs in the create dialog on top of an id and a name. */
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

/** How the content profile field picker labels the URL field: display name plus its type. */
const URL_FIELD_PICKER_OPTION = `${URL_FIELD_NAME} (custom vocabulary)`;

/** What the field picker offers in the Story profile's Header section, minus any custom field. */
const STOCK_HEADER_FIELD_OPTIONS = ['Company Codes', 'Keywords', 'Language', 'Take Key'];

/** Every removal case documents the same content profile consequences. */
const REMOVAL_CASE_ANNOTATIONS = REMOVABLE_FIELD_TYPES.map((fieldType) => ({
    type: 'confluence',
    description: `${fieldType.caseId} partial`,
}));

test.describe.configure({timeout: 120000});

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
        await item.hover();
        await expect(item.getByTestId('vocabulary-item--start-editing')).toBeVisible();
        await expect(item.getByTestId('vocabulary-item--start-removing')).toBeVisible();

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

    // Both option sets are asserted whole: the field must go missing from a loaded list, not
    // from a list that has not rendered yet.
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

    /*
     * The reload is load-bearing. What the Header section offers is filtered through the
     * vocabulary list `getAllActiveVocabularies` (VocabularyService.ts) caches for the lifetime of
     * the page, and a deletion refreshes only the separate list the metadata page renders, so
     * without a fresh page the picker keeps offering the deleted field.
     */
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

    /*
     * The deletion modal decides which variant to show from `sdApi.contentProfiles.getAll()`,
     * which reads the in-memory dataStore, refreshed only by websocket resource messages. Reload
     * so it is guaranteed to see the profile that now uses the field. The reload has to happen on
     * the destination route: reloading first and navigating by hash straight after leaves the
     * settings view half built.
     */
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
    await item.hover();
    await expect(item.getByTestId('vocabulary-item--start-editing')).toBeVisible();
    await expect(item.getByTestId('vocabulary-item--start-removing')).toBeVisible();

    await metadata.openEditDialog(URL_FIELD_NAME);

    const dialog = metadata.getDialog();

    await expect(dialog.getByRole('heading', {name: `Edit ${URL_FIELD_NAME}`, exact: true})).toBeVisible();
    await expect(page.getByTestId('vocabulary-edit--id')).toHaveJSProperty('readOnly', true);
    await expect(page.getByTestId('vocabulary-edit-field--name')).toBeVisible();
    await expect(dialog.getByLabel('Description')).toBeVisible();
    await expect(dialog.getByRole('textbox', {name: 'Type to search or create a new label'})).toBeVisible();
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
    await metadata.save();

    await expect(metadata.getListItem('Renamed URL field')).toBeVisible();
    await metadata.openEditDialog('Renamed URL field');
    expect(await metadata.readSharedDialogValues()).toEqual({
        id: URL_FIELD_ID,
        name: 'Renamed URL field',
        description: URL_FIELD_VALUES.description,
        helperText: 'Paste a shortened URL',
    });
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

    // Gate on the full stock option set: the URL field must be absent from a loaded list, not
    // from a list that has not rendered yet.
    await expect(headerPicker.getByRole('treeitem')).toHaveText(STOCK_HEADER_FIELD_OPTIONS);

    /*
     * The editor is reopened from a fresh load rather than switching tabs in place, because the
     * open field picker swallows clicks on the section tabs.
     */
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
