import {test, expect} from '@playwright/test';
import {MediaEditor} from './page-object-models/media-editor';
import {Monitoring} from './page-object-models/monitoring';
import {PictureAuthoring} from './page-object-models/authoring';
import {MediaUpload} from './page-object-models/upload';
import {restoreDatabaseSnapshot} from './utils';

/**
 * IPTC data embedded in a photo becoming item metadata, via the upload screen
 * (`parse-metadata.ts`, `mapIPTCExtensions`), not the "Image (IPTC metadata)" feed
 * parser, which runs on the ingest backend. A pass here says nothing about that parser.
 *
 * Case 1321173975 is annotated as a blocker: it ingests over FTP and the e2e stack
 * ships no FTP server. Only its "found in Global search" result is asserted, for
 * an uploaded item.
 */

// `copyrightnotice` has two spaces before "(ref2017.1)" in the file; `toHaveText` normalises whitespace.
const IPTC = {
    headline: 'The Headline (ref2017.1)',
    byline: 'Creator1 (ref2017.1)',
    description_text: 'The description aka caption (ref2017.1)',
    copyrightnotice: 'Copyright (Notice) 2017.1 IPTC - www.iptc.org (ref2017.1)',
};

// Shared by every IPTC value in the photo and by nothing in the snapshot.
const IPTC_MARKER = 'ref2017.1';

test('photo IPTC metadata becomes the item metadata and is searchable', {
    annotation: [
        {type: 'confluence', description: '1321173975 blocker'}, // Ingest of photos with IPTC metadata
    ],
}, async ({page}) => {
    // A run takes 12 to 20s locally (exiftool WASM boot, upload, authoring, search).
    test.setTimeout(90000);

    await restoreDatabaseSnapshot();

    const upload = new MediaUpload(page);
    const monitoring = new Monitoring(page);
    const mediaEditor = new MediaEditor(page);
    const pictureAuthoring = new PictureAuthoring(page);

    await page.goto('/#/workspace/monitoring');

    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.openMediaUploadView();

    await upload.selectFile('iptc-photo.jpg');

    // Fields stay empty until exiftool (WASM) answers, hence the longer timeout.
    await expect(mediaEditor.field('field--headline')).toHaveText(IPTC.headline, {timeout: 30000});
    await expect(mediaEditor.field('field--byline')).toHaveText(IPTC.byline);
    await expect(mediaEditor.field('field--description_text')).toHaveText(IPTC.description_text);
    await expect(mediaEditor.field('field--copyrightnotice')).toHaveText(IPTC.copyrightnotice);

    await upload.startUpload();

    const item = monitoring.getArticleLocator(IPTC.headline);

    await expect(item).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(item, 'Edit');

    // Only these two IPTC fields render on the authoring form; the rest are in the metadata editor.
    await expect(pictureAuthoring.field('field--headline')).toHaveText(IPTC.headline);
    await expect(pictureAuthoring.field('field--description_text')).toHaveText(IPTC.description_text);

    await pictureAuthoring.openMetadataEditor();

    await expect(mediaEditor.field('field--byline')).toHaveText(IPTC.byline);
    await expect(mediaEditor.field('field--copyrightnotice')).toHaveText(IPTC.copyrightnotice);

    await mediaEditor.doneButton.click();
    await expect(mediaEditor.header).toBeHidden();

    await page.getByTestId('authoring-topbar').getByTestId('close').click();

    await page.goto('/#/search');

    await page.locator('#search-input').fill(IPTC_MARKER);
    await page.locator('#search-button').click();

    await expect(page.getByTestId('article-item')).toHaveCount(1);
    await expect(page.getByTestId('article-item')).toHaveAttribute('data-test-value', IPTC.headline);
});
