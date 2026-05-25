import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

const TEMPLATE_NAME = 'Auto Created Template';

test('creating an automatic-item-creation template persists schedule on reload', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await page.locator(s('template-header')).getByRole('button', {name: 'Add new'}).click();

    const editView = page.locator(s('template-edit-view'));

    await editView.getByPlaceholder('template name').fill(TEMPLATE_NAME);
    await editView.getByLabel('Content Profile').selectOption({label: 'Story'});

    await editView.locator(s('desks', 'desk--Sports')).click();

    // Toggle "Automatically create item".
    await editView.locator('span[sd-switch][ng-model="template.schedule.is_active"]').click();

    await editView.locator('div[sd-weekday-picker] .sd-checkbox--button-Tuesday').click();

    // Pick 10:30 via the timepicker popup rather than typing into the input.
    // The input parser (sd-timepicker-inner in scripts/core/ui/ui.ts:511) is
    // locale-sensitive: a typed "10:30" only commits to new_time.picked if it
    // matches appConfig.view.timeformat — and even then only on a digest
    // cycle that fill()+blur don't always trigger. The popup's hour/minute
    // selection goes through ctrl.$setViewValue directly and is deterministic.
    await editView.locator('span[sd-timepicker] .icn-btn').click();

    const popup = page.locator('.timepicker-popup');

    await expect(popup).toBeVisible();
    await popup.locator('.select-area').filter({hasText: 'Hours'})
        .locator('li').filter({hasText: /^10$/}).click();
    await popup.locator('.select-area').filter({hasText: 'Minutes'})
        .locator('li').filter({hasText: /^30$/}).click();
    await popup.getByRole('button', {name: 'Confirm', exact: true}).click();
    await expect(popup).not.toBeVisible();

    await editView.locator('#add_time').click();
    await expect(editView.locator('[ng-repeat="time in cron_times"]').first()).toContainText('10:30');

    await editView.locator('#schedule-desk').selectOption({label: 'Sports'});
    await editView.locator('#template-stage').selectOption({label: 'Working Stage'});

    await editView.getByRole('button', {name: 'Save'}).click();

    // Wait for the edit view to close — otherwise the subsequent click on the
    // template-actions dropdown can race the editView's teardown animation
    // and intercept the dropdown toggle.
    await expect(editView).not.toBeVisible();

    await expect(
        page.locator(s('template-content', `content-template=${TEMPLATE_NAME.toLowerCase()}`)),
    ).toBeVisible();

    // Newly-saved templates trigger a `content_templates` re-fetch that
    // re-renders the ng-repeat list a beat later — clicking the dropdown
    // mid-rerender silently closes it. Reload to land on a settled DOM
    // before driving the action menu.
    await page.reload();
    await expect(
        page.locator(s('template-content', `content-template=${TEMPLATE_NAME.toLowerCase()}`)),
    ).toBeVisible();

    // Reopen and verify auto-create settings persisted. Scope the
    // template-actions--options dropdown to this specific card — clicking
    // Edit via the global selector occasionally times out when ng-repeat
    // re-renders other template cards mid-click.
    const templateCard = page.locator(
        s('template-content', `content-template=${TEMPLATE_NAME.toLowerCase()}`),
    );

    await templateCard.locator(s('template-actions')).click();

    // The dropdown__toggle directive auto-closes the menu when Playwright's
    // actionability check moves the mouse near Edit, racing the click forever.
    // Force-click skips the actionability retry; the dropdown is open at the
    // moment we evaluate the locator (one tick after the toggle click).
    await templateCard.locator(s('template-actions--options'))
        .getByRole('button', {name: 'Edit'}).click({force: true});

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
