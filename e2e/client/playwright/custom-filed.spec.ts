import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Settings} from './page-object-models/settings';
import {restoreDatabaseSnapshot, s} from './utils';

test('creating custom text field', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-nav')).getByRole('button', {name: 'Custom text fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();

    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('textfield');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom text field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom text field 2'))).toBeVisible();
});

test('creating custom date field', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-nav')).getByRole('button', {name: 'Custom date fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();

    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('datefield');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom date field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom date field 2'))).toBeVisible();
});

test('creating custom embed field', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-nav')).getByRole('button', {name: 'Custom embed fields'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();

    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('embedfield');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom embed field 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom embed field 2'))).toBeVisible();
});

test('creating related content', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-nav')).getByRole('button', {name: 'related content'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();

    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('relatedcontent');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('related content 2');

    await page.locator(s('vocabulary-modal')).getByLabel('content type').selectOption('Media gallery');
    await page.locator(s('vocabulary-modal')).getByLabel('image').click();
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('metadata-content', 'vocabulary-item=related content 2'))).toBeVisible();
});

test('creating custom URL', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-nav')).getByRole('button', {name: 'URLs'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();

    await page.locator(s('vocabulary-modal')).getByLabel('id').fill('customurl');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom url 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom url 2'))).toBeVisible();
});

test('creating custom vocabularies', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/vocabularies');

    await page.locator(s('metadata-nav')).getByRole('button', {name: 'vocabularie'}).click();
    await page.locator(s('metadata-content')).getByRole('button', {name: 'Add new'}).click();

    await page.locator(s('vocabulary-modal')).getByLabel('ID', {exact: true}).fill('customvocabularie');
    await page.locator(s('vocabulary-modal')).getByLabel('name').fill('custom vocabularie 2');
    await page.locator(s('vocabulary-modal')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('metadata-content', 'vocabulary-item=custom vocabularie 2'))).toBeVisible();
});

test('adding custom text field in content profile', async ({page}) => {
    const settings = new Settings(page);
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/content-profiles');

    await settings.AddFieldInContentProfile('Story', 'Content', 'custom text field');
    await expect(
        page.locator(s('content-profile-editing-modal', 'content-profile-item=custom text field')),
    ).toBeVisible();
    await page.locator(s('content-profile-editing-modal')).getByRole('button', {name: 'Save'}).click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await expect(page.locator(s('authoring', 'field=custom text field'))).toBeVisible();
});

test('adding custom date field in content profile', async ({page}) => {
    const settings = new Settings(page);
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/content-profiles');

    await settings.AddFieldInContentProfile('Story', 'Content', 'custom date field');
    await expect(
        page.locator(s('content-profile-editing-modal', 'content-profile-item=custom date field')),
    ).toBeVisible();
    await page.locator(s('content-profile-editing-modal')).getByRole('button', {name: 'Save'}).click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await expect(page.locator(s('authoring', 'field=custom date field'))).toBeVisible();
});

test('adding custom embed field in content profile', async ({page}) => {
    const settings = new Settings(page);
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/content-profiles');

    await settings.AddFieldInContentProfile('Story', 'Content', 'custom embed field');
    await expect(
        page.locator(s('content-profile-editing-modal', 'content-profile-item=custom embed field')),
    ).toBeVisible();
    await page.locator(s('content-profile-editing-modal')).getByRole('button', {name: 'Save'}).click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await expect(page.locator(s('authoring', 'field=custom embed field'))).toBeVisible();
});

test('adding custom related content field in content profile', async ({page}) => {
    const settings = new Settings(page);
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/content-profiles');

    await settings.AddFieldInContentProfile('Story', 'Content', 'related content');
    await expect(
        page.locator(s('content-profile-editing-modal', 'content-profile-item=related content')),
    ).toBeVisible();
    await page.locator(s('content-profile-editing-modal')).getByRole('button', {name: 'Save'}).click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await expect(page.locator(s('authoring', 'field=related content'))).toBeVisible();
});

test('adding custom URL field in content profile', async ({page}) => {
    const settings = new Settings(page);
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/content-profiles');

    await settings.AddFieldInContentProfile('Story', 'Content', 'custom url field');
    await expect(
        page.locator(s('content-profile-editing-modal', 'content-profile-item=custom url field')),
    ).toBeVisible();
    await page.locator(s('content-profile-editing-modal')).getByRole('button', {name: 'Save'}).click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await expect(page.locator(s('authoring', 'field=custom url field'))).toBeVisible();
});

test('adding custom vocabulary in content profile', async ({page}) => {
    const settings = new Settings(page);
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/content-profiles');

    await settings.AddFieldInContentProfile('Story', 'Header', 'custom vocabulary');
    await expect(
        page.locator(s('content-profile-editing-modal', 'content-profile-item=custom vocabulary')),
    ).toBeVisible();
    await page.locator(s('content-profile-editing-modal')).getByRole('button', {name: 'Save'}).click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.createArticleFromTemplate('story');
    await expect(page.locator(s('authoring', 'field=custom vocabulary'))).toBeVisible();
});
