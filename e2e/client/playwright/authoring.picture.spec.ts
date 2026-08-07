import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {MediaEditor} from './page-object-models/media-editor';
import {PictureAuthoring} from './page-object-models/authoring';
import {MediaUpload} from './page-object-models/upload';
import {setEditor3FieldValue} from './utils/editor3';

/**
 * upload a picture
 * edit metadata
 * test metadata changes from modal are visible in the editor
 */
test('media metadata editor', {
    annotation: [
        {type: 'confluence', description: '1311834322 partial'}, // Edit image metadata
        {type: 'confluence', description: '1315931673 partial'}, // Edit values in metadata fields
        {type: 'confluence', description: '1315931211 partial'}, // Upload a single image by selecting from folder
        {type: 'confluence', description: '1311835200 partial'}, // Upload image to Personal space
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const upload = new MediaUpload(page);
    const monitoring = new Monitoring(page);
    const mediaEditor = new MediaEditor(page);
    const pictureAuthoring = new PictureAuthoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.openMediaUploadView();

    await upload.selectFile('iptc-photo.jpg');

    await setEditor3FieldValue(mediaEditor.field('field--headline'), 'picture');

    await expect(mediaEditor.field('field--headline')).toHaveText('picture');

    await upload.startUpload();

    await monitoring.executeActionOnMonitoringItem(monitoring.getArticleLocator('picture'), 'Edit');

    await pictureAuthoring.openMetadataEditor();

    await setEditor3FieldValue(mediaEditor.field('field--description_text'), 'test description');

    await mediaEditor.saveMetadata();

    await expect(pictureAuthoring.field('field--description_text')).toContainText('test description');

    await setEditor3FieldValue(pictureAuthoring.field('field--description_text'), 'new description');

    await pictureAuthoring.openMetadataEditor();

    await expect(mediaEditor.field('field--description_text')).toContainText('new description');
});
