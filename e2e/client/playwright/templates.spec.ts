import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('creating new template', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await page.locator(s('template-header')).getByRole('button', {name: 'Add new'}).click();

    await page.locator(s('template-edit-view')).getByPlaceholder('template name').fill('Template 1');
    await page.locator(s('template-edit-view', 'select-content-profile')).selectOption({label: 'Story'});
    await page.locator(s('template-edit-view')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('template-content', 'content-template--template 1'))).toBeVisible();
});

test('editing template', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await page.locator(s('template-content', 'content-template--story', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Edit'}).click();
    await page.locator(s('template-edit-view')).getByPlaceholder('template name').fill('story 1.1');
    await page.locator(s('template-edit-view')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('template-content', 'content-template--story 1.1'))).toBeVisible();
});

test('removing template', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await page.locator(s('template-content', 'content-template--story 2', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Remove'}).click();
    await page.locator(s('modal-confirm')).getByRole('button', {name: 'Ok'}).click();
    await expect(page.locator(s('template-content', 'content-template--story 2'))).not.toBeVisible();
});

test('Assign template to a desk', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Finances');

    await page.locator(s('content-create')).click();
    await page.locator(s('content-create-dropdown')).getByRole('button', {name: 'More Templates...'}).click();
    await expect(page.locator(s('content-create-dropdown')).getByRole('button', {name: 'Story 2'})).not.toBeVisible();

    // assign template to the desk
    await page.goto('/#/settings/templates');
    await page.locator(s('template-content', 'content-template--story 2', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Edit'}).click();
    await page.locator(s('template-edit-view', 'desks', 'desk--Finances')).first().click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(s('content-create')).click();
    await page.locator(s('content-create-dropdown')).getByRole('button', {name: 'More Templates...'}).click();
    await expect(page.locator(s('content-create-dropdown')).getByRole('button', {name: 'Story 2'})).toBeVisible();
});

test('Default content template', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/desks');

    await page.locator(s('desk--Sports', 'desk-actions')).click();
    await page.locator(s('actions--options')).getByRole('button', {name: 'Edit'}).click();
    await page.locator(s('desk-config-modal', 'field--default-content-template')).selectOption({label: 'story 2'});
    await page.locator(s('desk-config-modal')).getByRole('button', {name: 'done'}).click();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await page.locator(s('content-create')).click();
    await expect(page.locator(s('content-create-dropdown', 'default-desk-template'))).toHaveText('story 2');
});

test('Prefill template', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.createArticleFromTemplate('story 2');
    await expect(page.locator(s('authoring', 'field-slugline'))).toHaveValue('article 1');
});

test('Save as template', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.createArticleFromTemplate('story 2', {slugline: 'article 1'});

    await monitoring.executeActionInEditor(
        'Save as template',
    );

    await page.locator(s('modal-save-as-template', 'name-input')).fill('story 2.1');
    await page.locator(s('modal-save-as-template', 'select-desk')).selectOption({label: 'Sports'});
    await page.locator(s('modal-save-as-template')).getByRole('button', {name: 'Save'}).click();

    await page.goto('/#/settings/templates');
    await expect(page.locator(s('template-content', 'content-template--story 2.1'))).toBeVisible();
});
