import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {restoreDatabaseSnapshot, s} from './utils';

async function expectFieldToBeVisibleInAuthoring(page, field) {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await expect(page.locator(s('authoring', `authoring-field=${field}`))).toBeVisible();
}

async function addFieldToContentProfile(page, field) {
    const contentProfileSettings = new ContentProfileSettings(page);

    await page.goto('/#/settings/content-profiles');
    await contentProfileSettings.addFieldToContentProfile('Story', field);
}

test('creating a custom text field', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'Custom text fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('custom-text-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom text field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom text field 2'))).toBeVisible();
    await addFieldToContentProfile(page, [{tabName: 'Content', fieldId: 'custom text field 2'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom text field 2');
});

test('creating a custom date field', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'Custom date fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('custom-date-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom date field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom date field 2'))).toBeVisible();
    await addFieldToContentProfile(page, [{tabName: 'Content', fieldId: 'custom date field 2'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom date field 2');
});

test('creating a custom embed field', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'Custom embed fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('custom-embed-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom embed field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom embed field 2'))).toBeVisible();
    await addFieldToContentProfile(page, [{tabName: 'Content', fieldId: 'custom embed field 2'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom embed field 2');
});

test('creating a related content field', async ({page}) => {
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
    await addFieldToContentProfile(page, [{tabName: 'Content', fieldId: 'related content field 2'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'related content field 2');
});

test('creating a custom URL field', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-tabs')).getByRole('button', {name: 'URLs'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();
    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('custom-url-field-2');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom url field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom url field 2'))).toBeVisible();
    await addFieldToContentProfile(page, [{tabName: 'Content', fieldId: 'custom url field 2'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom url field 2');
});

test('creating a field based on a vocabulary', async ({page}) => {
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
        .locator(s('vocabulary-modal', 'vocabulary-modal-content'))
        .getByLabel('name', {exact: true})
        .fill('item 1');
    await page.locator(s('vocabulary-modal', 'vocabulary-modal-content')).getByLabel('qcode').fill('item 1');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom vocabulary 2'))).toBeVisible();
    await addFieldToContentProfile(page, [{tabName: 'Header', fieldId: 'custom vocabulary 2'}]);
    await expectFieldToBeVisibleInAuthoring(page, 'custom vocabulary 2');
});
