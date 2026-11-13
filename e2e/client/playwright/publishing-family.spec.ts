import {test, expect, Locator, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, waitForToastMessage} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

// every test here drives several publishes through the authoring view
test.setTimeout(90000);

/*
 * Publishing family: scheduling, publishing a package, the desk-type gate on the Publish tab,
 * unpublishing, and the NINJS an update carries. Deviations from the QA cases:
 * - Calendar and clock popup results are not asserted: the panel renders the React `DatePicker`,
 *   not the AngularJS picker, and has no Cancel/Confirm or "In 30 min" shortcuts.
 * - Scheduled items open read-only, so persistence is asserted via the date on the list row.
 * - Publishing from the panel raises "Save and send", not "Save and publish".
 * - There is no "Publish package and items" button; plain Publish publishes the contents.
 * - The Talpa `original` field is not emitted by any e2e formatter (see the `test.fixme`).
 */

function inTwoDaysAtTen(): Date {
    const when = new Date();

    when.setDate(when.getDate() + 2);
    when.setHours(10, 0, 0, 0);

    return when;
}

function publishPanel(page: Page): Locator {
    return page.getByTestId('authoring').getByTestId('interactive-actions-panel');
}

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

// The toast is waited out because `notify` drops a message already on screen, so a later publish would raise none.
// A schedule leaves the article dirty, so `beforeSend` raises the unsaved-changes prompt.
async function publishOpenArticle(page: Page, options: {publishSchedule?: Date}): Promise<void> {
    await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

    if (options.publishSchedule != null) {
        await fillPublishSchedule(page, options.publishSchedule);
    }

    await publishPanel(page).getByTestId('publish').click();

    if (options.publishSchedule != null) {
        await page.getByTestId('modal-confirm').getByRole('button', {name: 'save and send'}).click();
    }

    await waitForToastMessage(page, 'success', 'Item published.');
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

// The date format is only available as the input placeholder.
// Typed key by key because primereact's Calendar ignores `input` events without a preceding `keydown`.
// Date before time because `DateTimePicker` defaults the missing half to "now".
// Retried as a unit because a keystroke can be dropped while the picker re-renders.
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

// The modal closes before the request finishes, so wait for the PATCH or the reload can read the old type.
async function setDeskType(page: Page, deskName: string, deskType: 'authoring' | 'production'): Promise<void> {
    await page.goto('/#/settings/desks');

    const row = page.getByTestId(`desk--${deskName}`);

    await expect(row).toBeVisible();
    await row.getByTestId('desk-actions').click();
    await row.getByTestId('desk-actions--options').getByRole('button', {name: 'Edit'}).click();

    const modal = page.getByTestId('desk-config-modal');

    await expect(modal).toBeVisible();
    await modal.getByTestId('field--desk-type').selectOption(deskType);

    const [response] = await Promise.all([
        page.waitForResponse((res) => res.request().method() === 'PATCH' && res.url().includes('/desks/')),
        modal.getByTestId('done').click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(modal).toBeHidden();
}

// Both `publishing` snapshot subscribers receive every untargeted publish, so the entry is picked by destination.
// The payload modal's only dismiss control is an unnamed icon link, so the page is reloaded to clear it.
async function readTransmittedPayload(
    monitoring: Monitoring,
    page: Page,
    item: Locator,
    destination: string,
    deskName: string,
): Promise<string> {
    await item.click();
    await monitoring.openPreviewTab('Item history');

    const preview = monitoring.getPreviewPane();
    const toggle = preview.getByTestId('toggle-transmission-details');

    await expect(toggle).toHaveCount(1);
    await toggle.click();

    const queueEntry = preview.getByTestId('queued-item').and(page.locator(`[data-test-value="${destination}"]`));

    await expect(queueEntry).toHaveCount(1);
    await queueEntry.click();

    // the modal is appended to the body, not the preview
    const transmitted = page.getByTestId('transmitted-item');

    await expect(transmitted).toBeVisible();

    const payload = (await transmitted.innerText()).trim();

    await page.reload();
    await monitoring.selectDeskOrWorkspace(deskName);

    return payload;
}

test.describe('scheduled publishing', () => {
    test('the publish schedule fields take a date and a time and can be cleared', {
        annotation: [
            {type: 'confluence', description: '1308524953 partial'}, // Schedule publishing (Nareg)
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            monitoring.getArticleLocator('test sports story'),
            'Edit',
        );

        await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

        const section = page.getByTestId('publish-schedule');

        await expect(section.getByTestId('date-input')).toBeVisible();
        await expect(section.getByTestId('time-input')).toBeVisible();

        await fillPublishSchedule(page, inTwoDaysAtTen());

        const clear = section.getByRole('button', {name: 'Clear'});

        await expect(clear).toBeVisible();
        await clear.click();

        await expect(section.getByTestId('date-input')).toHaveValue('');
        await expect(section.getByTestId('time-input')).toHaveValue('');
    });

    test('publishing with a schedule leaves the item scheduled until it is descheduled', {
        annotation: [
            {type: 'confluence', description: '1308524953 partial'}, // Schedule publishing (Nareg)
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            monitoring.getArticleLocator('test sports story'),
            'Edit',
        );

        const authoring = page.getByTestId('authoring');
        const dateInput = page.getByTestId('publish-schedule').getByTestId('date-input');

        await authoring.getByTestId('open-send-publish-pane').click();
        await fillPublishSchedule(page, inTwoDaysAtTen());

        const enteredDate = await dateInput.inputValue();
        const prompt = page.getByTestId('modal-confirm');

        await publishPanel(page).getByTestId('publish').click();
        await expect(prompt).toContainText('There are some unsaved changes');
        await prompt.getByRole('button', {name: 'Cancel'}).click();

        await expect(prompt).toBeHidden();
        await expect(page.getByTestId('authoring-topbar')).toBeVisible();
        await expect(dateInput).toHaveValue(enteredDate);

        await publishPanel(page).getByTestId('publish').click();
        await prompt.getByRole('button', {name: 'save and send'}).click();
        await waitForToastMessage(page, 'success', 'Item published.');

        const deskOutput = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports desk output"]'));
        const scheduled = deskOutput.getByTestId('article-item')
            .and(page.locator('[data-test-value="test sports story"]'));

        await expect(scheduled).toBeVisible();
        await expect(scheduled.getByText('Scheduled')).toBeVisible();
        await expect(scheduled.getByTitle(/^Article is scheduled for /)).toBeVisible();
        await expect(scheduled.getByTitle(/^Article is scheduled for /)).toContainText(enteredDate);

        await scheduled.dblclick();

        const topbar = page.getByTestId('authoring-topbar');

        await expect(topbar).toBeVisible();
        await topbar.getByRole('button', {name: 'Deschedule'}).click();

        const workingStage = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'));

        await expect(
            workingStage.getByTestId('article-item').and(page.locator('[data-test-value="test sports story"]')),
        ).toBeVisible();

        // assert the group first so "row gone" is read off a rendered list
        await expect(deskOutput).toBeVisible();
        await expect(scheduled).toBeHidden();
    });
});

test('publishing a package publishes the items it contains', {
    annotation: [
        {type: 'confluence', description: '1308524959 partial'}, // Publish package (Nareg)
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getArticleLocator('Package Highlight 1'),
        'Edit',
    );

    const authoring = page.getByTestId('authoring');
    const mainGroup = authoring.getByTestId('package-group').and(page.locator('[data-test-value="main"]'));

    await expect(mainGroup.getByTestId('package-items')).toHaveCount(1);
    await expect(
        authoring.getByTestId('package-items').and(page.locator('[data-test-value="Story 3"]')),
    ).toBeVisible();

    await publishOpenArticle(page, {});

    const output = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports desk output"]'));

    await expect(
        output.getByTestId('article-item').and(page.locator('[data-test-value="Package Highlight 1"]')),
    ).toBeVisible();
    await expect(
        output.getByTestId('article-item').and(page.locator('[data-test-value="Story 3"]')),
    ).toBeVisible();
});

test.describe('publishing depending on desk type', () => {
    // `canPublish` (scripts/api/article.ts) only withholds the Publish tab on an authoring desk under this flag.
    test.use({storageState: getStorageState({features: {noPublishOnAuthoringDesk: true}})});

    test('the publish tab is offered on a production desk and withheld on an authoring one', {
        annotation: [
            {type: 'confluence', description: '1310851134 complete'}, // Publishing depending on desk type
        ],
    }, async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            monitoring.getArticleLocator('test sports story'),
            'Edit',
        );

        await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

        const tabs = publishPanel(page).getByTestId('tabs');

        await expect(tabs.getByRole('tab', {name: 'Send to'})).toBeVisible();
        await expect(tabs.getByRole('tab', {name: 'Publish'})).toBeVisible();

        await publishPanel(page).getByTestId('publish').click();
        await waitForToastMessage(page, 'success', 'Item published.');

        const deskOutput = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports desk output"]'));

        await expect(
            deskOutput.getByTestId('article-item').and(page.locator('[data-test-value="test sports story"]')),
        ).toBeVisible();

        await setDeskType(page, 'Sports', 'authoring');

        // the desks store loads once per application load, so a reload is needed
        await page.goto('/#/workspace/monitoring');
        await page.reload();
        await monitoring.selectDeskOrWorkspace('Sports');

        const workingStage = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'));

        await monitoring.executeActionOnMonitoringItem(
            workingStage.getByTestId('article-item').and(page.locator('[data-test-value="story 2"]')),
            'Edit',
        );

        await page.getByTestId('authoring').getByTestId('open-send-publish-pane').click();

        await expect(tabs.getByRole('tab', {name: 'Send to'})).toBeVisible();
        await expect(tabs.getByRole('tab')).toHaveCount(1);
    });
});

test('unpublishing returns a published item to the working stage', {
    annotation: [
        {type: 'confluence', description: '1344444004 partial'}, // Unpublishing - BEING AUTOMATED SDESK-7598
    ],
}, async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const deskOutput = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports desk output"]'));
    const published = deskOutput.getByTestId('article-item')
        .and(page.locator('[data-test-value="Story 5"]'));

    await expect(published).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(published, 'Publishing actions', 'Unpublish');

    const confirm = page.getByRole('dialog').filter({hasText: 'Confirm Unpublishing'});

    await expect(confirm).toBeVisible();
    await expect(confirm).toContainText('Are you sure you want to unpublish item "Story 5"?');
    await confirm.getByRole('button', {name: 'Confirm'}).click();

    await waitForToastMessage(page, 'success', 'Item was unpublished successfully.');

    const workingStage = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports / Working Stage"]'));
    const unpublished = workingStage.getByTestId('article-item')
        .and(page.locator('[data-test-value="Story 5"]'));

    await expect(unpublished).toBeVisible();
    await expect(unpublished.getByText('Unpublished')).toBeVisible();

    // the desk output group keeps rendering the unpublished row until the view reloads
    await page.reload();
    await monitoring.selectDeskOrWorkspace('Sports');

    // assert the group first so "row gone" is read off a rendered list
    await expect(deskOutput).toBeVisible();
    await expect(published).toBeHidden();
});

test('the ninjs sent for an update points at the item the update was created from', async ({page}) => {
    test.setTimeout(180000);

    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'publishing'});
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const output = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Sports desk output"]'));
    const articleItem = (headline: string) => output.getByTestId('article-item')
        .and(page.locator(`[data-test-value="${headline}"]`));
    const original = articleItem('test sports story');
    const firstUpdate = articleItem('test sports story update 1');
    const secondUpdate = articleItem('test sports story update 2');
    const headlineField = page.getByTestId('authoring').getByTestId('field--headline');

    await monitoring.executeActionOnMonitoringItem(
        monitoring.getArticleLocator('test sports story'),
        'Edit',
    );
    await publishOpenArticle(page, {});
    await expect(original).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(original, 'Publishing actions', 'Update');
    await setEditor3FieldValue(headlineField.getByRole('textbox'), 'test sports story update 1');
    await saveOpenArticle(page);
    await publishOpenArticle(page, {});
    await expect(firstUpdate).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(firstUpdate, 'Publishing actions', 'Update');
    await setEditor3FieldValue(headlineField.getByRole('textbox'), 'test sports story update 2');
    await saveOpenArticle(page);
    await publishOpenArticle(page, {});
    await expect(secondUpdate).toBeVisible();

    const readNinjs = async (item: Locator) =>
        JSON.parse(await readTransmittedPayload(monitoring, page, item, 'NINJS Email', 'Sports'));

    const originalNinjs = await readNinjs(original);
    const firstUpdateNinjs = await readNinjs(firstUpdate);
    const secondUpdateNinjs = await readNinjs(secondUpdate);

    expect(originalNinjs.evolvedfrom).toBeUndefined();
    expect(firstUpdateNinjs.evolvedfrom).toBe(originalNinjs.guid);

    // `evolvedfrom` follows the immediate parent, not the chain root the case expects as `original`
    expect(secondUpdateNinjs.evolvedfrom).toBe(firstUpdateNinjs.guid);
    expect(secondUpdateNinjs.evolvedfrom).not.toBe(originalNinjs.guid);
});

// Placeholder so the uncovered case stays visible next to the covered ones.
test.fixme('the ninjs sent for an update carries the guid of the root item as original', {
    annotation: [
        // Handling publish updates for Talpa (custom NINJS format with original ID)
        {type: 'confluence', description: '1335328782 blocker'},
    ],
}, async () => {
    // No formatter in the e2e backend emits `original`; the Talpa NINJS format is not registered.
});
