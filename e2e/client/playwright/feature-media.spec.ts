import {Browser, BrowserContext, Locator, Page, expect, test} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {MediaEditor} from './page-object-models/media-editor';
import {MediaUpload, mediaFixture, testFile} from './page-object-models/upload';
import {Monitoring} from './page-object-models/monitoring';
import {loginAs, restoreDatabaseSnapshot} from './utils';
import {dropArticle, dropFiles} from './utils/drag-and-drop';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case 1310851132, "Create article with image in Feature media field". Deviations from the case:
 * - Step 1: the "+" menu has no "article" entry, so the desk's default template is used (`story` on Sports).
 * - Step 6: no Save on the crop screen and no second Upload. The upload screen closes itself and the crop
 *   Save toolbar only renders while a crop is pending; Done confirms the image.
 * - Results 7 and 8 contradict: adding the association saves the article, so topbar Save stays disabled.
 * - Result 4: allowed types are covered by refusing a non-media file, not by uploading each type.
 * - Error messages are not in the case; the two "not media" refusals differ per entry point.
 */

// Uploads run through a real POST plus the server-side rendition generation, and the
// locked-item test drives a second Superdesk session. Neither fits the 30s default.
test.setTimeout(120000);

const CASE = [
    {type: 'confluence', description: '1310851132 partial'}, // Create article with image in Feature media field
];

const SOURCE_DESK = 'Sports';

const SNAPSHOT_ITEM_HEADLINE = 'test sports story';

const SNAPSHOT_PICTURE_HEADLINE = 'Rivendell picture';

// `frodobaggins` has no privileges; `samgamgee` (Sub Editor) can open an item for editing and so take its lock.
const LOCK_OWNER = {username: 'samgamgee', password: 'samgamgee'};

// No IPTC, so the upload screen's metadata pane starts empty; `metadata.jpg` would prefill headline and description.
const IMAGE_FILE = mediaFixture('empty_metadata.jpg', 'image/jpeg');

const SECOND_IMAGE_FILE = testFile('image-red.jpg', 'image/jpeg');

const NOT_MEDIA_FILE = testFile('not-a-media-file.txt', 'text/plain');

// Clicking a notification that already removed itself is acceptable, so the click gets a short timeout.
const NOTIFICATION_CLICK_TIMEOUT_MS = 2000;

/**
 * Notifications stack over the Upload media header and swallow clicks on Cancel and Upload, so the spec
 * waits for each to leave. The click shortcuts the product's own 8s removal (notify.tsx); losing that race is fine.
 */
async function expectErrorNotification(page: Page, text: string | RegExp): Promise<void> {
    const notification = page.getByTestId('notifications').getByTestId('notification--error')
        .filter({hasText: text});

    await expect(notification).toBeVisible();

    await notification.click({timeout: NOTIFICATION_CLICK_TIMEOUT_MS}).catch(() => undefined);

    await expect(notification).toBeHidden();
}

function featureMedia(page: Page): Locator {
    return new Authoring(page).associationField('feature_media');
}

function featureMediaPlaceholder(page: Page): Locator {
    return featureMedia(page).getByTestId('upload-placeholder');
}

async function createArticle(page: Page): Promise<string> {
    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace(SOURCE_DESK);

    await expect(monitoring.getArticleLocator(SNAPSHOT_ITEM_HEADLINE)).toBeVisible();

    const [response] = await Promise.all([
        page.waitForResponse((r) =>
            r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/archive'),
        ),
        monitoring.createArticleFromDefaultTemplate(),
    ]);

    expect(response.status()).toBe(201);

    await expect(page.getByTestId('authoring')).toBeVisible();

    return (await response.json())._id;
}

async function nameAndSaveArticle(page: Page, articleId: string, headline: string): Promise<void> {
    const saveButton = page.getByTestId('authoring-topbar').getByTestId('save');

    await setEditor3FieldValue(new Authoring(page).field('field--headline'), headline);

    await expect(saveButton).toBeEnabled();

    const [response] = await Promise.all([
        page.waitForResponse((r) =>
            r.request().method() === 'PATCH' && new URL(r.url()).pathname.endsWith(`/archive/${articleId}`),
        ),
        saveButton.click(),
    ]);

    expect(response.status()).toBe(200);

    await expect(saveButton).toBeDisabled();
}

async function uploadImageToFeatureMedia(
    page: Page,
    articleId: string,
    metadata: {headline: string; description: string},
): Promise<void> {
    const upload = new MediaUpload(page);
    const mediaEditor = new MediaEditor(page);

    await setEditor3FieldValue(mediaEditor.field('field--headline'), metadata.headline);
    await setEditor3FieldValue(mediaEditor.field('field--description_text'), metadata.description);

    await upload.startUpload();

    await expect(mediaEditor.header.getByRole('heading', {name: 'Edit Crops'})).toBeVisible();
    await expect(upload.getModal()).toBeHidden();

    // The backend generates the configured rendition on upload, so the crop starts clean and Done is enabled.
    await expect(mediaEditor.doneButton).toBeEnabled();

    const [response] = await Promise.all([
        page.waitForResponse((r) =>
            r.request().method() === 'PATCH' && new URL(r.url()).pathname.endsWith(`/archive/${articleId}`),
        ),
        mediaEditor.doneButton.click(),
    ]);

    expect(response.status()).toBe(200);

    await expect(mediaEditor.header).toBeHidden();
}

async function expectImageInFeatureMedia(page: Page, description: string): Promise<void> {
    const image = featureMedia(page).getByTestId('association-image');

    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', /.+/);

    // `imageTitle` is off in the Story profile, so the only textarea is the caption
    await expect(featureMedia(page).locator('textarea')).toHaveValue(description);

    await expect(featureMediaPlaceholder(page)).toHaveCount(0);
}

async function expectInGlobalSearch(page: Page, headline: string): Promise<void> {
    await page.goto('/#/search');

    // A hash-only navigation resolves before the route swaps; the still-mounted monitoring list matches too
    await expect(page.getByTestId('view-select')).toBeVisible();
    await expect(page.getByTestId('monitoring-group')).toHaveCount(0);

    await expect(page.getByTestId('article-item').filter({hasText: headline})).toHaveCount(1);
}

/**
 * `browser.newContext()` inherits the config's storageState, which would share the admin session and leave
 * the item unlocked for it, hence `storageState: undefined`.
 */
async function lockPictureAs(
    browser: Browser,
    actor: {username: string; password: string},
    pictureId: string,
): Promise<BrowserContext> {
    const context = await browser.newContext({storageState: undefined});

    // Contexts from the `browser` fixture live until the worker ends, so a leaked one keeps holding the lock.
    try {
        const page = await context.newPage();
        const monitoring = new Monitoring(page);

        await loginAs(page, actor.username, actor.password);

        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace(SOURCE_DESK);

        const picture = monitoring.getArticleLocator(SNAPSHOT_PICTURE_HEADLINE);

        await expect(picture).toBeVisible();

        const [response] = await Promise.all([
            page.waitForResponse((r) =>
                r.request().method() === 'POST'
                && new URL(r.url()).pathname.endsWith(`/archive/${pictureId}/lock`),
            ),
            monitoring.executeActionOnMonitoringItem(picture, 'Edit'),
        ]);

        expect(response.status()).toBe(201);

        return context;
    } catch (error) {
        await context.close();

        throw error;
    }
}

test('adds an image picked from a folder to Feature media and keeps it across save and reopen', {
    annotation: [
        {type: 'confluence', description: '1310851132 complete'},
    ],
}, async ({page}) => {
    const authoring = new Authoring(page);
    const monitoring = new Monitoring(page);
    const upload = new MediaUpload(page);
    const headline = 'story with a feature image';
    const metadata = {headline: 'picked feature image', description: 'picked feature image caption'};

    await restoreDatabaseSnapshot();

    const articleId = await createArticle(page);

    await expect(featureMediaPlaceholder(page)).toHaveText('Drop items here or click to upload');

    await nameAndSaveArticle(page, articleId, headline);

    await featureMediaPlaceholder(page).click();

    await expect(upload.getModal()).toBeVisible();

    const filePicker = await upload.openFilePicker();

    // `multiple` must be read before the file is handed over; Feature media allows a single file (`uniqueUpload`)
    expect(filePicker.isMultiple()).toBe(false);

    await filePicker.setFiles([IMAGE_FILE]);

    await expect(upload.getItems()).toHaveCount(1);

    // the thumbnail renders from the file's bytes, so it appears only once the file was read
    await expect(upload.getItems().locator('img')).toHaveCount(1);

    await uploadImageToFeatureMedia(page, articleId, metadata);

    await expectImageInFeatureMedia(page, metadata.description);

    await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeDisabled();

    await authoring.close();

    await expect(monitoring.getArticleLocator(headline)).toBeVisible();

    await expectInGlobalSearch(page, headline);

    await page.goto('/#/workspace/monitoring');

    await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator(headline), 'Edit');

    await expect(authoring.field('field--headline')).toHaveText(headline);
    await expectImageInFeatureMedia(page, metadata.description);
});

test('adds an image dropped on Feature media', {
    annotation: CASE,
}, async ({page}) => {
    const upload = new MediaUpload(page);
    const articleHeadline = 'story with a dropped feature image';
    const metadata = {headline: 'dropped feature image', description: 'dropped feature image caption'};

    await restoreDatabaseSnapshot();

    const articleId = await createArticle(page);

    await nameAndSaveArticle(page, articleId, articleHeadline);

    await dropFiles(featureMediaPlaceholder(page), [IMAGE_FILE]);

    await expect(upload.getModal()).toBeVisible();
    await expect(upload.getItems()).toHaveCount(1);
    await expect(upload.getItems().locator('img')).toHaveCount(1);

    await uploadImageToFeatureMedia(page, articleId, metadata);

    await expectImageInFeatureMedia(page, metadata.description);
    await expect(page.getByTestId('authoring-topbar').getByTestId('save')).toBeDisabled();
});

test('refuses more than one file dropped on Feature media', {
    annotation: CASE,
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    await createArticle(page);

    await dropFiles(featureMediaPlaceholder(page), [IMAGE_FILE, SECOND_IMAGE_FILE]);

    await expectErrorNotification(page, 'Select at most 1 file to upload.');

    await expect(featureMediaPlaceholder(page)).toBeVisible();
    await expect(new MediaUpload(page).getModal()).toHaveCount(0);
});

test('refuses a file that is not media, both dropped on the field and picked in the upload screen', {
    annotation: CASE,
}, async ({page}) => {
    const upload = new MediaUpload(page);

    await restoreDatabaseSnapshot();

    await createArticle(page);

    await dropFiles(featureMediaPlaceholder(page), [NOT_MEDIA_FILE]);

    await expectErrorNotification(page, 'Only the following media item types are allowed: image, video, audio');

    await expect(featureMediaPlaceholder(page)).toBeVisible();
    await expect(upload.getModal()).toHaveCount(0);

    await featureMediaPlaceholder(page).click();

    await expect(upload.getModal()).toBeVisible();

    await upload.selectFiles([NOT_MEDIA_FILE]);

    await expectErrorNotification(page, 'Only the following files are allowed: image, video, audio');

    await expect(upload.getItems()).toHaveCount(0);
    await expect(upload.getUploadButton()).toBeDisabled();
});

test('refuses the upload while a required metadata field is empty', {
    annotation: CASE,
}, async ({page}) => {
    const upload = new MediaUpload(page);
    const mediaEditor = new MediaEditor(page);

    await restoreDatabaseSnapshot();

    await createArticle(page);

    await featureMediaPlaceholder(page).click();

    await expect(upload.getModal()).toBeVisible();

    await upload.selectFiles([IMAGE_FILE]);

    await expect(upload.getItems()).toHaveCount(1);

    // `description_text` is required by `appConfig.validator_media_metadata` (VALIDATOR_MEDIA_METADATA in
    // e2e/server/settings.py), not by the profile
    await expect(mediaEditor.fieldContainer('field--description_text'))
        .toHaveClass(/sd-line-input--required/);

    await setEditor3FieldValue(mediaEditor.field('field--headline'), 'headline without a description');

    await upload.startUpload();

    await expectErrorNotification(page, /Required field .* is missing/);

    await expect(upload.getModal()).toBeVisible();
    await expect(upload.getItems()).toHaveCount(1);
    await expect(mediaEditor.header).toHaveCount(0);
});

test('refuses a locked item dropped on Feature media', {
    annotation: CASE,
}, async ({browser, page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot({snapshotName: 'media-items'});

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace(SOURCE_DESK);

    const picture = monitoring.getArticleLocator(SNAPSHOT_PICTURE_HEADLINE);

    await expect(picture).toBeVisible();

    // `ContentService.dropItem` re-fetches the item, so the list item's id is all the drop payload needs
    const pictureId = await picture.evaluate((element) => element.id);
    const lockOwner = await lockPictureAs(browser, LOCK_OWNER, pictureId);

    try {
        await createArticle(page);

        await dropArticle(featureMediaPlaceholder(page), {_id: pictureId, type: 'picture'});

        await expectErrorNotification(page, 'Item is locked. Cannot associate media item.');

        await expect(featureMediaPlaceholder(page)).toBeVisible();
        await expect(featureMedia(page).getByTestId('association-image')).toHaveCount(0);
    } finally {
        await lockOwner.close();
    }
});
