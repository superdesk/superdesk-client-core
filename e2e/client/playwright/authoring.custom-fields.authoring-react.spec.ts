import {test, expect, Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {ICustomFieldValues, MetadataSettings} from './page-object-models/settings/metadata';
import {restoreDatabaseSnapshot} from './utils';
import {patchArchiveItem} from './utils/archive-api';
import {getStorageState} from './utils/storage-state';
import {createArticleFromTemplate} from './scenarios/authoring-react-article';

/**
 * The "Add new custom ... field" QA cases on authoring-react: the field is created under
 * Settings > Metadata and added to the Story profile, then a new article shows it, takes a value,
 * saves it and shows it again after a reopen. authoring-react addresses a field by its vocabulary id.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});
test.describe.configure({timeout: 90000});

const SLUGLINE = 'custom field story';

// ids baked into the `association-fields` snapshot
const TEST_SPORTS_STORY_ID =
    'urn:newsml:localhost:5000:2023-11-15T10:53:56.032654:3503f3f4-1d5f-48b2-8f3d-35120820d8ee';
const BREE_BULLETIN_ID = 'urn:newsml:localhost:5000:2026-08-10T00:00:01.000000:association-fields-1';

async function createFieldInStoryProfile(
    page: Page,
    tab: string,
    field: ICustomFieldValues & {id: string; name: string},
    profileTab: 'Header' | 'Content',
    fieldTypeInPicker?: string,
    configureDialog?: (metadata: MetadataSettings) => Promise<void>,
): Promise<void> {
    const metadata = new MetadataSettings(page);

    await metadata.openTab(tab);
    await metadata.createCustomField(field, configureDialog == null ? undefined : () => configureDialog(metadata));

    await page.goto('/#/settings/content-profiles');
    await new ContentProfileSettings(page).addFieldsToContentProfileAndWait('Story', [
        {tabName: profileTab, fieldId: field.name, fieldType: fieldTypeInPicker},
    ]);
}

async function createStory(page: Page): Promise<AuthoringReact> {
    return (await createArticleFromTemplate(page, 'story')).authoring;
}

async function reopenStory(page: Page, authoring: AuthoringReact): Promise<void> {
    await authoring.closeExpectingNoPrompt();
    await new Monitoring(page)
        .getGroupLocator('Sports / Working Stage')
        .getByTestId('article-item')
        .filter({hasText: SLUGLINE})
        .dblclick();
    await authoring.waitUntilOpen();
}

test('a new custom text field takes a value that survives save and reopen', {
    annotation: [
        {type: 'confluence', description: '1311835044 complete'}, // Add new custom text field
        {type: 'confluence', description: '1344443809 complete'}, // Custom text
        {type: 'confluence', description: '1311834985 complete'}, // Edit content profile content fields
        // Create New Article utilizing new CP-template with custom fields added
        {type: 'confluence', description: '1344443857 complete'},
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createFieldInStoryProfile(
        page,
        'Custom text fields',
        {id: 'custom-text-field-2', name: 'custom text field 2'},
        'Content',
        'text',
    );

    const authoring = await createStory(page);
    const field = authoring.input('custom-text-field-2');

    await expect(authoring.fieldContainer('custom-text-field-2').getByTestId('authoring-field-label'))
        .toHaveText(/custom text field 2/i);

    await authoring.input('slugline').fill(SLUGLINE);
    await field.fill('custom text value');

    // the request, not the response: the server rebuilds `extra` text fields from `fields_meta`
    const {request} = await authoring.saveAndGetRequest();

    expect(request.extra['custom-text-field-2']).toContain('custom text value');

    await reopenStory(page, authoring);
    await expect(field).toHaveText('custom text value');
});

test('a new custom date field takes a date that survives save and reopen', {
    annotation: [
        {type: 'confluence', description: '1311835054 complete'}, // Add new custom date field
        {type: 'confluence', description: '1344443799 complete'}, // Custom date
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createFieldInStoryProfile(
        page,
        'Custom date fields',
        {id: 'custom-date-field-2', name: 'custom date field 2'},
        'Content',
        'date',
    );

    const authoring = await createStory(page);
    const input = authoring.fieldContainer('custom-date-field-2').getByRole('textbox');

    await authoring.input('slugline').fill(SLUGLINE);

    // select-all first: the empty field shows a date already, see the test below
    await input.click();
    await page.keyboard.press('ControlOrMeta+a');
    await input.pressSequentially('24/12/2030');
    await input.press('Tab');

    const saved = await authoring.saveAndGetItem();

    expect(saved.extra['custom-date-field-2']).toBe('2030-12-24T00:00:00+0000');

    await reopenStory(page, authoring);
    await expect(input).toHaveValue('24/12/2030');
});

test('a new custom date field starts empty on a new article', {
    annotation: [
        {type: 'confluence', description: '1344443799 partial'}, // Custom date
    ],
}, async ({page}) => {
    // React gap: the empty field shows 01/01/1970, DatePickerISO turns a null value into new Date(null)
    test.fixme();

    await restoreDatabaseSnapshot();
    await createFieldInStoryProfile(
        page,
        'Custom date fields',
        {id: 'custom-date-field-2', name: 'custom date field 2'},
        'Content',
        'date',
    );

    const authoring = await createStory(page);
    const input = authoring.fieldContainer('custom-date-field-2').getByRole('textbox');

    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
});

test('a new custom embed field takes an embed code that survives save and reopen', {
    annotation: [
        {type: 'confluence', description: '1311835062 complete'}, // Add new custom embed field
        {type: 'confluence', description: '1344443803 complete'}, // Custom embed
    ],
}, async ({page}) => {
    const EMBED = '<iframe src="https://example.com/video"></iframe>';

    await restoreDatabaseSnapshot();
    await createFieldInStoryProfile(
        page,
        'Custom embed fields',
        {id: 'custom-embed-field-2', name: 'custom embed field 2'},
        'Content',
        'embed',
    );

    const authoring = await createStory(page);
    const field = authoring.fieldContainer('custom-embed-field-2');

    await authoring.input('slugline').fill(SLUGLINE);
    await field.getByTestId('embed-code').fill(EMBED);
    await field.getByTestId('embed-description').fill('Example video');

    const saved = await authoring.saveAndGetItem();

    expect(saved.extra['custom-embed-field-2']).toEqual({embed: EMBED, description: 'Example video'});

    await reopenStory(page, authoring);
    await expect(field.getByTestId('embed-code')).toHaveValue(EMBED);
    await expect(field.getByTestId('embed-description')).toHaveValue('Example video');
});

test('a new media gallery field takes a dropped picture that survives save and reopen', {
    annotation: [
        {type: 'confluence', description: '1311835070 complete'}, // Add new related content field
        {type: 'confluence', description: '1344443807 complete'}, // Custom related content (media gall)
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'association-fields'});
    await createFieldInStoryProfile(
        page,
        'related content',
        {id: 'related-content-field-2', name: 'related content field 2'},
        'Content',
        'related content',
        async (metadata) => {
            await metadata.getDialog().getByLabel('content type').selectOption('Media gallery');
            await metadata.setAllowedContentTypes(['Image']);
        },
    );

    const authoring = await createStory(page);
    const field = authoring.fieldContainer('related-content-field-2');

    await authoring.input('slugline').fill(SLUGLINE);
    await new Monitoring(page).getArticleLocator('Gondor picture')
        .dragTo(field.getByTestId('drop-zone-placeholder'));

    const saved = await authoring.saveAndGetItem();
    const associated = Object.entries(saved.associations ?? {})
        .filter(([key, value]) => key.startsWith('related-content-field-2') && value != null)
        .map(([, value]: [string, any]) => value.headline ?? value.slugline);

    expect(associated).toEqual(['Gondor picture']);

    await reopenStory(page, authoring);
    await expect(field.getByRole('img')).toHaveCount(1);
});

test('a new related items field takes a dropped article that survives save and reopen', {
    annotation: [
        {type: 'confluence', description: '1344443805 complete'}, // Custom related content
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'association-fields'});
    await createFieldInStoryProfile(
        page,
        'related content',
        {id: 'related-items-field-2', name: 'related items field 2'},
        'Content',
        'related content',
        async (metadata) => {
            await metadata.getDialog().getByLabel('content type').selectOption('Related items');

            // unlike the media types, the angular Text checkbox carries no aria-label to find it by
            await metadata.getDialog().getByText('Text', {exact: true}).click();
        },
    );

    const authoring = await createStory(page);
    const field = authoring.fieldContainer('related-items-field-2');

    await authoring.input('slugline').fill(SLUGLINE);
    await new Monitoring(page).getArticleLocator('Bree bulletin')
        .dragTo(field.getByTestId('drop-zone-placeholder'));
    await expect(field).toContainText('Bree bulletin');

    const saved = await authoring.saveAndGetItem();
    const associatedIds = Object.entries(saved.associations ?? {})
        .filter(([key, value]) => key.startsWith('related-items-field-2') && value != null)
        .map(([, value]: [string, any]) => value._id);

    expect(associatedIds).toHaveLength(1);

    await reopenStory(page, authoring);
    await expect(field).toContainText('Bree bulletin');
});

test('a related items field lists its items when one of them no longer exists', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'association-fields'});
    await patchArchiveItem(TEST_SPORTS_STORY_ID, {
        associations: {
            'shire_related_items--1': {_id: BREE_BULLETIN_ID, type: 'text', order: 0},
            'shire_related_items--2': {_id: 'urn:newsml:localhost:5000:deleted-related-item', type: 'text', order: 1},
        },
    });

    const authoring = new AuthoringReact(page);

    await page.goto('/#/workspace/monitoring');
    await new Monitoring(page).selectDeskOrWorkspace('Sports');
    await new Monitoring(page).getArticleLocator('test sports story').dblclick();
    await authoring.waitUntilOpen();

    const field = authoring.fieldContainer('shire_related_items');

    await expect(field.getByTestId('field--slugline')).toHaveCount(1);
    await expect(field).toContainText('Bree bulletin');
});

test('a new custom URL field takes a link that survives save and reopen', {
    annotation: [
        {type: 'confluence', description: '1311835079 complete'}, // Add new URL field
        {type: 'confluence', description: '1344443811 complete'}, // Custom URL
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await createFieldInStoryProfile(
        page,
        'URLs',
        {id: 'custom-url-field-2', name: 'custom url field 2'},
        'Content',
        'custom vocabulary',
    );

    const authoring = await createStory(page);
    const field = authoring.fieldContainer('custom-url-field-2');

    await authoring.input('slugline').fill(SLUGLINE);
    await field.getByRole('button', {name: 'Add url'}).click();
    await field.getByTestId('url-item').getByTestId('url').fill('http://example.com');
    await field.getByTestId('url-item').getByTestId('url-description').fill('Example');

    const saved = await authoring.saveAndGetItem();

    expect(saved.extra['custom-url-field-2']).toEqual([{url: 'http://example.com', description: 'Example'}]);

    await reopenStory(page, authoring);
    await expect(field.getByTestId('url-item').getByTestId('url')).toHaveValue('http://example.com');
});

test('a new vocabulary field in the header takes a value that survives save and reopen', {
    annotation: [
        {type: 'confluence', description: '1311835040 partial'}, // Add new vocabulary
        {type: 'confluence', description: '10815143953 partial'}, // Vocabularies
    ],
}, async ({page}) => {
    // React gap: the Subject adapter rewrites `subject` from subject codes only and drops this field's value
    test.fixme();

    await restoreDatabaseSnapshot();

    const metadata = new MetadataSettings(page);
    const dialog = metadata.getDialog();

    await metadata.openTab('vocabularies');
    await metadata.openCreateDialog();
    await dialog.getByLabel('ID', {exact: true}).fill('custom-vocabulary-2');
    await dialog.getByLabel('name').fill('custom vocabulary 2');
    await dialog.getByTestId('vocabulary-tabs').getByRole('button', {name: 'Items'}).click();
    await dialog.getByTestId('vocabulary-modal-content').getByRole('button', {name: 'add item'}).click();

    const itemInput = (name: string) => dialog.getByTestId('vocabulary-modal-content')
        .getByTestId('vocabulary-item-field').and(page.locator(`[data-test-value="${name}"]`));

    await itemInput('name').fill('item 1');
    await itemInput('qcode').fill('item-1');
    await metadata.save();
    await expect(metadata.getListItem('custom vocabulary 2')).toBeVisible();

    await page.goto('/#/settings/content-profiles');
    await new ContentProfileSettings(page).addFieldsToContentProfileAndWait('Story', [
        {tabName: 'Header', fieldId: 'custom vocabulary 2'},
    ]);

    const authoring = await createStory(page);
    const field = authoring.fieldContainer('custom-vocabulary-2');

    await authoring.input('slugline').fill(SLUGLINE);
    await field.getByTestId('open-popover').click();
    await page.getByTestId('tree-select-popover').getByRole('treeitem', {name: 'item 1'}).click();
    await expect(field).toContainText('item 1');

    const saved = await authoring.saveAndGetItem();

    expect(saved.subject.filter(({scheme}: {scheme: string}) => scheme === 'custom-vocabulary-2'))
        .toEqual([expect.objectContaining({qcode: 'item-1', name: 'item 1'})]);

    await reopenStory(page, authoring);
    await expect(field).toContainText('item 1');
});
