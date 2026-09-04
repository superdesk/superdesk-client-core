import {test, expect, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {restoreDatabaseSnapshot, s} from './utils';

async function expectFieldToBeVisibleInAuthoring(page: Page, field: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await expect(page.locator(s('authoring', `authoring-field=${field}`))).toBeVisible();
}

async function addFieldsToContentProfile(
    page: Page,
    fields: Array<{tabName: string; fieldId: string, fieldType?: string}>,
): Promise<void> {
    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.addFieldsToContentProfile('Story', fields);
}

test('creating a custom text field', {
    annotation: [
        {type: 'confluence', description: '1311835044 partial'}, // Add new custom text field (AUTOMATED)
        {type: 'confluence', description: '1344443809 partial'}, // Custom text
        // Edit content profile content fields - PASS Mikayel 13.10
        {type: 'confluence', description: '1311834985 complete'},
        // Create New Article utilizing new CP-template with custom fields added - PASS - 20.10
        {type: 'confluence', description: '1344443857 complete'},
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'Custom text fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('custom-text-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom text field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom text field 2'))).toBeVisible();
    await addFieldsToContentProfile(page, [{tabName: 'Content', fieldId: 'custom text field 2', fieldType: 'text'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom text field 2');
});

test('creating a custom date field', {
    annotation: [
        {type: 'confluence', description: '1311835054 partial'}, // Add new custom date field (AUTOMATED)
        {type: 'confluence', description: '1344443799 partial'}, // Custom date
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'Custom date fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('custom-date-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom date field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom date field 2'))).toBeVisible();
    await addFieldsToContentProfile(page, [{tabName: 'Content', fieldId: 'custom date field 2', fieldType: 'date'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom date field 2');
});

test('creating a custom embed field', {
    annotation: [
        {type: 'confluence', description: '1311835062 partial'}, // Add new custom embed field (AUTOMATED)
        {type: 'confluence', description: '1344443803 partial'}, // Custom embed
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'Custom embed fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('custom-embed-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom embed field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom embed field 2'))).toBeVisible();
    await addFieldsToContentProfile(page, [{tabName: 'Content', fieldId: 'custom embed field 2', fieldType: 'embed'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom embed field 2');
});

test('creating a related content field', {
    annotation: [
        {type: 'confluence', description: '1311835070 partial'}, // Add new related content field (AUTOMATED)
        {type: 'confluence', description: '1344443805 partial'}, // Custom related content
        {type: 'confluence', description: '1344443807 partial'}, // Custom related content (media gall)
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'related content'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('related-content-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('related content field 2');
    await page.locator(s('vocabulary-modal')).getByLabel('content type').selectOption('Media gallery');
    await page.locator(s('vocabulary-modal')).getByLabel('image').click();
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=related content field 2'))).toBeVisible();
    await addFieldsToContentProfile(
        page,
        [{tabName: 'Content', fieldId: 'related content field 2', fieldType: 'related content'}],
    );
    await expectFieldToBeVisibleInAuthoring(page, 'related content field 2');
});

test('creating a custom URL field', {
    annotation: [
        {type: 'confluence', description: '1311835079 partial'}, // Add new URL field (AUTOMATED)
        {type: 'confluence', description: '1344443811 partial'}, // Custom URL
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'URLs'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('custom-url-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom url field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom url field 2'))).toBeVisible();
    await addFieldsToContentProfile(
        page,
        [{tabName: 'Content', fieldId: 'custom url field 2', fieldType: 'custom vocabulary'}],
    );
    await expectFieldToBeVisibleInAuthoring(page, 'custom url field 2');
});

test('creating a field based on a vocabulary', {
    annotation: [
        {type: 'confluence', description: '1311835040 partial'}, // Add new vocabulary (AUTOMATED)
        {type: 'confluence', description: '10815143953 partial'}, // Vocabularies
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'vocabularies'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('ID', {exact: true}).fill('custom-vocabulary-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom vocabulary 2');
    await page.locator(s('vocabulary-modal', 'vocabulary-tabs')).getByRole('button', {name: 'Items'}).click();
    await page
        .locator(s('vocabulary-modal', 'vocabulary-modal-content'))
        .getByRole('button', {name: 'add item'})
        .click();
    await page
        .locator(s('vocabulary-modal', 'vocabulary-modal-content', 'vocabulary-item-field=name'))
        .fill('item 1');
    await page
        .locator(s('vocabulary-modal', 'vocabulary-modal-content', 'vocabulary-item-field=qcode'))
        .fill('item 1');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom vocabulary 2'))).toBeVisible();
    await addFieldsToContentProfile(page, [{tabName: 'Header', fieldId: 'custom vocabulary 2'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom vocabulary 2');
});
