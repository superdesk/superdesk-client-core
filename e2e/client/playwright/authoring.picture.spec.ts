import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {MediaEditor} from './page-object-models/media-editor';
import {PictureAuthoring} from './page-object-models/authoring';

test.setTimeout(30000);

/**
 * upload a picture
 * edit metadata
 * test metadata changes from modal are visible in the editor
 */
test('media metadata editor', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);
    const mediaEditor = new MediaEditor(page);
    const pictureAuthoring = new PictureAuthoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.uploadMedia();

    await mediaEditor.selectUploadFile('iptc-photo.jpg');

    await expect(mediaEditor.field('headline')).toContainText('The Headline');

    await mediaEditor.field('headline').clear();
    await mediaEditor.field('headline').fill('picture');

    await mediaEditor.startUpload();

    await monitoring.executeActionOnMonitoringItem(monitoring.listArticle('picture'), 'Edit');

    await pictureAuthoring.openMetadataEditor();

    await mediaEditor.field('description_text').fill('test description');
    await mediaEditor.saveMetadata();

    await expect(pictureAuthoring.field('description_text')).toContainText('test description');

    await pictureAuthoring.field('description_text').fill('new description');

    await pictureAuthoring.openMetadataEditor();

    await expect(mediaEditor.field('description_text')).toContainText('new description');
});
