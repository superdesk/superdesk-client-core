import {test, expect} from '@playwright/test';
import {ContentProfileSettings} from './page-object-models/settings/content-profile';
import {restoreDatabaseSnapshot} from './utils';
import {createContentProfile} from './utils/content-profiles-api';
import {getStorageState} from './utils/storage-state';
import {createArticleFromTemplate, editArticle} from './scenarios/authoring-react-article';

test.use({storageState: getStorageState({}, {authoringReact: true})});

test('an article created from a template of a new content profile shows only that profile\'s fields', {
    annotation: [
        // Use content profile in a template
        {type: 'confluence', description: '1311834555 complete'},
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const {profileId} = await createContentProfile('Simple', [
        {id: 'slugline', section: 'header'},
        {id: 'headline', section: 'content', formatOptions: []},
        {id: 'body_html', section: 'content', formatOptions: ['bold']},
    ]);

    const {authoring} = await createArticleFromTemplate(page, 'simple');

    await expect(authoring.root.getByTestId('content-profile-select')).toHaveAttribute('data-test-value', profileId);
    await expect.poll(() => authoring.root.getByTestId('authoring-field')
        .evaluateAll((fields) => fields.map((field) => field.getAttribute('data-test-value'))))
        .toEqual(['slugline', 'headline', 'body_html']);

    await authoring.input('slugline').fill('simple profile story');
    await authoring.input('body_html').fill('simple profile body');

    const saved = await authoring.saveAndGetItem();

    expect(saved.profile).toBe(profileId);
    expect(saved.body_html).toContain('simple profile body');
});

test('a header field made required in the content profile blocks publishing', {
    annotation: [
        // Edit content profile header fields
        {type: 'confluence', description: '1311834983 complete'},
    ],
}, async ({page}) => {
    const profiles = new ContentProfileSettings(page);
    const editModal = page.getByTestId('content-profile-editing-modal');

    await restoreDatabaseSnapshot();

    await page.goto('/#/settings/content-profiles');
    await profiles.openEditor('Story');
    await profiles.openSection('Header');
    await editModal.getByTestId('content-profile-fields').getByTestId('field')
        .and(page.locator('[data-test-value="Ed. Note"]'))
        .click();
    await page.getByTestId('item-view-edit').getByText('Required', {exact: true}).click();
    await page.getByTestId('item-view-edit').getByTestId('item-view-edit--save').click();
    await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/content_types/') && r.request().method() === 'PATCH'),
        editModal.getByRole('button', {name: 'Save'}).click(),
    ]);
    await expect(editModal).toBeHidden();

    // content profiles are read once on load
    await page.goto('/#/workspace/monitoring');
    await page.reload();

    const {authoring} = await editArticle(page, 'test sports story');
    const panel = await authoring.openActionsPanel('Publish');

    await panel.getByTestId('publish').click();

    await expect(
        page.getByTestId('notification--error').filter({hasText: 'ED. NOTE is a required field'}),
    ).toBeVisible();
    await expect(authoring.root).toBeVisible();
});
