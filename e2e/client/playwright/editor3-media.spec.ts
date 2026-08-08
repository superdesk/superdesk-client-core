import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {MediaUpload} from './page-object-models/upload';
import {MediaEditor} from './page-object-models/media-editor';
import {restoreDatabaseSnapshot} from './utils';
import {addEditor3MediaByDrag, setEditor3FieldValue} from './utils/editor3';

/**
 * Editor3 media QA cases: adding a picture, an audio file and a video to the
 * article Body, and the preview each of them renders inside the editor.
 *
 * Not covered, per case:
 *
 * - "Add image/audio/video to Editor3" (1310851187, 1310851193, 1310851191):
 *   "file can be uploaded only if all required metadata fields are filled".
 *   `UploadController` derives its validator from `appConfig.validator_media_metadata`,
 *   which the e2e client config does not set, so `validateMediaFieldsThrows` has no
 *   required key to check and the upload always goes through. The red `*` markers on
 *   Headline and Description come from the picture content profile and are unrelated
 *   to that validator.
 * - The same three cases: "can be found in Global search" - no global search step here.
 * - "Add audio to Editor3" (1310851193) and "Add video to Editor3" (1310851191):
 *   everything downstream of uploading an audio/video file from disk. `test-files/`
 *   ships images only, and the fixture rules forbid inventing a near-duplicate media
 *   file, so both are inserted from the `media-items` snapshot instead. That leaves
 *   uncovered: the Upload media page carrying an audio or video file, the Details page
 *   the upload flow opens for each of them (its contents are asserted here through the
 *   block's "Edit metadata" button, which opens the same modal), the "Open metadata"
 *   button on it, and "all audios/videos inserted appear as separate items in
 *   Monitoring" (the snapshot item is already in the list, so asserting it there
 *   proves nothing about the insert).
 * - "Audio preview" (1327759424) and "Video preview" (1327759426): changing the
 *   volume and downloading the file. Both are affordances of the browser's native
 *   `<audio controls>` / `<video controls>` widget, which exposes no product DOM to
 *   drive. Same for the video case's fullscreen and picture-in-picture.
 * - "Video preview" (1327759426): "video file can be played and paused". The
 *   snapshot's "Isengard video" is `video/quicktime`, which Chromium will not decode,
 *   so it never selects the `<source>` and playback cannot start. The audio case does
 *   assert real playback.
 * - "Image preview" (1327759422): the case's prerequisite asks for several images in
 *   the Body. Building several through the UI needs a loop of insertions, which
 *   e2e/WRITING_TESTS.md rules out, and every expected result is per-image, so one
 *   image is used.
 *
 * Product wording that diverges from the cases:
 *
 * - "Add image to Editor3" step 5 asks for Save on the Edit crops page before Upload
 *   on the Upload media page. The product runs the other way round: Upload creates the
 *   items first, then opens Edit Crops for each one, which closes with "Done".
 * - "Image preview in Editor3" lists the metadata, the Edit metadata / Edit image /
 *   Edit crops buttons and the Remove icon as revealed on mouse over. The overlay
 *   holding the first two is revealed by a CSS opacity transition, so its contents
 *   stay laid out and hit-testable before the hover; only the Remove icon is toggled
 *   with `visibility`. The hover behaviour is therefore asserted on the overlay's
 *   computed opacity and on the Remove icon's visibility.
 * - "Video preview in Editor3" describes its fields as belonging to the "audio file";
 *   the case is about video and is read that way here.
 */
test.describe('media in the article body', () => {
    const ARTICLE = 'test sports story';

    // Every test here drives at least one full save/close/reopen round trip through
    // the Angular authoring view, which does not fit the 30s default.
    test.describe.configure({timeout: 150000});

    function getBody(page: Page): Locator {
        return page.getByTestId('authoring')
            .getByTestId('authoring-field')
            .and(page.locator('[data-test-value="body_html"]'));
    }

    function getMediaBlock(body: Locator, type: 'picture' | 'audio' | 'video'): Locator {
        return body.getByTestId('media-block').and(body.page().locator(`[data-test-value="${type}"]`));
    }

    /**
     * The caption editor of a media block. It and the Title field above it are both
     * exposed as role=textbox, so the contenteditable attribute is what separates the
     * Draft.js caption from the plain `<textarea>` title.
     */
    function getDescription(mediaBlock: Locator): Locator {
        return mediaBlock.getByRole('textbox').and(mediaBlock.locator('[contenteditable="true"]'));
    }

    async function openArticle(page: Page, monitoring: Monitoring): Promise<Locator> {
        await monitoring.getArticleLocator(ARTICLE).dblclick();

        const body = getBody(page);

        await expect(body).toBeVisible();

        return body;
    }

    /**
     * Parks the pointer on the topbar. Playwright leaves it wherever the previous
     * action put it, which is often over the body, so a media block's hover-revealed
     * controls can already be showing before the test hovers anything.
     */
    function movePointerAwayFromBody(page: Page): Promise<void> {
        return page.getByTestId('authoring-topbar').hover();
    }

    /**
     * Leaves the article open on a media block that has already been saved once, which
     * is the state every preview case starts from ("open the article for editing" with
     * the Save button inactive). Inserting the block dirties the article, so it has to
     * be saved and the article reopened before Save can be asserted inactive again.
     */
    async function openArticleWithMedia(
        page: Page,
        monitoring: Monitoring,
        authoring: Authoring,
        itemHeadline: string,
    ): Promise<Locator> {
        let body = await openArticle(page, monitoring);

        await authoring.withAutosave(
            () => addEditor3MediaByDrag(body, monitoring.getArticleLocator(itemHeadline)),
        );
        await expect(authoring.saveButton()).toBeEnabled();
        await authoring.saveFromTopbar();
        await authoring.closeFromTopbar();

        body = await openArticle(page, monitoring);

        await expect(authoring.saveButton()).toBeDisabled();

        return body;
    }

    test('a picture uploaded from the Media toolbar button is inserted in the body', {
        annotation: [
            {type: 'confluence', description: '1310851187 partial'}, // Add image to Editor3
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);
        const upload = new MediaUpload(page);
        const mediaEditor = new MediaEditor(page);
        const headline = 'Editor3 uploaded picture';

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const body = await openArticle(page, monitoring);

        await body.getByTestId('toolbar').getByRole('button', {name: 'Media'}).click();
        await expect(page.getByTestId('file-upload')).toBeVisible();

        await upload.selectFile('iptc-photo.jpg');
        await expect(upload.getSelectedFiles()).toHaveCount(1);

        await setEditor3FieldValue(mediaEditor.field('field--headline'), headline);
        await expect(upload.getSelectedFiles()).toContainText(headline);

        await upload.startUpload();

        const cropsPage = page.getByTestId('change-image');

        await expect(cropsPage).toBeVisible();
        await expect(cropsPage.getByRole('heading', {name: 'Edit Crops'})).toBeVisible();

        await cropsPage.getByTestId('done').click();

        await expect(cropsPage).toBeHidden();
        await expect(page.getByTestId('file-upload')).toBeHidden();

        const mediaBlock = getMediaBlock(body, 'picture');

        await expect(mediaBlock).toBeVisible();
        await expect(mediaBlock.locator('img')).toHaveAttribute('src', /\/api\/upload-raw\//);

        await expect(authoring.saveButton()).toBeEnabled();
        await authoring.saveFromTopbar();
        await authoring.closeFromTopbar();

        const uploadedItem = monitoring.getArticleLocator(headline);

        await expect(uploadedItem).toBeVisible();
        await expect(uploadedItem.getByTestId('type-icon')).toHaveAttribute('data-test-value', 'picture');

        await openArticle(page, monitoring);
        await expect(getMediaBlock(getBody(page), 'picture')).toBeVisible();
    });

    test('the Upload media page rejects a file that is not an image, video or audio', {
        annotation: [
            {type: 'confluence', description: '1310851187 partial'}, // Add image to Editor3
            {type: 'confluence', description: '1310851193 partial'}, // Add audio to Editor3
            {type: 'confluence', description: '1310851191 partial'}, // Add video to Editor3
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);
        const upload = new MediaUpload(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const body = await openArticle(page, monitoring);

        await body.getByTestId('toolbar').getByRole('button', {name: 'Media'}).click();
        await expect(page.getByTestId('file-upload')).toBeVisible();

        await upload.attachFile({
            name: 'notes.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('not a media file'),
        });

        await expect(page.getByText('Only the following files are allowed: image, video, audio'))
            .toBeVisible();
        await expect(upload.getSelectedFiles()).toHaveCount(0);

        await upload.cancelUpload();

        await expect(page.getByTestId('file-upload')).toBeHidden();
        await expect(body).toBeVisible();
        await expect(body.getByTestId('media-block')).toHaveCount(0);
        await expect(authoring.saveButton()).toBeDisabled();
    });

    test('picture preview: overlay metadata, edit actions and an editable description', {
        annotation: [
            {type: 'confluence', description: '1327759422 complete'}, // Image preview in Editor3
            {type: 'confluence', description: '1310851187 partial'}, // Add image to Editor3
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const body = await openArticleWithMedia(page, monitoring, authoring, 'Rivendell picture');
        const mediaBlock = getMediaBlock(body, 'picture');

        await expect(mediaBlock).toBeVisible();
        await expect(mediaBlock.locator('img')).toHaveAttribute('src', /\/api\/upload-raw\//);
        await expect(getDescription(mediaBlock))
            .toHaveText('Picture fixture for media filtering and image editing');

        const overlay = mediaBlock.getByTestId('media-block-overlay');
        // The overlay is revealed by a CSS opacity transition and keeps its box either
        // way, so toBeVisible() cannot see the change; the Remove icon next to it is
        // toggled with `visibility` and can.
        const overlayOpacity = () => overlay.evaluate((el) => getComputedStyle(el).opacity);

        await movePointerAwayFromBody(page);
        await expect.poll(overlayOpacity).toBe('0');
        await expect(mediaBlock.getByTestId('media-block-remove')).toBeHidden();

        await mediaBlock.hover();

        await expect.poll(overlayOpacity).toBe('1');
        await expect(mediaBlock.getByTestId('media-block-remove')).toBeVisible();

        await expect(overlay).toContainText('Title: Rivendell picture');
        await expect(overlay).toContainText('Alt text: Rivendell');
        await expect(overlay).toContainText('Credit: Bilbo Baggins');
        await expect(overlay).toContainText('Copyright holder:');
        await expect(overlay).toContainText('Assign rights:');
        await expect(overlay).toContainText('Copyright notice:');

        await expect(overlay.getByTestId('media-block-edit-metadata')).toBeVisible();
        await expect(overlay.getByTestId('media-block-edit-image')).toBeVisible();
        await expect(overlay.getByTestId('media-block-edit-crops')).toBeVisible();

        await authoring.withAutosave(
            () => setEditor3FieldValue(getDescription(mediaBlock), 'Rivendell seen from the ford'),
        );

        await expect(authoring.saveButton()).toBeEnabled();
        await authoring.saveFromTopbar();
        await authoring.closeFromTopbar();

        await openArticle(page, monitoring);

        const reopened = getMediaBlock(getBody(page), 'picture');

        await expect(reopened).toBeVisible();
        await expect(getDescription(reopened)).toHaveText('Rivendell seen from the ford');
    });

    test('audio preview: player, metadata and editable headline and description', {
        annotation: [
            {type: 'confluence', description: '1327759424 partial'}, // Audio preview in Editor3
            {type: 'confluence', description: '1310851193 partial'}, // Add audio to Editor3
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const body = await openArticleWithMedia(page, monitoring, authoring, 'Lothlorien audio');
        const mediaBlock = getMediaBlock(body, 'audio');

        await expect(mediaBlock).toBeVisible();
        await expect(mediaBlock.getByTestId('media-block-title')).toHaveValue('Lothlorien audio');
        await expect(getDescription(mediaBlock)).toHaveText('Audio fixture for media filtering');

        const player = mediaBlock.locator('audio');

        await expect(player).toHaveAttribute('controls', '');
        await expect(player).toHaveAttribute('src', /\/api\/upload-raw\//);

        // A finite duration means the browser decoded the file, which is what makes
        // the native controls usable; play()/pause() then proves it really plays.
        await expect
            .poll(() => player.evaluate((el: HTMLAudioElement) => el.duration))
            .toBeGreaterThan(0);

        expect(await player.evaluate(async (el: HTMLAudioElement) => {
            await el.play();

            return el.paused;
        })).toBe(false);

        expect(await player.evaluate((el: HTMLAudioElement) => {
            el.pause();

            return el.paused;
        })).toBe(true);

        await expect(mediaBlock).toContainText('Credit:');
        await expect(mediaBlock).toContainText('Assign rights:');
        await expect(mediaBlock).toContainText('Copyright holder:');
        await expect(mediaBlock).toContainText('Copyright notice:');

        await movePointerAwayFromBody(page);
        await expect(mediaBlock.getByTestId('media-block-remove')).toBeHidden();
        await mediaBlock.hover();
        await expect(mediaBlock.getByTestId('media-block-remove')).toBeVisible();

        const details = page.getByTestId('change-image');

        await mediaBlock.getByTestId('media-block-edit-metadata').click();
        await expect(details).toBeVisible();
        await expect(page.getByTestId('media-editor').locator('audio')).toBeVisible();
        await details.getByTestId('done').click();
        await expect(details).toBeHidden();

        await authoring.withAutosave(
            () => mediaBlock.getByTestId('media-block-title').fill('Lothlorien lament'),
        );
        await expect(authoring.saveButton()).toBeEnabled();
        await authoring.saveFromTopbar();

        await authoring.withAutosave(
            () => setEditor3FieldValue(getDescription(mediaBlock), 'Recorded under the mallorn trees'),
        );
        await expect(authoring.saveButton()).toBeEnabled();
        await authoring.saveFromTopbar();
        await authoring.closeFromTopbar();

        await openArticle(page, monitoring);

        const reopened = getMediaBlock(getBody(page), 'audio');

        await expect(reopened).toBeVisible();
        await expect(reopened.getByTestId('media-block-title')).toHaveValue('Lothlorien lament');
        await expect(getDescription(reopened)).toHaveText('Recorded under the mallorn trees');
    });

    test('video preview: player, metadata and editable headline and description', {
        annotation: [
            {type: 'confluence', description: '1327759426 partial'}, // Video preview in Editor3
            {type: 'confluence', description: '1310851191 partial'}, // Add video to Editor3
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const monitoring = new Monitoring(page);
        const authoring = new Authoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        const body = await openArticleWithMedia(page, monitoring, authoring, 'Isengard video');
        const mediaBlock = getMediaBlock(body, 'video');

        await expect(mediaBlock).toBeVisible();
        await expect(mediaBlock.getByTestId('media-block-title')).toHaveValue('Isengard video');
        await expect(getDescription(mediaBlock)).toHaveText('Video fixture for media filtering');

        const player = mediaBlock.locator('video');

        await expect(player).toHaveAttribute('controls', '');
        await expect(player).toHaveAttribute('preload', 'metadata');
        await expect(player.locator('source')).toHaveAttribute('src', /\/api\/upload-raw\//);
        await expect(player.locator('source')).toHaveAttribute('type', 'video/quicktime');

        await expect(mediaBlock).toContainText('Credit:');
        await expect(mediaBlock).toContainText('Assign rights:');
        await expect(mediaBlock).toContainText('Copyright holder:');
        await expect(mediaBlock).toContainText('Copyright notice:');

        await movePointerAwayFromBody(page);
        await expect(mediaBlock.getByTestId('media-block-remove')).toBeHidden();
        await mediaBlock.hover();
        await expect(mediaBlock.getByTestId('media-block-remove')).toBeVisible();

        const details = page.getByTestId('change-image');

        await mediaBlock.getByTestId('media-block-edit-metadata').click();
        await expect(details).toBeVisible();
        await expect(page.getByTestId('media-editor').locator('video')).toBeVisible();
        await details.getByTestId('done').click();
        await expect(details).toBeHidden();

        await authoring.withAutosave(
            () => mediaBlock.getByTestId('media-block-title').fill('Isengard from the tower'),
        );
        await expect(authoring.saveButton()).toBeEnabled();
        await authoring.saveFromTopbar();

        await authoring.withAutosave(
            () => setEditor3FieldValue(getDescription(mediaBlock), 'The wheels and gears of Orthanc'),
        );
        await expect(authoring.saveButton()).toBeEnabled();
        await authoring.saveFromTopbar();
        await authoring.closeFromTopbar();

        await openArticle(page, monitoring);

        const reopened = getMediaBlock(getBody(page), 'video');

        await expect(reopened).toBeVisible();
        await expect(reopened.getByTestId('media-block-title')).toHaveValue('Isengard from the tower');
        await expect(getDescription(reopened)).toHaveText('The wheels and gears of Orthanc');
    });
});
