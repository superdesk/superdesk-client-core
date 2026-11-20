import {test, expect, Locator} from '@playwright/test';
import {MediaEditor} from './page-object-models/media-editor';
import {Monitoring} from './page-object-models/monitoring';
import {PictureAuthoring} from './page-object-models/authoring';
import {MediaUpload} from './page-object-models/upload';
import {restoreDatabaseSnapshot} from './utils';

/**
 * IPTC data embedded in a photo becoming item metadata through the upload screen,
 * where the server extracts it from the staged file (`upload_staging`). The
 * "Image (IPTC metadata)" feed parser used by ingest is not exercised, and a pass
 * here says nothing about it.
 *
 * Case 1321173975 is a blocker: it ingests over FTP and the e2e stack ships no FTP
 * server. Only its "found in Global search" result is asserted, for an uploaded item.
 */

// `copyrightnotice` has two spaces before "(ref2017.1)" in the file; `toHaveText` normalises whitespace.
// The file has two creators; both end up in the byline.
const IPTC = {
    headline: 'The Headline (ref2017.1)',
    byline: 'Creator1 (ref2017.1), Creator2 (ref2017.1)',
    description_text: 'The description aka caption (ref2017.1)',
    copyrightnotice: 'Copyright (Notice) 2017.1 IPTC - www.iptc.org (ref2017.1)',
};

// Shared by every IPTC value in the photo and by nothing in the snapshot.
const IPTC_MARKER = 'ref2017.1';

// Snapshot item listed by an unfiltered search and not matched by IPTC_MARKER.
const NOT_MATCHING_SEARCH = 'Indonesia opens pasteurized milk facility to back free meals program';

// The label is exposed as `data-test-value` only, so `filter({hasText})` cannot match it.
function withLabel(items: Locator, label: string): Locator {
    return items.and(items.page().locator(`[data-test-value="${label}"]`));
}

test('photo IPTC metadata becomes the item metadata and is searchable', {
    annotation: [
        {type: 'confluence', description: '1321173975 blocker'}, // Ingest of photos with IPTC metadata
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

    await expect(mediaEditor.field('field--headline')).toHaveText(IPTC.headline);
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

    const results = page.getByTestId('article-item');

    await expect(withLabel(results, NOT_MATCHING_SEARCH)).toBeVisible();

    await page.locator('#search-input').fill(IPTC_MARKER);
    await page.locator('#search-button').click();

    // The index updates asynchronously and the list refetches only when the search
    // parameters change, so re-clicking does nothing. Reload re-runs the URL's query.
    await expect(async () => {
        await page.reload();
        await expect(withLabel(results, IPTC.headline)).toBeVisible({timeout: 5000});
    }).toPass({timeout: 15000});

    await expect(results).toHaveCount(1);
    await expect(withLabel(results, NOT_MATCHING_SEARCH)).toHaveCount(0);
});
