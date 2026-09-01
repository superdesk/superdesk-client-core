import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('creating new template', {
    annotation: [
        {type: 'confluence', description: '1309835271 complete'}, // Create new template
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await page.locator(s('template-header')).getByRole('button', {name: 'Add new'}).click();

    // Save must be disabled until required fields (name + profile) are filled.
    const saveButton = page.locator(s('template-edit-view')).getByRole('button', {name: 'Save'});

    await expect(saveButton).toBeDisabled();

    await page.locator(s('template-edit-view')).getByPlaceholder('template name').fill('Template 1');
    await page.locator(s('template-edit-view')).getByLabel('Content Profile').selectOption({label: 'Story'});
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page.locator(s('template-content', 'content-template=template 1'))).toBeVisible();
});

test('editing template name', {
    annotation: [
        {type: 'confluence', description: '1311835108 partial'}, // Edit template
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await page.locator(s('template-content', 'content-template=story', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Edit'}).click();
    await page.locator(s('template-edit-view')).getByPlaceholder('template name').fill('story 1.1');
    await page.locator(s('template-edit-view')).getByRole('button', {name: 'Save'}).click();

    await expect(page.locator(s('template-content', 'content-template=story 1.1'))).toBeVisible();
});

test('removing template', {
    annotation: [
        {type: 'confluence', description: '1309835275 complete'}, // Remove template
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await page.locator(s('template-content', 'content-template=story 2', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Remove'}).click();
    await page.locator(s('modal-confirm')).getByRole('button', {name: 'Ok'}).click();
    await expect(page.locator(s('template-content', 'content-template=story 2'))).not.toBeVisible();
});

test('assigning template to a desk', {
    annotation: [
        {type: 'confluence', description: '1308524963 complete'}, // Assign template to a desk
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Finance');

    await page.locator(s('content-create')).click();
    await page.locator(s('content-create-dropdown')).getByRole('button', {name: 'More Templates...'}).click();
    await page.locator(s('content-create-dropdown', 'search')).fill('Story 2');
    await expect(page.locator(s('content-create-dropdown')).getByRole('button', {name: 'Story 2'})).not.toBeVisible();

    // assign template to the desk
    await page.goto('/#/settings/templates');
    await page.locator(s('template-content', 'content-template=story 2', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Edit'}).click();
    await page.locator(s('template-edit-view', 'desks', 'desk--Finance')).click();
    await page.locator(s('template-edit-view')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('template-edit-view'))).not.toBeVisible();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Finance');

    await page.locator(s('content-create')).click();
    await page.locator(s('content-create-dropdown')).getByRole('button', {name: 'More Templates...'}).click();
    await expect(page.locator(s('content-create-dropdown')).getByRole('button', {name: 'Story 2'})).toBeVisible();
});

test('template assigned to multiple desks is accessible from each', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    // The snapshot's "story 2" starts assigned to Sports only. Adding Finance
    // and Education without touching Sports — clicking desk--Sports would
    // toggle it OFF and invalidate the test.
    await page.locator(s('template-content', 'content-template=story 2', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Edit'}).click();
    await page.locator(s('template-edit-view', 'desks', 'desk--Finance')).click();
    await page.locator(s('template-edit-view', 'desks', 'desk--Education')).click();
    await page.locator(s('template-edit-view')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('template-edit-view'))).not.toBeVisible();

    for (const desk of ['Finance', 'Education']) {
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace(desk);
        await page.locator(s('content-create')).click();
        await page.locator(s('content-create-dropdown')).getByRole('button', {name: 'More Templates...'}).click();
        await expect(
            page.locator(s('content-create-dropdown')).getByRole('button', {name: 'Story 2'}),
        ).toBeVisible();
        await page.keyboard.press('Escape');
    }
});

test('legal-flag toggle on a template persists across edit', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await page.locator(s('template-content', 'content-template=story 2', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Edit'}).click();

    // The Legal switch lives inside the collapsed "Metadata" toggle box.
    await page.locator('#template-editor-metadata').click();
    const legalSwitch = page.locator(
        s('template-edit-view'),
    ).locator('[ng-model="item.flags.marked_for_legal"]');

    await legalSwitch.click();
    await page.locator(s('template-edit-view')).getByRole('button', {name: 'Save'}).click();
    await expect(page.locator(s('template-edit-view'))).not.toBeVisible();

    // Reload to force a fresh template list. The save above triggers a
    // template:update websocket event that re-runs fetchTemplates() in
    // TemplatesDirective; if that fetch resolves mid-click, ng-repeat
    // re-renders the cards and the Edit button gets detached.
    await page.goto('/#/settings/templates');
    await page.waitForLoadState('networkidle');
    await page.locator(s('template-content', 'content-template=story 2', 'template-actions')).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Edit'}).click();
    await page.locator('#template-editor-metadata').click();
    // sd-switch renders as <span class="sd-toggle">; ON state adds `checked`
    // class to that span (see scripts/.../switch.js).
    await expect(
        page.locator(s('template-edit-view')).locator(
            '[ng-model="item.flags.marked_for_legal"]',
        ),
    ).toHaveClass(/checked/);
});

test('default content template', {
    annotation: [
        {type: 'confluence', description: '10542284955 complete'}, // default value saved in templates Mikayel - PASS
        {type: 'confluence', description: '1311834559 partial'}, // Default content template
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/desks');

    await page.locator(s('desk--Sports', 'desk-actions')).click();
    await page.locator(s('desk-actions--options')).getByRole('button', {name: 'Edit'}).click();
    await page.locator(s('desk-config-modal', 'field--default-content-template')).selectOption({label: 'story 2'});
    await page.locator(s('desk-config-modal')).getByRole('button', {name: 'done'}).click();
    await expect(page.locator(s('desk-config-modal'))).not.toBeVisible();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await page.locator(s('content-create')).click();
    await expect(page.locator(s('content-create-dropdown', 'default-desk-template'))).toHaveText('story 2');
});

test('new article prefilling with content set in template', {
    annotation: [
        {type: 'confluence', description: '1311834557 partial'}, // Prefill template
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.createArticleFromTemplate('story 2');
    await expect(page.locator(s('authoring', 'field-slugline'))).toHaveValue('article 1');
});

test('performing "save as" action on a template', {
    annotation: [
        {type: 'confluence', description: '1308524933 partial'}, // Save as template
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.createArticleFromTemplate('story 2', {slugline: 'article 1'});

    await authoring.executeActionInEditor(
        'Save as template',
    );

    await page.locator(s('modal-save-as-template')).getByLabel('name').fill('story 2.1');
    await page.locator(s('modal-save-as-template')).getByLabel('Desk').selectOption({label: 'Sports'});
    await page.locator(s('modal-save-as-template')).getByRole('button', {name: 'Save'}).click();

    await page.goto('/#/settings/templates');
    await expect(page.locator(s('template-content', 'content-template=story 2.1'))).toBeVisible();
});
