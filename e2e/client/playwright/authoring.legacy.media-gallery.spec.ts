import {test, expect, Page, Locator} from '@playwright/test';
import * as path from 'path';
import {Monitoring} from './page-object-models/monitoring';
import {dismissSessionExpiry, login, restoreDatabaseSnapshot, s} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

const TEST_FILE_DIR = path.resolve(__dirname, '..', 'test-files');

test.use({storageState: {cookies: [], origins: []}});

test.setTimeout(90000);

function galleryLocator(page: Page): Locator {
    return page.locator(s('authoring-field=Image gallery 33'));
}

async function uploadMediaToGallery(page: Page, imageFile: string) {
    const gallery = galleryLocator(page);

    await gallery.locator(s('media-gallery--upload-placeholder')).click();
    await page.locator(s('image-upload-input')).setInputFiles(path.join(TEST_FILE_DIR, imageFile));
    await setEditor3FieldValue(
        page.locator(s('media-metadata-editor', 'field--headline')).getByRole('textbox'),
        'image headline',
    );
    await setEditor3FieldValue(
        page.locator(s('media-metadata-editor', 'field--slugline')).getByRole('textbox'),
        'image slugline',
    );
    await setEditor3FieldValue(
        page.locator(s('media-metadata-editor', 'field--description_text')).getByRole('textbox'),
        'image description',
    );
    await page.locator(s('multi-image-edit--start-upload')).click();

    // Gallery only renders the new image after the parent article PATCH lands;
    // also wait for the modal to unmount so it can't mask the gallery query.
    const articlePatch = page.waitForResponse((resp) =>
        /\/api\/archive\/[^/]+$/.test(resp.url())
        && resp.request().method() === 'PATCH'
        && resp.ok(),
    );

    await page.locator(s('change-image', 'done')).click();
    await articlePatch;
    await expect(page.locator(s('change-image'))).toBeHidden();
}

test.describe('media gallery (legacy)', () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);
    });

    test('uploading an image with default crops adds it to the gallery', async ({page}) => {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('XEditor3 Desk');
        await monitoring.createArticleFromTemplate('editor3 template');

        const gallery = galleryLocator(page);

        await expect(gallery.locator(s('media-gallery--upload-placeholder'))).toBeVisible();
        await expect(gallery.locator(s('media-gallery-image'))).toHaveCount(0);

        await uploadMediaToGallery(page, 'image-big.jpg');

        await expect(gallery.locator(s('media-gallery-image'))).toHaveCount(1);
    });

    test('removing an image from the gallery clears it', async ({page}) => {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('XEditor3 Desk');
        await monitoring.createArticleFromTemplate('editor3 template');

        await uploadMediaToGallery(page, 'image-red.jpg');

        const gallery = galleryLocator(page);

        await expect(gallery.locator(s('media-gallery-image'))).toHaveCount(1);

        await dismissSessionExpiry(page);
        await gallery.locator(s('media-gallery-image')).hover();
        await gallery.locator(s('media-gallery-image--remove')).click();

        await expect(gallery.locator(s('media-gallery-image'))).toHaveCount(0);
    });
});
