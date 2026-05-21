import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

const TEMPLATE_NAME = 'Auto Created Template';

test('creating an automatic-item-creation template persists schedule on reload', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    // Add a new template.
    await page.locator(s('template-header')).getByRole('button', {name: 'Add new'}).click();

    const editView = page.locator(s('template-edit-view'));

    await editView.getByPlaceholder('template name').fill(TEMPLATE_NAME);
    await editView.getByLabel('Content Profile').selectOption({label: 'Story'});

    // Assign to Sports desk.
    await editView.locator(s('desks', 'desk--Sports')).click();

    // Toggle "Automatically create item".
    await editView.locator('span[sd-switch][ng-model="template.schedule.is_active"]').click();

    // Pick Tuesday in the weekday picker.
    await editView.locator('div[sd-weekday-picker] .sd-checkbox--button-Tuesday').click();

    // Set time 10:30 and add it as a cron entry.
    await editView.locator('input[ng-model="tt"]').fill('10:30');
    await editView.locator('#add_time').click();
    await expect(editView.locator('[ng-repeat="time in cron_times"]').first()).toContainText('10:30');

    // Schedule desk + stage.
    await editView.locator('#schedule-desk').selectOption({label: 'Sports'});
    await editView.locator('#template-stage').selectOption({label: 'Working Stage'});

    await editView.getByRole('button', {name: 'Save'}).click();

    // Verify the template appears in the list.
    await expect(
        page.locator(s('template-content', `content-template=${TEMPLATE_NAME.toLowerCase()}`)),
    ).toBeVisible();

    // Reopen and verify auto-create settings persisted.
    await page.locator(
        s('template-content', `content-template=${TEMPLATE_NAME.toLowerCase()}`, 'template-actions'),
    ).click();
    await page.locator(s('template-actions--options')).getByRole('button', {name: 'Edit'}).click();

    await expect(editView.getByPlaceholder('template name'))
        .toHaveValue(TEMPLATE_NAME.toLowerCase());
    await expect(
        editView.locator('span[sd-switch][ng-model="template.schedule.is_active"]'),
    ).toHaveClass(/checked/);
    await expect(
        editView.locator('div[sd-weekday-picker] .sd-checkbox--button-Tuesday'),
    ).toHaveClass(/checked/);
    await expect(editView.locator('[ng-repeat="time in cron_times"]').first()).toContainText('10:30');

    // <select> with track-by-id makes the option value the desk/stage _id, not
    // its name; match the visible selected text by reading the rendered option.
    await expect(
        editView.locator('#schedule-desk option:checked'),
    ).toHaveText('Sports');
    await expect(
        editView.locator('#template-stage option:checked'),
    ).toHaveText('Working Stage');
});
