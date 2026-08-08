import {test, expect} from '@playwright/test';
import {MediaEditor} from './page-object-models/media-editor';
import {Monitoring} from './page-object-models/monitoring';
import {PictureAuthoring} from './page-object-models/authoring';
import {MediaUpload} from './page-object-models/upload';
import {restoreDatabaseSnapshot} from './utils';

/**
 * A photo's embedded IPTC metadata becoming the metadata of the Superdesk item
 * it produces.
 *
 * Covered: the IPTC fields of `e2e/client/test-files/iptc-photo.jpg` (the IPTC
 * 2017.1 reference photo) landing on headline, byline, description and copyright
 * notice, those values surviving the write to `archive`, and the resulting item
 * being findable in global search by a string that only its IPTC data carries.
 *
 * Case 1321173975 ingests over FTP and every one of its four expected results is
 * about that feed. None of them is reachable from a browser test here:
 *
 * - "All images are ingested successfully and are moved to the _PROCESSED folder
 *   on FTP server" and "Each image is ingested once": the case feeds from an
 *   account on lab.sourcefabric.org, and the e2e stack ships no FTP server. Where
 *   a file ends up on that server is also server-side state with no UI at all.
 * - "There are no error messages at the source log on Ingest dashboard": the log
 *   is written by provider update runs, which need the feed above.
 * - "All ingested items can be found in Global search": asserted below for an
 *   uploaded item, there being nothing ingested to look for.
 *
 * So the deterministic substitute is the other route by which a photo's IPTC data
 * becomes item metadata: the upload screen reads it in the browser
 * (`scripts/apps/archive/parse-metadata.ts`) and maps it to item fields in
 * `mapIPTCExtensions` (`scripts/apps/archive/controllers/UploadController.ts`).
 * That is not the case's "Image (IPTC metadata)" feed parser, which runs on the
 * ingest backend; the client only renders whatever `feed_parsers_allowed`
 * returns. The two paths share the IPTC tag names and the item fields they write,
 * not the code, so a pass here says nothing about the parser itself.
 *
 * `mapIPTCExtensions` also maps Credit to `creditline` and LanguageIdentifier to
 * `language`. Neither is asserted: the e2e picture profile puts no creditline
 * field on the media editor, and this photo carries no LanguageIdentifier.
 */

/**
 * Values embedded in `iptc-photo.jpg`, keyed by the item field each one is
 * mapped to. The copyright notice has two spaces before "(ref2017.1)" in the
 * file; `toHaveText` compares with whitespace normalised on both sides, so it is
 * written here with one.
 */
const IPTC = {
    headline: 'The Headline (ref2017.1)',
    byline: 'Creator1 (ref2017.1)',
    description_text: 'The description aka caption (ref2017.1)',
    copyrightnotice: 'Copyright (Notice) 2017.1 IPTC - www.iptc.org (ref2017.1)',
};

/** Shared by every IPTC value in the photo and by nothing in the snapshot. */
const IPTC_MARKER = 'ref2017.1';

test('photo IPTC metadata becomes the item metadata and is searchable', {
    annotation: [
        {type: 'confluence', description: '1321173975 partial'}, // Ingest of photos with IPTC metadata
    ],
}, async ({page}) => {
    // The 30s default leaves no room: one run of this test boots the exiftool
    // WebAssembly build, uploads a 90kB photo, opens authoring and its metadata
    // editor, and runs a search, which together take 12 to 20 seconds locally.
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

    // Reading the IPTC block runs exiftool compiled to WebAssembly, which takes
    // seconds rather than milliseconds, and the fields stay empty until it
    // answers. This first assertion waits that out, so it gets more than the 15s
    // default; the ones after it read a form that is already filled.
    await expect(mediaEditor.field('field--headline')).toHaveText(IPTC.headline, {timeout: 30000});
    await expect(mediaEditor.field('field--byline')).toHaveText(IPTC.byline);
    await expect(mediaEditor.field('field--description_text')).toHaveText(IPTC.description_text);
    await expect(mediaEditor.field('field--copyrightnotice')).toHaveText(IPTC.copyrightnotice);

    await upload.startUpload();

    const item = monitoring.getArticleLocator(IPTC.headline);

    await expect(item).toBeVisible();

    await monitoring.executeActionOnMonitoringItem(item, 'Edit');

    // Headline and description are the only two IPTC-fed fields the picture
    // authoring form itself renders; the rest live behind the metadata editor.
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
