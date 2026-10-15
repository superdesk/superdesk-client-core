import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MediaUpload} from './page-object-models/upload';
import {MediaEditor} from './page-object-models/media-editor';
import {PictureAuthoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot} from './utils';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * QA case "Upload a single image by drag and drop".
 *
 * Opens the Upload media screen from the Monitoring create menu, drops one image
 * on the drop area, retargets the upload at another desk, fills metadata and
 * uploads. The image must end up on the desk that was picked, findable in global
 * search, with the metadata entered before the upload preserved.
 *
 * Complete together with the shared screen-behaviour tests in
 * upload-media-dropped-files.spec.ts (non-media refusal, required metadata, Cancel,
 * progress circle), which carry this case id as partial contributions.
 */
test('uploading a single image by drag and drop', {
    annotation: [
        {type: 'confluence', description: '1315931215 complete'}, // Upload a single image by drag and drop
    ],
}, async ({page}) => {
    const HEADLINE = 'dropped image';
    const DESCRIPTION = 'dropped image description';

    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);
    const upload = new MediaUpload(page);
    const mediaEditor = new MediaEditor(page);
    const pictureAuthoring = new PictureAuthoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.openMediaUploadView();

    await expect(upload.getModal()).toBeVisible();
    await expect(upload.getModal().getByTestId('drag-files-here')).toBeVisible();
    await expect(upload.getModal().getByTestId('select-file-button')).toBeVisible();
    await expect(upload.getSelectedDesk()).toContainText('Sports');
    await expect(upload.getUploadButton()).toBeDisabled();

    await upload.dropFile('image-red.jpg');

    await expect(upload.getItems()).toHaveCount(1);

    // the thumbnail is rendered from the dropped file's bytes, so it only shows
    // once the file itself was read, not merely once an item was added
    await expect(upload.getItems().locator('img')).toBeVisible();
    await expect(upload.getModal().getByTestId('drag-files-here')).toBeHidden();
    await expect(upload.getUploadButton()).toBeEnabled();

    await upload.selectDesk('Education');

    await setEditor3FieldValue(mediaEditor.field('field--headline'), HEADLINE);
    await setEditor3FieldValue(mediaEditor.field('field--description_text'), DESCRIPTION);

    await upload.startUpload();

    await expect(upload.getModal()).toBeHidden();

    await monitoring.selectDeskOrWorkspace('Education');

    const uploadedItem = page.getByTestId('monitoring-group')
        .and(page.locator('[data-test-value="Education / Working Stage"]'))
        .getByTestId('article-item')
        .filter({hasText: HEADLINE});

    await expect(uploadedItem).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(uploadedItem, 'Edit');

    await expect(pictureAuthoring.field('field--headline')).toHaveText(HEADLINE);
    await expect(pictureAuthoring.field('field--description_text')).toHaveText(DESCRIPTION);

    await pictureAuthoring.close();

    await page.goto('/#/search');

    await expect(
        page.getByTestId('article-item').filter({hasText: HEADLINE}),
    ).toBeVisible();
});
