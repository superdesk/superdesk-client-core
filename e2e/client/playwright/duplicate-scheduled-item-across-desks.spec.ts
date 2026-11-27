import {test, expect, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, waitForToastMessage} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

// two publishes and a duplicate run through the authoring view
test.setTimeout(90000);

const ORIGINAL_HEADLINE = 'west gate closes at dusk';
const DUPLICATE_HEADLINE = 'west gate closes at dusk (education)';

function inTwoDaysAtTen(): Date {
    const when = new Date();

    when.setDate(when.getDate() + 2);
    when.setHours(10, 0, 0, 0);

    return when;
}

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

// Typed key by key (primereact's Calendar ignores `input` without a preceding `keydown`),
// date before time (the picker defaults the missing half to "now"), retried as a unit
// (keystrokes can drop mid-re-render). The placeholder is the only source of the date format.
async function fillPublishSchedule(page: Page, when: Date): Promise<void> {
    const section = page.getByTestId('publish-schedule');
    const dateInput = section.getByTestId('date-input');
    const timeInput = section.getByTestId('time-input');
    const placeholder = await dateInput.getAttribute('placeholder');

    if (placeholder == null) {
        throw new Error('the publish schedule date input has no placeholder to read the date format from');
    }

    const date = placeholder
        .replace('dd', pad(when.getDate()))
        .replace('mm', pad(when.getMonth() + 1))
        .replace('yyyy', when.getFullYear().toString());
    const time = `${pad(when.getHours())}:${pad(when.getMinutes())}`;

    await expect(async () => {
        await dateInput.clear();
        await dateInput.pressSequentially(date);
        await dateInput.press('Escape');
        await timeInput.fill(time);

        await expect(dateInput).toHaveValue(date, {timeout: 2000});
        await expect(timeInput).toHaveValue(time, {timeout: 2000});
    }).toPass({timeout: 30000});
}

// Save is disabled both in flight and once clean, so the PATCH is what tells them apart.
async function saveOpenArticle(page: Page): Promise<void> {
    const saveButton = page.getByTestId('authoring-topbar').getByTestId('save');

    const [response] = await Promise.all([
        page.waitForResponse((res) => res.request().method() === 'PATCH' && res.url().includes('/archive/')),
        saveButton.click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(saveButton).toBeDisabled();
}

// The search bar input has no test id.
async function searchFor(page: Page, text: string): Promise<void> {
    const input = page.locator('#search-input');

    await input.fill(text);
    await input.press('Enter');
}

test('publishing a duplicate of a scheduled item on another desk raises no console errors', async ({page}) => {
    const monitoring = new Monitoring(page);
    const authoring = page.getByTestId('authoring');
    const panel = authoring.getByTestId('interactive-actions-panel');

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    // Attached after the initial load: application boot raises errors of its own
    // (locale 404s, "Failed to load resource" noise) that this spec does not guard.
    const consoleErrors: Array<string> = [];

    page.on('console', (message) => {
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
            consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', (error) => {
        consoleErrors.push(`pageerror: ${error.message}`);
    });

    await monitoring.createArticleFromDefaultTemplate();
    await setEditor3FieldValue(authoring.getByTestId('field--headline').getByRole('textbox'), ORIGINAL_HEADLINE);
    await saveOpenArticle(page);

    await authoring.getByTestId('open-send-publish-pane').click();
    await fillPublishSchedule(page, inTwoDaysAtTen());
    await panel.getByTestId('publish').click();

    // a schedule leaves the article dirty, so publishing raises the unsaved-changes prompt
    await page.getByTestId('modal-confirm').getByRole('button', {name: 'save and send'}).click();
    await waitForToastMessage(page, 'success', 'Item published.');

    const sportsOutput = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports desk output"]'));
    const scheduled = sportsOutput.getByTestId('article-item')
        .and(page.locator(`[data-test-value="${ORIGINAL_HEADLINE}"]`));

    await expect(scheduled).toBeVisible();
    await expect(scheduled.getByText('Scheduled')).toBeVisible();

    await monitoring.duplicateTo(scheduled, {desk: 'Education', stage: 'Working stage'});

    await monitoring.selectDeskOrWorkspace('Education');

    const duplicate = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Education / Working Stage"]'))
        .getByTestId('article-item')
        .and(page.locator(`[data-test-value="${ORIGINAL_HEADLINE}"]`));

    await expect(duplicate).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(duplicate, 'Edit');

    await authoring.getByTestId('open-send-publish-pane').click();
    await expect(panel.getByRole('button', {name: 'Target'})).toBeVisible();
    await expect(page.getByTestId('publish-schedule').getByTestId('date-input')).toHaveValue('');
    await expect(page.getByTestId('embargo').getByTestId('date-input')).toHaveValue('');
    await panel.getByTestId('close').click();

    // renamed so the published duplicate is distinguishable from the scheduled original
    await setEditor3FieldValue(authoring.getByTestId('field--headline').getByRole('textbox'), DUPLICATE_HEADLINE);
    await saveOpenArticle(page);

    await authoring.getByTestId('open-send-publish-pane').click();
    await panel.getByTestId('publish').click();
    await waitForToastMessage(page, 'success', 'Item published.');

    await page.goto('/#/search?repo=published');
    await searchFor(page, DUPLICATE_HEADLINE);

    const published = page.getByTestId('article-item')
        .and(page.locator(`[data-test-value="${DUPLICATE_HEADLINE}"]`));

    await expect(published).toBeVisible();
    await expect(published.getByText('Scheduled')).toBeHidden();

    expect(consoleErrors).toEqual([]);
});
