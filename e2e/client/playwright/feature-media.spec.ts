import {Browser, BrowserContext, Locator, Page, expect, test} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {MediaEditor} from './page-object-models/media-editor';
import {MediaUpload, mediaFixture, testFile} from './page-object-models/upload';
import {Monitoring} from './page-object-models/monitoring';
import {loginAs, restoreDatabaseSnapshot} from './utils';
import {dropArticle, dropFiles} from './utils/drag-and-drop';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case 1310851132, "Create article with image in Feature media field": adding an
 * image to the Feature media field of a new article, both by picking it from a
 * folder and by dropping it on the field, and what the field refuses.
 *
 * Product behaviour that diverges from the case's wording, asserted as the product
 * renders it:
 *
 * - The case has step 1 pick "article" from the "+" menu. The menu has no such
 *   entry; it offers the desk's default template, which on Sports is `story` and
 *   carries the Story profile the Feature media field is enabled on.
 * - Step 6 has the user click Save on the Edit crops screen and then Upload on the
 *   Upload media screen again. Neither click exists here: the Upload media screen
 *   closes itself as soon as the upload resolves, and the crop screen's Save toolbar
 *   is only rendered while a crop is pending, which it never is for a freshly
 *   uploaded image (see `uploadImageToFeatureMedia`). Done alone confirms the image.
 * - Expected result 7 ("Save button is active after an image was uploaded") carries
 *   a question mark in the case and contradicts result 8. Result 8 is what the
 *   product does: `AssociationController.updateItemAssociation` calls the article's
 *   own save for an unpublished item, so the article is saved and the topbar Save
 *   button is left disabled. Both are covered by asserting that.
 * - The case quotes none of the error messages. They are asserted as the product
 *   words them, which for the two "not a media file" refusals is two different
 *   messages, one per entry point: the field's own drop handler
 *   (`ItemAssociationDirective`) and the upload screen (`UploadController`).
 *
 * Step 5's "link to Edit crops test cases" delegates the crop screen's own
 * behaviour to other cases; here the screen is only taken as far as confirming the
 * image, which is what this case's own expected results are about.
 *
 * Expected result 4 names image, video and audio as the allowed types. Every step of
 * the case uses an image, so the allowed set is covered by refusing a file that is
 * none of the three and by the refusal naming all three, not by uploading one of
 * each into the field.
 *
 * The case id is on every test: `complete` on the one that walks the whole
 * documented flow, `partial` on the tests that add a single refusal each.
 */

// Uploads run through a real POST plus the server-side rendition generation, and the
// locked-item test drives a second Superdesk session. Neither fits the 30s default.
test.setTimeout(120000);

const CASE = [
    {type: 'confluence', description: '1310851132 partial'}, // Create article with image in Feature media field
];

const SOURCE_DESK = 'Sports';

/** An item that exists in the `main` snapshot, used to tell "empty" from "not loaded yet". */
const SNAPSHOT_ITEM_HEADLINE = 'test sports story';

/** The picture the `media-items` snapshot carries, dropped on the field as an existing item. */
const SNAPSHOT_PICTURE_HEADLINE = 'Rivendell picture';

/**
 * `samgamgee` holds the `Sub Editor` role, which is what lets it open an item for
 * editing and so take the lock the drop is expected to be refused over.
 * `frodobaggins` holds no privileges at all and cannot even reach monitoring.
 */
const LOCK_OWNER = {username: 'samgamgee', password: 'samgamgee'};

/**
 * `empty_metadata.jpg` carries no IPTC, so the upload screen's metadata pane starts
 * empty and the refusal of an empty required field is reachable. `metadata.jpg`
 * next to it in `fixtures/` would prefill headline and description.
 */
const IMAGE_FILE = mediaFixture('empty_metadata.jpg', 'image/jpeg');

const SECOND_IMAGE_FILE = testFile('image-red.jpg', 'image/jpeg');

const NOT_MEDIA_FILE = testFile('not-a-media-file.txt', 'text/plain');

/**
 * Clicking a notification that has already removed itself is an accepted outcome,
 * so the click is given just enough time to land rather than a full assertion budget.
 */
const NOTIFICATION_CLICK_TIMEOUT_MS = 2000;

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

/** The button the empty Feature media field is, and the field's drop target. */
function featureMediaPlaceholder(page: Page): Locator {
    return featureMedia(page).getByTestId('upload-placeholder');
}

/**
 * Opens Sports monitoring, waits for the list to hold the item the snapshot puts
 * there and creates an article from the desk's default template.
 *
 * The id comes off the response that created the article, and is what the article's
 * own writes are told apart from the uploaded image's further down.
 */
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

/** Types a headline into the opened article and saves it through the topbar. */
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

/**
 * Drives the Upload media screen the Feature media field opened, from the file it
 * already holds to the image sitting in the field.
 *
 * The article write the crop screen triggers is awaited rather than assumed: the
 * association is stored by saving the article, and the callers go on to close it or
 * to read it back.
 */
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

    /*
     * The crop screen opens with the crop already set: the backend generates the one
     * rendition the `crop_sizes` vocabulary configures while the file is uploaded, so
     * the crop widget's initial selection matches what the item already carries,
     * `crops.isDirty` never goes up and Done is available straight away.
     */
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

/** The image sitting in the Feature media field, and the caption typed for it. */
async function expectImageInFeatureMedia(page: Page, description: string): Promise<void> {
    const image = featureMedia(page).getByTestId('association-image');

    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', /.+/);

    // the field renders one textarea, the caption, because `imageTitle` is off in the
    // Story profile and the title textarea is `ng-if`-ed out with it
    await expect(featureMedia(page).locator('textarea')).toHaveValue(description);

    await expect(featureMediaPlaceholder(page)).toHaveCount(0);
}

/**
 * Asserts the article is reachable from global search. The article list is read as
 * it comes up, without querying by any search field.
 */
async function expectInGlobalSearch(page: Page, headline: string): Promise<void> {
    await page.goto('/#/search');

    // a hash-only navigation resolves before the route swaps, and the monitoring list
    // still mounted behind it holds the very item counted below, so the search view
    // has to be waited for on its own first
    await expect(page.getByTestId('view-select')).toBeVisible();
    await expect(page.getByTestId('monitoring-group')).toHaveCount(0);

    await expect(page.getByTestId('article-item').filter({hasText: headline})).toHaveCount(1);
}

/**
 * Logs the second actor in and opens the snapshot's picture for editing, which is
 * what takes the lock the drop under test is refused over. The context is handed
 * back for the caller to close.
 *
 * `browser.newContext()` inherits the committed storageState from the config, which
 * would put both pages in the same Superdesk session and so leave the item unlocked
 * for the admin one. `storageState: undefined` forces a clean context that
 * authenticates into a session of its own.
 */
async function lockPictureAs(
    browser: Browser,
    actor: {username: string; password: string},
    pictureId: string,
): Promise<BrowserContext> {
    const context = await browser.newContext({storageState: undefined});

    /*
     * The caller can only close this context once it is handed back, so anything
     * that throws before the return has to close it here. Contexts made from the
     * `browser` fixture are not auto-closed until the worker ends, and a leaked one
     * means a live second Superdesk session holding the lock for every later test.
     */
    try {
        const page = await context.newPage();
        const monitoring = new Monitoring(page);

        await loginAs(page, actor.username, actor.password);

        await page.goto('/#/workspace/monitoring');

        await monitoring.selectDeskOrWorkspace(SOURCE_DESK);

        const picture = monitoring.getArticleLocator(SNAPSHOT_PICTURE_HEADLINE);

        await expect(picture).toBeVisible();

        // the lock is what the other session has to see, so the request that takes it
        // is awaited rather than the editor it opens
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

    /*
     * The file dialog is the only handle on how many files may be picked, and it has
     * to be read before the file is handed over. Feature media is not a vocabulary
     * field, so `AssociationController.uploadAndCropImages` allows exactly one file
     * and opens the screen with `uniqueUpload`, under which upload.html renders the
     * input without `multiple`.
     */
    expect(filePicker.isMultiple()).toBe(false);

    await filePicker.setFiles([IMAGE_FILE]);

    await expect(upload.getItems()).toHaveCount(1);

    // the thumbnail is rendered from the picked file's own bytes, so it only shows
    // once the file was read, not merely once an item was added
    await expect(upload.getItems().locator('img')).toHaveCount(1);

    await uploadImageToFeatureMedia(page, articleId, metadata);

    await expectImageInFeatureMedia(page, metadata.description);

    // adding the association saved the article on its own, so nothing is left to save
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

    // the field hands the dropped file straight to the upload screen, which comes up
    // holding it rather than empty
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

    // the field is still the empty placeholder, and no upload was started for either file
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

    /*
     * The red star is the `sd-line-input--required` class, put on a field's wrapper
     * from `field.required` in media-metadata-editor-directive.html.
     * `MediaFieldsController` builds those fields by merging the picture content
     * profile's schema over its editor, and adds an entry from
     * `appConfig.validator_media_metadata` only for fields the profile's editor does
     * not already carry. `description_text` is one of those, and the validator
     * (VALIDATOR_MEDIA_METADATA in e2e/server/settings.py, published to the client
     * through /api/client_config) marks it required.
     */
    await expect(mediaEditor.fieldContainer('field--description_text'))
        .toHaveClass(/sd-line-input--required/);

    await setEditor3FieldValue(mediaEditor.field('field--headline'), 'headline without a description');

    await upload.startUpload();

    await expectErrorNotification(page, /Required field .* is missing/);

    // nothing was uploaded: the screen still holds the file, and the crop screen that
    // a finished upload opens never came up
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

    // the list item carries the article id, which is all the drop payload needs:
    // `ContentService.dropItem` re-fetches the item from the API
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
