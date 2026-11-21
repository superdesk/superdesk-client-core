import {test, expect, Page} from '@playwright/test';
import * as path from 'path';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {MediaUpload} from './page-object-models/upload';
import {MediaEditor} from './page-object-models/media-editor';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {setEditor3FieldValue} from './utils/editor3';

test.use({storageState: getStorageState({}, {authoringReact: true})});

const IMAGE = path.resolve(__dirname, '..', 'test-files', 'image-red.jpg');
const HEADLINE = 'uploaded image';
const DESCRIPTION = 'uploaded image description';

async function openArticleForEditing(page: Page): Promise<Authoring> {
    const monitoring = new Monitoring(page);
    const authoring = new Authoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(
        page.getByTestId('article-item').filter({hasText: 'test sports story'}),
        'Edit',
    );
    await authoring.waitForAuthoringReactToInitialize();

    return authoring;
}

/**
 * Fills the metadata of the image sitting in the upload dialog and confirms the
 * upload, then asserts the dialog removed itself — the behaviour under test; a
 * regression leaves it on screen after the upload finishes.
 */
async function finishUploadAndExpectDialogGone(page: Page): Promise<void> {
    const upload = new MediaUpload(page);
    const mediaEditor = new MediaEditor(page);

    await expect(upload.getModal()).toBeVisible();

    await setEditor3FieldValue(mediaEditor.field('field--headline'), HEADLINE);
    await setEditor3FieldValue(mediaEditor.field('field--description_text'), DESCRIPTION);

    await expect(upload.getUploadButton()).toBeEnabled();
    await upload.startUpload();

    await expect(upload.getModal()).toBeHidden();
}

test('uploading an image to feature media closes the upload dialog', async ({page}) => {
    const authoring = await openArticleForEditing(page);
    const featureMedia = authoring.associationField('feature_media');

    await authoring.startMediaFieldUpload('feature_media', IMAGE);

    await finishUploadAndExpectDialogGone(page);

    await expect(featureMedia.locator('img')).toBeVisible();
});

test('uploading an image into the body closes the upload dialog', async ({page}) => {
    const authoring = await openArticleForEditing(page);
    const body = authoring.fieldContainer('body_html');

    await authoring.openBodyMediaUploadDialog('body_html');
    await new MediaUpload(page).selectFile('image-red.jpg');

    await finishUploadAndExpectDialogGone(page);

    // Uploading into the body continues into the image-edit step, which embeds
    // the image when confirmed and must take its dialog down with it.
    const changeImage = page.getByTestId('change-image');

    await expect(changeImage).toBeVisible();
    await changeImage.getByTestId('done').click();
    await expect(changeImage).toBeHidden();

    await expect(body.locator('img')).toBeVisible();
});
