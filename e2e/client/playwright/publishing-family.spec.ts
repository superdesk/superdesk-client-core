import {test, expect, Locator, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, waitForToastMessage} from './utils';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

// every test here drives several publishes through the authoring view
test.setTimeout(90000);

/*
 * Publishing family: scheduling a publish, publishing a package, the desk-type gate on
 * the Publish tab, unpublishing, and what an update carries in the NINJS output.
 *
 * Expected results of the covered cases that are NOT asserted here, and why:
 *
 * 1308524953 Schedule publishing
 * - Every calendar-popup result (calendar opens on the icon, today highlighted, browsing
 *   with < and >, Cancel/Confirm in its footer). The case describes the AngularJS picker;
 *   the publish panel is React and renders superdesk-ui-framework's `DatePicker`, a
 *   primereact calendar with month/year navigators and no Cancel/Confirm buttons, so
 *   these results have no counterpart to assert.
 * - Every clock-popup result (hours one by one, minutes in 5 minute steps, current time
 *   highlighted, "In 30 min" / "In 1 hour" / "In 2 hours" shortcuts, Cancel/Confirm).
 *   `TimePickerPopover` takes its header and footer as templates and
 *   `publishing-date-options.tsx` passes neither, so the shortcut and confirm controls
 *   the case expects are not rendered at all.
 * - "At the time that was scheduled for publishing, the article label is changed from
 *   Scheduled to Published": needs real time to pass, so it is out of reach for a spec.
 * - "When a scheduled article is reopened, all data that were filled in the fields are
 *   preserved": `scheduled` is in READONLY_STATES, so the item opens read-only and the
 *   publish panel that held the values cannot be reopened. That the entered schedule was
 *   persisted is asserted through the list row's scheduled time instead.
 * - "publishing does not go through with required fields empty" is asserted by
 *   publishing.validation.spec.ts and not repeated here.
 * - "Scheduled or published article can be found in Global search" is not asserted.
 * - The unsaved-changes dialog is driven but its wording differs from the case: publishing
 *   from the panel goes through `beforeSend`, which raises `confirmSendTo` ("save and
 *   send"), not the "Save and publish" dialog the case describes.
 *
 * 1308524959 Publish package
 * - `hightlights.spec.ts` ("publishing a highlights package") overlaps in part: it publishes
 *   the same package, but asserts only the package row reaching the desk output, not the
 *   item the package contains.
 * - The package used is "Package Highlight 1", the only package in a committed snapshot
 *   that can be published as it stands: it carries the Story profile, which declares no
 *   required field, while `media-items`' "Shire package" carries the Package profile, which
 *   requires a headline, a slugline and a subject. That it also belongs to a highlight has
 *   no bearing on the publish itself.
 * - "Click on Publish package and items": no such button exists. The publish panel offers
 *   only Publish and Publish from (`publish-action.tsx`); publishing a package publishes
 *   the items it contains from the plain Publish button, which is what is asserted.
 * - "When a published package is reopened, all items contained in the package are
 *   preserved": the read-only package view (`sd-package-ref.html` via `sd-package`) is a
 *   different template from the editable one and carries no test ids, so there is nothing
 *   to address the contained items by once the package is published.
 * - "When an article of a published package is opened, all data are preserved" and
 *   "Published package can be found in Global search" are not asserted.
 * - the empty-required-fields result: see above, publishing.validation.spec.ts.
 *
 * 1310851134 Publishing depending on desk type
 * - The authoring-desk half only holds when `features.noPublishOnAuthoringDesk` is on:
 *   `canPublish` (scripts/api/article.ts) withholds publishing on an authoring desk only
 *   under that flag, and the e2e client config does not set it. The test turns it on.
 *
 * 1344444004 Unpublishing
 * - "the image stays as Published with an extra (red) label 'used'": no item in any
 *   committed snapshot carries `associations`, so an item with an image in its body would
 *   have to be built first, which this batch does not do.
 *
 * 1335328782 Handling publish updates for Talpa
 * - The custom Talpa NINJS format is not registered in the e2e backend. Its formatters are
 *   superdesk-core's stock set and none of them emits an `original` field, so the case's
 *   expected results on `original` cannot hold as they stand: not for the root item, not
 *   for an update, and not for the duplicate branch (Case2) either. The spec asserts that
 *   `original` is absent from all three payloads, which pins the current gap rather than
 *   covering the case: those assertions are expected to fail once a Talpa-style format is
 *   registered, and both the spec and its annotation have to be updated then.
 * - What the stock NINJS formatter does emit for an update is `evolvedfrom`, set to
 *   `rewrite_of`, and that is asserted here: it shows the output pointing at the immediate
 *   parent rather than at the root of the chain, which is the gap the case asks to close.
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

/**
 * Opens the publish panel of the open article and publishes without targeting a
 * subscriber, so every subscriber whose products match receives the item.
 *
 * Setting a publish schedule writes it onto the article through `on-data-change="autosave"`
 * and so leaves the article dirty, which is why that branch also has to answer the
 * unsaved-changes prompt `beforeSend` raises for a dirty article.
 *
 * The toast is waited out rather than only waited for, because `notify` drops a message
 * that is already on screen, so a following publish would raise no toast of its own.
 */
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

/**
 * Saves the open article from the topbar and waits for the write to land.
 *
 * The Save button is disabled both while the request is in flight and once the article is
 * clean again, so waiting for the PATCH is what separates the two.
 */
async function saveOpenArticle(page: Page): Promise<void> {
    const saveButton = page.getByTestId('authoring-topbar').getByTestId('save');

    const [response] = await Promise.all([
        page.waitForResponse((res) => res.request().method() === 'PATCH' && res.url().includes('/archive/')),
        saveButton.click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(saveButton).toBeDisabled();
}

/**
 * Types a date and a time into the Publish schedule fields of the open publish panel.
 *
 * The date field is a primereact calendar input that parses free text against
 * `view.dateformat`. The only runtime handle on that format is the input's placeholder,
 * which `DatePicker` derives from the configured format by lowercasing its tokens, so the
 * value is built from the placeholder rather than pinned to one configuration.
 *
 * The date has to be typed key by key: primereact's Calendar ignores an `input` event that
 * was not preceded by a `keydown` (`onUserInput` returns early unless `isKeydown` is set),
 * so `fill()` would only change what the field shows, leave the model on its old value and
 * have the display snap back on blur. Escape then closes the overlay that focusing the
 * field opened, which otherwise covers the rest of the panel.
 *
 * The date goes in before the time because `DateTimePicker` keeps one Date for both fields
 * and defaults the missing half to "now": setting the time first would schedule the item
 * for today, which is in the past for most of the day.
 *
 * Typing and checking are retried as a unit because a keystroke can be dropped while the
 * picker re-renders, which leaves a string the calendar cannot parse and so no date on the
 * model at all: the field then shows today, the date the time falls back onto.
 */
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

/**
 * Changes a desk's type from the desks settings and waits for the write to land.
 *
 * The modal closes on click regardless of the request, and the caller reloads to pick the
 * new desk type up, so without waiting for the PATCH the reload can read the old value.
 */
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

/**
 * Reads the payload one subscriber was sent for a published item, through the item
 * history's transmission details, which render the queue entry's `formatted_item`
 * verbatim.
 *
 * Both subscribers of the `publishing` snapshot receive every untargeted publish, so the
 * entry is picked by destination rather than by position.
 *
 * The payload opens in a modal that would cover the item list and whose only dismiss
 * control is an unnamed icon link, so the page is reloaded to clear it. The desk is
 * re-selected afterwards so callers get the monitoring view back as they left it.
 */
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

    // the payload is rendered into a modal that is appended to the body rather than into
    // the preview, so it is addressed from the page
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

        await section.getByRole('button', {name: 'Clear'}).click();

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

        await publishOpenArticle(page, {publishSchedule: inTwoDaysAtTen()});

        const deskOutput = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports desk output"]'));
        const scheduled = deskOutput.getByTestId('article-item')
            .and(page.locator('[data-test-value="test sports story"]'));

        await expect(scheduled).toBeVisible();
        await expect(scheduled.getByText('Scheduled')).toBeVisible();
        await expect(scheduled.getByTitle(/^Article is scheduled for /)).toBeVisible();

        await scheduled.dblclick();

        const topbar = page.getByTestId('authoring-topbar');

        await expect(topbar).toBeVisible();
        await topbar.getByRole('button', {name: 'Deschedule'}).click();

        const workingStage = page.getByTestId('monitoring-group')
            .and(page.locator('[data-test-value="Sports / Working Stage"]'));

        await expect(
            workingStage.getByTestId('article-item').and(page.locator('[data-test-value="test sports story"]')),
        ).toBeVisible();

        // the group is asserted first so that the row being gone is read off a rendered
        // list rather than off a monitoring view that has not come back yet
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
    /*
     * `canPublish` only withholds the Publish tab on an authoring desk when this flag is
     * on (scripts/api/article.ts). The e2e client config leaves it unset, so without the
     * override an authoring desk would offer the tab like any other.
     */
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

        // the desks store is populated once per application load, so the new desk type
        // only reaches `canPublish` after a full reload
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

    // the working stage picks the item up on its own, but the desk output group keeps
    // rendering the row it no longer holds until the view is loaded again
    await page.reload();
    await monitoring.selectDeskOrWorkspace('Sports');

    // the group is asserted first so that the row being gone is read off a rendered list
    await expect(deskOutput).toBeVisible();
    await expect(published).toBeHidden();
});

test('the ninjs sent for an update points at the item the update was created from', {
    annotation: [
        // Handling publish updates for Talpa (custom NINJS format with original ID)
        {type: 'confluence', description: '1335328782 partial'},
    ],
}, async ({page}) => {
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

    // the link moves on with every update: nothing in the payload keeps pointing at the
    // root of the chain, which is the `original` field the case asks for
    expect(secondUpdateNinjs.evolvedfrom).toBe(firstUpdateNinjs.guid);
    expect(secondUpdateNinjs.evolvedfrom).not.toBe(originalNinjs.guid);

    // no stock formatter emits `original`, so these three pin the gap the case is about and
    // are expected to fail once a Talpa-style format is registered: the spec and the case
    // annotation have to be updated then
    expect(originalNinjs.original).toBeUndefined();
    expect(firstUpdateNinjs.original).toBeUndefined();
    expect(secondUpdateNinjs.original).toBeUndefined();
});
