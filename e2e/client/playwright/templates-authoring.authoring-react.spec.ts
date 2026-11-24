import {test, expect, type Locator, type Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {TemplateSettings} from './page-object-models/template-settings';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

/**
 * Templates QA cases on authoring-react: the Settings > Templates editor renders the template's
 * fields with authoring-react, and articles created from a template, or saved as one, open in it.
 * The other cases (remove, assign to a desk, default desk template, personal templates, privileges,
 * schedules) assert on the template list, desk settings or the "+" menu only; the settings tests of
 * `templates.spec.ts` and `templates.personal.spec.ts` pass unchanged with the authoring-react flag on.
 */
test.use({storageState: getStorageState({}, {authoringReact: true})});

test.setTimeout(90000);

function templateField(page: Page, fieldId: string): Locator {
    return page.getByTestId('template-edit-view')
        .getByTestId('authoring-field')
        .and(page.locator(`[data-test-value="${fieldId}"]`));
}

/**
 * Typing before authoring-react has initialized reaches the DOM but not its state, so the modal
 * stays clean. Save enabling is the only signal the editor took the edit.
 */
async function setTemplateFieldOnceLive(page: Page, fieldId: string, value: string): Promise<void> {
    const save = new TemplateSettings(page).getEditor().getByTestId('save');

    await expect(async () => {
        await setEditor3FieldValue(templateField(page, fieldId).getByRole('textbox'), value);
        await expect(save).toBeEnabled({timeout: 1000});
    }).toPass({timeout: 15000});
}

async function createArticleFromTemplate(page: Page, template: string): Promise<void> {
    await new Monitoring(page).createArticleFromTemplate(template);
    await new AuthoringReact(page).waitUntilOpen();
}

test('a new template keeps a field value set in its editor', {
    annotation: [
        {type: 'confluence', description: '1309835271 complete'}, // Create new template
    ],
}, async ({page}) => {
    const templates = new TemplateSettings(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await templates.startNewTemplate();
    await expect(templates.getEditor().getByTestId('save')).toBeDisabled();

    await templates.setProfile('Story');
    await expect(templateField(page, 'slugline')).toBeVisible();

    // Save is still disabled without a name, so it cannot tell when the editor is live.
    await new AuthoringReact(page).waitForAuthoringReactToInitialize();
    await setEditor3FieldValue(templateField(page, 'slugline').getByRole('textbox'), 'template slug');

    await templates.setName('Template 1');

    await templates.save('POST');

    // Cards carry the lowercased name in `data-test-value`.
    await expect(templates.getCard('template 1')).toBeVisible();

    await templates.openEditor('template 1');
    await expect(templateField(page, 'slugline').getByRole('textbox')).toHaveText('template slug');
});

test('an edited template name and field value are kept', {
    annotation: [
        {type: 'confluence', description: '1311835108 partial'}, // Edit template
    ],
}, async ({page}) => {
    const templates = new TemplateSettings(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await templates.openEditor('story 2');
    await setTemplateFieldOnceLive(page, 'headline', 'Edited template headline');
    await templates.setName('story 1.1');
    await templates.save('PATCH');

    await expect(templates.getCard('story 1.1')).toBeVisible();

    await templates.openEditor('story 1.1');
    await expect(templateField(page, 'headline')).toContainText('Edited template headline');
});

test('an article created from a template is prefilled with its values', {
    annotation: [
        {type: 'confluence', description: '1311834557 partial'}, // Prefill template
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);

    await restoreDatabaseSnapshot();
    await monitoring.openMonitoringForDesk('Sports');

    await createArticleFromTemplate(page, 'story 2');

    await expect(authoring.input('slugline')).toHaveText('article 1');
});

test('an article saved as a desk template is offered on that desk and prefills new articles', {
    annotation: [
        {type: 'confluence', description: '1308524933 partial'}, // Save as template
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);

    await restoreDatabaseSnapshot();
    await monitoring.openMonitoringForDesk('Sports');

    await createArticleFromTemplate(page, 'story 2');
    await authoring.replaceEditor3FieldText(authoring.input('headline'), 'Saved as template');

    const modal = await authoring.openSaveAsTemplate();

    await modal.getByLabel('Template name').fill('story 2.1');
    await expect(modal).toContainText('A new template will be created');
    // "story 2" is a Sports desk template, so the copy starts as one too.
    await expect(modal.getByRole('checkbox', {name: 'Desk template'})).toBeChecked();
    await expect(modal.getByLabel('Desks').locator('option:checked')).toHaveText('Sports');
    await modal.getByRole('button', {name: 'Save'}).click();
    await expect(modal).toBeHidden();

    await authoring.close();

    await page.goto('/#/settings/templates');
    await expect(new TemplateSettings(page).getCardDesks('story 2.1')).toHaveText('Sports');

    await monitoring.openMonitoringForDesk('Sports');
    await createArticleFromTemplate(page, 'story 2.1');

    await expect(authoring.fieldContainer('headline')).toContainText('Saved as template');
    await expect(authoring.input('slugline')).toHaveText('article 1');
});
