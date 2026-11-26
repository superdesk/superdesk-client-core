import {Browser, BrowserContext, Locator, Page, expect, test} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {MediaEditor} from './page-object-models/media-editor';
import {MediaUpload, mediaFixture, testFile} from './page-object-models/upload';
import {Monitoring} from './page-object-models/monitoring';
import {expectErrorNotification, loginAs, restoreDatabaseSnapshot} from './utils';
import {dropFiles} from './utils/drag-and-drop';
import {setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

/**
 * QA case 1310851132 "Create article with image in Feature media field" and 1344444010 "Media
 * functionality for Body Editor3" on authoring-react, where both are the same `media` field type:
 * `feature_media` on the Story profile and the "Shire gallery" custom media field of
 * `association-fields`. Unlike angular, adding media does not save the article; the topbar Save
 * stores it.
 */
test.use({storageState: getStorageState({}, {authoringReact: true})});

// Uploads (real POST plus rendition generation) and the second-session lock test exceed the 30s default.
test.setTimeout(120000);

const FEATURE_MEDIA_CASE = [{type: 'confluence', description: '1310851132 complete'}];

// No IPTC, so the upload screen's metadata pane starts empty.
const IMAGE_FILE = mediaFixture('empty_metadata.jpg', 'image/jpeg');
const SECOND_IMAGE_FILE = testFile('image-red.jpg', 'image/jpeg');
const NOT_MEDIA_FILE = testFile('not-a-media-file.txt', 'text/plain');

function mediaField(page: Page, fieldId: string): Locator {
    return new Authoring(page).fieldContainer(fieldId);
}

function placeholder(field: Locator): Locator {
    return field.getByTestId('drop-zone-placeholder');
}

function carouselImage(field: Locator): Locator {
    return field.getByTestId('media-carousel-image');
}

async function openArticle(page: Page, headline: string): Promise<void> {
    const monitoring = new Monitoring(page);

    await monitoring.openMonitoringForDesk('Sports');
    await monitoring.editItem(monitoring.getArticleLocator(headline), page.getByTestId('authoring'));
    await new Authoring(page).waitForAuthoringReactToInitialize();
}

async function createArticle(page: Page): Promise<void> {
    const monitoring = new Monitoring(page);

    await monitoring.openMonitoringForDesk('Sports');
    await monitoring.createArticleFromDefaultTemplate();
    await expect(page.getByTestId('authoring')).toBeVisible();
    await new Authoring(page).waitForAuthoringReactToInitialize();
}

async function uploadWithMetadata(page: Page, metadata: {headline: string; description: string}): Promise<void> {
    const upload = new MediaUpload(page);
    const mediaEditor = new MediaEditor(page);

    await expect(upload.getItems().locator('img')).toHaveCount(1);
    await setEditor3FieldValue(mediaEditor.field('field--headline'), metadata.headline);
    await setEditor3FieldValue(mediaEditor.field('field--description_text'), metadata.description);
    await upload.startUpload();

    // Unlike angular, authoring-react adds the upload straight away, without the Edit Crops step.
    await expect(upload.getModal()).toBeHidden();
}

async function lockAs(
    browser: Browser,
    actor: {username: string; password: string},
    headline: string,
): Promise<BrowserContext> {
    const context = await browser.newContext({storageState: undefined});

    // Contexts from the `browser` fixture live until the worker ends, so a leaked one keeps holding the lock.
    try {
        const page = await context.newPage();
        const monitoring = new Monitoring(page);

        await loginAs(page, actor.username, actor.password);
        await monitoring.openMonitoringForDesk('Sports');

        const [response] = await Promise.all([
            page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith('/lock')),
            monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator(headline), 'Edit'),
        ]);

        expect(response.status()).toBe(201);

        return context;
    } catch (error) {
        await context.close();

        throw error;
    }
}

test.describe('Feature media (authoring-react)', () => {
    test('adds an image picked from a folder and keeps it across save and reopen', {
        annotation: FEATURE_MEDIA_CASE,
    }, async ({page}) => {
        const upload = new MediaUpload(page);
        const featureMedia = mediaField(page, 'feature_media');
        const headline = 'story with a feature image';
        const metadata = {headline: 'picked feature image', description: 'picked feature image caption'};

        await restoreDatabaseSnapshot();
        await createArticle(page);

        await setEditor3FieldValue(new Authoring(page).fieldContainer('headline').getByRole('textbox'), headline);

        await expect(placeholder(featureMedia)).toHaveText('Drop items here or click to upload');

        const [filePicker] = await Promise.all([
            page.waitForEvent('filechooser'),
            placeholder(featureMedia).click(),
        ]);

        // Feature media holds a single item.
        expect(filePicker.isMultiple()).toBe(false);
        await filePicker.setFiles([IMAGE_FILE]);

        await expect(upload.getModal()).toBeVisible();
        await expect(upload.getItems()).toHaveCount(1);

        await uploadWithMetadata(page, metadata);

        await expect(carouselImage(featureMedia)).toBeVisible();
        await expect(featureMedia).toContainText(metadata.headline);
        await expect(placeholder(featureMedia)).toHaveCount(0);

        await new Authoring(page).saveAndClose();
        await openArticle(page, headline);

        await expect(carouselImage(featureMedia)).toBeVisible();
        await expect(featureMedia).toContainText(metadata.headline);
        await expect(featureMedia.getByLabel('Description')).toHaveValue(metadata.description);
    });

    test('adds an image dropped on the field', {
        annotation: FEATURE_MEDIA_CASE,
    }, async ({page}) => {
        const upload = new MediaUpload(page);
        const featureMedia = mediaField(page, 'feature_media');
        const metadata = {headline: 'dropped feature image', description: 'dropped feature image caption'};

        await restoreDatabaseSnapshot();
        await openArticle(page, 'test sports story');

        await dropFiles(placeholder(featureMedia), [IMAGE_FILE]);

        await expect(upload.getModal()).toBeVisible();
        await expect(upload.getItems()).toHaveCount(1);

        await uploadWithMetadata(page, metadata);

        await expect(carouselImage(featureMedia)).toBeVisible();

        await new Authoring(page).saveAndClose();
        await openArticle(page, 'test sports story');

        await expect(carouselImage(featureMedia)).toBeVisible();
        await expect(featureMedia).toContainText(metadata.headline);
    });

    // React gap: the drop opens an empty Upload media dialog instead of refusing the files with an error.
    test.fixme('refuses more than one file dropped on the field', {
        annotation: FEATURE_MEDIA_CASE,
    }, async ({page}) => {
        const featureMedia = mediaField(page, 'feature_media');

        await restoreDatabaseSnapshot();
        await openArticle(page, 'test sports story');

        await dropFiles(placeholder(featureMedia), [IMAGE_FILE, SECOND_IMAGE_FILE]);

        await expectErrorNotification(page, 'Select at most 1 file to upload.');

        await expect(placeholder(featureMedia)).toBeVisible();
        await expect(new MediaUpload(page).getModal()).toHaveCount(0);
    });

    // React gap: the drop opens an empty Upload media dialog instead of refusing the file with an error.
    test.fixme('refuses a file that is not media dropped on the field', {
        annotation: FEATURE_MEDIA_CASE,
    }, async ({page}) => {
        const featureMedia = mediaField(page, 'feature_media');

        await restoreDatabaseSnapshot();
        await openArticle(page, 'test sports story');

        await dropFiles(placeholder(featureMedia), [NOT_MEDIA_FILE]);

        await expectErrorNotification(page, /Only the following .*types are allowed: image, video, audio/);

        await expect(placeholder(featureMedia)).toBeVisible();
        await expect(new MediaUpload(page).getModal()).toHaveCount(0);
    });

    // React gap: a picture locked by another user is added to the field; angular refuses it.
    test.fixme('refuses a locked picture dropped on the field', {
        annotation: FEATURE_MEDIA_CASE,
    }, async ({browser, page}) => {
        const featureMedia = mediaField(page, 'feature_media');
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        await monitoring.openMonitoringForDesk('Sports');

        const picture = monitoring.getArticleLocator('Rivendell picture');

        await expect(picture).toBeVisible();

        const lockOwner = await lockAs(browser, {username: 'samgamgee', password: 'samgamgee'}, 'Rivendell picture');

        try {
            await openArticle(page, 'test sports story');

            // A real drag: authoring-react reads the whole item from the drag payload instead of re-fetching it.
            await picture.dragTo(placeholder(featureMedia));

            await expectErrorNotification(page, /locked/i);

            await expect(placeholder(featureMedia)).toBeVisible();
            await expect(carouselImage(featureMedia)).toHaveCount(0);
        } finally {
            await lockOwner.close();
        }
    });
});

test.describe('media gallery field (authoring-react)', () => {
    test('an image uploaded to the gallery is kept on save and removing it clears the gallery', {
        annotation: [
            {type: 'confluence', description: '1344444010 complete'}, // Media functionality for Body Editor3
        ],
    }, async ({page}) => {
        const gallery = mediaField(page, 'shire_gallery');
        const metadata = {headline: 'gallery image', description: 'gallery image caption'};

        await restoreDatabaseSnapshot({snapshotName: 'association-fields'});
        await openArticle(page, 'test sports story');

        await expect(placeholder(gallery)).toBeVisible();
        await expect(carouselImage(gallery)).toHaveCount(0);

        const [filePicker] = await Promise.all([
            page.waitForEvent('filechooser'),
            placeholder(gallery).click(),
        ]);

        await filePicker.setFiles([IMAGE_FILE]);
        await uploadWithMetadata(page, metadata);

        await expect(carouselImage(gallery)).toHaveCount(1);

        await new Authoring(page).saveAndClose();
        await openArticle(page, 'test sports story');

        await expect(carouselImage(gallery)).toHaveCount(1);

        await carouselImage(gallery).scrollIntoViewIfNeeded();
        await carouselImage(gallery).hover({force: true});
        await gallery.getByRole('button', {name: 'Remove', exact: true}).click();

        await expect(carouselImage(gallery)).toHaveCount(0);

        await new Authoring(page).saveAndClose();
        await openArticle(page, 'test sports story');

        await expect(placeholder(gallery)).toBeVisible();
        await expect(carouselImage(gallery)).toHaveCount(0);
    });
});
