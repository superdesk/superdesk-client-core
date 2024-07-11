import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';
import {MediaEditor} from './page-object-models/media-editor';

test.setTimeout(15000);

/**
 * upload a picture
 * edit metadata
 * test metadata changes from modal are visible in the editor
 */
test('edit picture metadata in modal', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);
    const mediaEditor = new MediaEditor(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');

    await monitoring.uploadMedia();

    await mediaEditor.selectUploadFile('iptc-photo.jpg');

    await expect(mediaEditor.field('headline')).toContainText('The Headline');

    await mediaEditor.field('headline').fill('picture');

    await mediaEditor.startUpload();

    await monitoring.executeActionOnMonitoringItem(
        page.locator(s('article-item=picture')),
        'Edit',
    );

    await page.locator(s('image-overlay')).hover();
    await page.locator(s('edit-metadata')).click();

    await mediaEditor.field('description_text').fill('test description');
    await mediaEditor.saveMetadata();

    await expect(page.locator(s('authoring', 'field--description_text'))).toContainText('test description');
});
