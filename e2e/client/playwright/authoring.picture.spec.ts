import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {MediaEditor} from './page-object-models/media-editor';
import {Authoring} from './page-object-models/authoring';

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
    const authoring = new Authoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.uploadMedia();

    await mediaEditor.selectUploadFile('iptc-photo.jpg');

    await expect(mediaEditor.field('headline')).toContainText('The Headline');

    await mediaEditor.field('headline').clear();
    await mediaEditor.field('headline').fill('picture');

    await mediaEditor.startUpload();

    await monitoring.executeActionOnMonitoringItem(monitoring.listArticle('picture'), 'Edit');

    await authoring.openMediaMetadataEditor();

    await mediaEditor.field('description_text').fill('test description');
    await mediaEditor.saveMetadata();

    await expect(authoring.field('description_text')).toContainText('test description');

    await authoring.field('description_text').fill('new description');

    await authoring.openMediaMetadataEditor();

    await expect(mediaEditor.field('description_text')).toContainText('new description');
});
