import {Locator, Page, expect} from '@playwright/test';
import {Monitoring} from '../page-object-models/monitoring';
import {MediaUpload} from '../page-object-models/upload';
import {MediaEditor} from '../page-object-models/media-editor';
import {Authoring} from '../page-object-models/authoring';
import {setEditor3FieldValue} from './editor3';

/**
 * Helpers shared by the two media upload specs. The QA cases behind them document
 * one and the same set of expected results for every media type and for both ways
 * of adding files, so everything except adding the files themselves is written
 * once here and the specs stay a list of what each case adds.
 */

/** The desk the Upload media screen is opened from, and which nothing is uploaded to. */
const SOURCE_DESK = 'Sports';

/** The desk every upload is retargeted at, to prove the desk select takes effect. */
const TARGET_DESK = 'Education';

/** An item that exists in the `main` snapshot, used to tell "empty" from "not loaded yet". */
const SNAPSHOT_ITEM_HEADLINE = 'test sports story';

/**
 * Clicking a notification that has already removed itself is an accepted outcome,
 * so the click is given just enough time to land rather than a full assertion budget.
 */
const NOTIFICATION_CLICK_TIMEOUT_MS = 2000;

function workingStage(page: Page, desk: string): Locator {
    return page.getByTestId('monitoring-group')
        .and(page.locator(`[data-test-value="${desk} / Working Stage"]`));
}

/**
 * Monitoring renders a row's item type as an icon, and swaps that icon for the
 * multi-select checkbox while the row is hovered. Whatever was clicked last (a desk
 * option, a modal button) leaves the pointer parked over the list the click closed,
 * so it has to be moved away before any assertion that reads a type icon.
 */
export async function movePointerOffTheList(page: Page): Promise<void> {
    await page.mouse.move(0, 0);
}

/**
 * Asserts an error notification came up, then waits for it to be gone.
 *
 * Only the first assertion states product behaviour. The rest is synchronisation:
 * notifications stack on top of the Upload media screen's header, where they swallow
 * clicks on Cancel and Upload, so the spec may not go on until this one has left.
 * The click is a shortcut to the product's own removal after 8 seconds
 * (`messageDisplayDurationsByType.error` in scripts/core/notify/notify.tsx); if that
 * removal wins the race the click has nothing to hit, which is the same outcome.
 */
export async function expectErrorNotification(page: Page, text: string | RegExp): Promise<void> {
    const notification = page.getByTestId('notifications').getByTestId('notification--error')
        .filter({hasText: text});

    await expect(notification).toBeVisible();

    await notification.click({timeout: NOTIFICATION_CLICK_TIMEOUT_MS}).catch(() => undefined);

    await expect(notification).toBeHidden();
}

/**
 * Opens Monitoring on the source desk and brings up the Upload media screen from
 * the create menu.
 */
export async function openUploadScreen(page: Page): Promise<void> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace(SOURCE_DESK);

    // the group has to have rendered before the screen covers it, otherwise a later
    // count of what the desk holds cannot tell "nothing" from "not loaded yet"
    await expect(
        workingStage(page, SOURCE_DESK).getByTestId('article-item')
            .filter({hasText: SNAPSHOT_ITEM_HEADLINE}),
    ).toBeVisible();

    await monitoring.openMediaUploadView();

    await expect(new MediaUpload(page).getModal()).toBeVisible();
}

/**
 * The Upload media screen as it opens, before any file is added: the drop area and
 * its prompt, the way in to the file dialog, the Metadata pane, both header
 * buttons, the desk select defaulting to the desk the screen was opened from, and
 * Upload disabled while there is nothing to upload.
 */
export async function expectEmptyUploadScreen(page: Page): Promise<void> {
    const upload = new MediaUpload(page);

    await expect(upload.getDropArea()).toBeVisible();
    await expect(upload.getModal().getByTestId('drag-files-here')).toBeVisible();
    await expect(upload.getModal().getByTestId('select-file-button')).toBeVisible();
    await expect(upload.getModal().getByRole('heading', {name: 'Metadata', exact: true})).toBeVisible();
    await expect(upload.getCancelButton()).toBeEnabled();
    await expect(upload.getSelectedDesk()).toContainText(SOURCE_DESK);
    await expect(upload.getItems()).toHaveCount(0);
    await expect(upload.getUploadButton()).toBeDisabled();
}

/**
 * The screen once `count` files have been added: the prompt gives way to the items,
 * Upload becomes available and the Metadata pane edits all of them at once, which
 * is what lets a single fill reach every file.
 */
export async function expectFilesReadyToUpload(page: Page, count: number): Promise<void> {
    const upload = new MediaUpload(page);

    await expect(upload.getItems()).toHaveCount(count);
    await expect(upload.getModal().getByTestId('drag-files-here')).toBeHidden();
    await expect(upload.getUploadButton()).toBeEnabled();

    // the template says "items" whatever the count, so a single file reads the same way
    await expect(upload.getModal()).toContainText(`Currently editing: ${count} items`);
}

/**
 * Asserts how many pending items of each media type the screen holds, keyed by the
 * icon class `getIconForItemType` puts on them.
 *
 * A pending item has no server-side rendition to show, so apart from an image, which
 * is previewed from its own bytes, the icon is the screen's only statement of what it
 * took the file for. The icon has a test id but no test value, so the class it is
 * chosen by is what the assertion has to read.
 */
export async function expectPendingItemTypes(
    page: Page,
    countsByIcon: Record<string, number>,
): Promise<void> {
    const upload = new MediaUpload(page);

    for (const [icon, count] of Object.entries(countsByIcon)) {
        await expect(
            upload.getItems().getByTestId('media-grid-item-type').and(page.locator(`.${icon}`)),
        ).toHaveCount(count);
    }
}

/**
 * Types the metadata every uploaded item is expected to carry. Files land selected,
 * so one fill reaches all of them.
 */
async function fillSharedMetadata(
    page: Page,
    metadata: {headline: string; description: string},
): Promise<void> {
    const mediaEditor = new MediaEditor(page);

    await setEditor3FieldValue(mediaEditor.field('field--headline'), metadata.headline);
    await setEditor3FieldValue(mediaEditor.field('field--description_text'), metadata.description);
}

/**
 * The items an upload put on the target desk, identified by the headline typed
 * before the upload.
 */
function uploadedItems(page: Page, headline: string): Locator {
    return workingStage(page, TARGET_DESK).getByTestId('article-item').filter({hasText: headline});
}

/**
 * Items of one media type anywhere in the list currently rendered. The `main`
 * snapshot carries no audio and no video item, so a non-zero count of either can
 * only come from something this run uploaded.
 */
export function itemsOfType(page: Page, type: string): Locator {
    return page.getByTestId('article-item').filter({
        has: page.getByTestId('type-icon').and(page.locator(`[data-test-value="${type}"]`)),
    });
}

/**
 * Switches to the target desk and asserts the upload landed there as the expected
 * item types, one entry per uploaded file.
 */
async function expectItemsOnTargetDesk(
    page: Page,
    headline: string,
    itemTypes: Array<string>,
): Promise<void> {
    await new Monitoring(page).selectDeskOrWorkspace(TARGET_DESK);
    await movePointerOffTheList(page);

    const items = uploadedItems(page, headline);

    await expect(items).toHaveCount(itemTypes.length);

    for (const type of new Set(itemTypes)) {
        await expect(
            items.getByTestId('type-icon').and(page.locator(`[data-test-value="${type}"]`)),
        ).toHaveCount(itemTypes.filter((itemType) => itemType === type).length);
    }
}

/**
 * Opens every uploaded item in authoring and asserts it kept the metadata entered
 * before the upload.
 *
 * The uploaded items share a `versioncreated` second and are indistinguishable in
 * the list whenever they were given the same metadata, while opening one locks it
 * and closing it unlocks it, either of which re-queries the group and can re-sort
 * it. The ids are therefore read once, up front, and each item is addressed by its
 * own id rather than by a position that may have moved.
 */
async function expectMetadataPreserved(
    page: Page,
    headline: string,
    metadata: {headline: string; description: string},
    count: number,
): Promise<void> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);
    const itemIds: Array<string> = await uploadedItems(page, headline)
        .evaluateAll((items) => items.map((item) => item.id));

    // without this a mis-read of the ids would leave the loop below silently opening nothing
    expect(itemIds).toHaveLength(count);

    for (const itemId of itemIds) {
        const item = uploadedItems(page, headline).and(page.locator(`[id="${itemId}"]`));

        await monitoring.executeActionOnMonitoringItem(item, 'Edit');

        await expect(authoring.field('field--headline')).toHaveText(metadata.headline);
        await expect(authoring.field('field--description_text')).toHaveText(metadata.description);

        await authoring.close();
    }
}

/**
 * Asserts the uploaded items are reachable from global search. The article list is
 * read as it comes up, without querying by any search field.
 */
async function expectInGlobalSearch(page: Page, headline: string, count: number): Promise<void> {
    await page.goto('/#/search');

    // a hash-only navigation resolves before the route swaps, and the monitoring list
    // still mounted behind it holds the very items counted below, so the search view
    // has to be waited for on its own first
    await expect(page.getByTestId('view-select')).toBeVisible();
    await expect(page.getByTestId('monitoring-group')).toHaveCount(0);

    await expect(page.getByTestId('article-item').filter({hasText: headline})).toHaveCount(count);
}

/**
 * Everything the QA cases expect of an upload once the files are on the screen:
 * the desk is switched, the metadata every item must carry is typed, Upload closes
 * the screen, and the files turn up on the picked desk as the expected item types,
 * keep their metadata in authoring and are reachable from global search.
 *
 * With `withProgressCircles` the upload runs against held back archive responses so
 * the per-file progress circles can be counted as they appear; see
 * `MediaUpload.holdArchiveRequests` for why that is what makes them observable.
 */
export async function expectUploadToTargetDesk(page: Page, options: {
    fileCount: number;
    itemTypes: Array<string>;
    metadata: {headline: string; description: string};
    withProgressCircles?: boolean;
}): Promise<void> {
    const upload = new MediaUpload(page);

    await upload.selectDesk(TARGET_DESK);

    await fillSharedMetadata(page, options.metadata);

    // the single fill has to have reached every item, or the assertions further down
    // would be proving the metadata of one file while the rest went up without any
    await expect(upload.getItems().getByTestId('media-grid-item-headline'))
        .toHaveText(Array(options.fileCount).fill(options.metadata.headline));

    if (options.withProgressCircles === true) {
        await uploadWithProgressCircles(page, options.fileCount);
    } else {
        await upload.startUpload();

        await expect(upload.getModal()).toBeHidden();
    }

    await expectItemsOnTargetDesk(page, options.metadata.headline, options.itemTypes);
    await expectMetadataPreserved(page, options.metadata.headline, options.metadata, options.fileCount);
    await expectInGlobalSearch(page, options.metadata.headline, options.fileCount);
}

/**
 * Uploads the files already on the screen, releasing the held back archive requests
 * one by one so that the progress circle each file draws when its own upload is
 * answered can be counted as it appears.
 */
async function uploadWithProgressCircles(page: Page, fileCount: number): Promise<void> {
    const upload = new MediaUpload(page);
    const releaseUploads = await upload.holdArchiveRequests('POST', fileCount);
    const releaseMetadataUpdates = await upload.holdArchiveRequests('PATCH', fileCount);

    await upload.startUpload();

    // no file has been answered yet, so no item has left zero progress
    await expect(upload.getProgressIndicators()).toHaveCount(0);

    for (const index of Array(fileCount).keys()) {
        releaseUploads[index]();

        await expect(upload.getProgressIndicators()).toHaveCount(index + 1);
    }

    for (const release of releaseMetadataUpdates) {
        release();
    }

    await expect(upload.getModal()).toBeHidden();

    await upload.stopHoldingArchiveRequests('POST');
    await upload.stopHoldingArchiveRequests('PATCH');
}
