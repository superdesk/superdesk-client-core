import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {Authoring} from './page-object-models/authoring';
import {AuthoringReact} from './page-object-models/authoring-react';
import {MediaUpload} from './page-object-models/upload';
import {MediaEditor} from './page-object-models/media-editor';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {addEditor3MediaByDrag, setEditor3FieldValue} from './utils/editor3';
import {openArticleFromList} from './scenarios/authoring-react-article';

/**
 * Editor3 media QA cases on authoring-react: adding a picture, audio or video to the body and
 * the preview each renders in the editor. The scope follows editor3-media.spec.ts, whose header
 * lists what is not covered and why (no audio/video file to upload, the native player controls,
 * the undecodable quicktime video, the multi-image upload loop). Audio and video are inserted
 * from the `media-items` snapshot by dragging them out of monitoring.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

test.describe.configure({timeout: 150000});

const ARTICLE = 'test sports story';

function getBody(page: Page): Locator {
    return new AuthoringReact(page).fieldContainer('body_html');
}

function getMediaBlock(body: Locator, type: 'picture' | 'audio' | 'video'): Locator {
    return body.getByTestId('media-block').and(body.page().locator(`[data-test-value="${type}"]`));
}

/** The Draft.js caption of a media block, told apart from the plain `<textarea>` title by contenteditable. */
function getDescription(mediaBlock: Locator): Locator {
    return mediaBlock.getByRole('textbox').and(mediaBlock.locator('[contenteditable="true"]'));
}

function getBodyMediaAssociations(article: {associations?: {[key: string]: unknown}}): Array<unknown> {
    return Object.entries(article.associations ?? {})
        .filter(([key, value]) => key.startsWith('editor_') && value != null)
        .map(([, value]) => value);
}

function goToSports(page: Page): Promise<void> {
    return new Monitoring(page).openMonitoringForDesk('Sports');
}

async function openArticle(page: Page): Promise<Locator> {
    await openArticleFromList(page, ARTICLE);

    const body = getBody(page);

    await expect(body.getByRole('textbox').first()).toBeVisible();

    return body;
}

/** Parks the pointer off the body, so a media block's hover-revealed controls start hidden. */
function movePointerAwayFromBody(page: Page): Promise<void> {
    return page.getByTestId('authoring').getByTestId('authoring-toolbar-1').first().hover();
}

/**
 * Leaves the article open on a media block that has been saved once, the state every preview
 * case starts from.
 */
async function openArticleWithMedia(page: Page, itemHeadline: string): Promise<Locator> {
    const authoring = new AuthoringReact(page);
    const body = await openArticle(page);

    await addEditor3MediaByDrag(body, new Monitoring(page).getArticleLocator(itemHeadline));
    await authoring.saveAndClose();
    await openArticle(page);

    await expect(authoring.saveButtonReact).toBeDisabled();

    return body;
}

test.describe('media in the body (authoring-react)', () => {
    test('a picture uploaded from the Media toolbar button is inserted in the body and survives reopen', {
        annotation: [{type: 'confluence', description: '1310851187 partial'}], // Add image to Editor3
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = new AuthoringReact(page);
        const upload = new MediaUpload(page);
        const mediaEditor = new MediaEditor(page);
        const headline = 'Editor3 uploaded picture';

        await goToSports(page);

        const body = await openArticle(page);

        await body.getByTestId('toolbar').getByRole('button', {name: 'Media'}).click();
        await expect(page.getByTestId('file-upload')).toBeVisible();

        await upload.selectFile('iptc-photo.jpg');
        await expect(upload.getSelectedFiles()).toHaveCount(1);

        await setEditor3FieldValue(mediaEditor.field('field--headline'), headline);
        await expect(upload.getSelectedFiles()).toContainText(headline);

        await upload.startUpload();

        const cropsPage = page.getByTestId('change-image');

        await expect(cropsPage.getByRole('heading', {name: 'Edit Crops'})).toBeVisible();
        await cropsPage.getByTestId('done').click();

        await expect(cropsPage).toBeHidden();
        await expect(page.getByTestId('file-upload')).toBeHidden();

        const mediaBlock = getMediaBlock(body, 'picture');

        await expect(mediaBlock).toBeVisible();
        await expect(mediaBlock.locator('img')).toHaveAttribute('src', /\/api\/upload-raw\//);

        await authoring.saveAndClose();

        const uploadedItem = monitoring.getArticleLocator(headline);

        await expect(uploadedItem).toBeVisible();
        await expect(uploadedItem.getByTestId('type-icon')).toHaveAttribute('data-test-value', 'picture');

        await openArticle(page);
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

        const upload = new MediaUpload(page);

        await goToSports(page);

        const body = await openArticle(page);

        await body.getByTestId('toolbar').getByRole('button', {name: 'Media'}).click();
        await expect(page.getByTestId('file-upload')).toBeVisible();

        await upload.attachFile({
            name: 'notes.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('not a media file'),
        });

        await expect(page.getByText('Only the following files are allowed: image, video, audio')).toBeVisible();
        await expect(upload.getSelectedFiles()).toHaveCount(0);

        await upload.cancelUpload();

        await expect(page.getByTestId('file-upload')).toBeHidden();
        await expect(body.getByTestId('media-block')).toHaveCount(0);
        await expect(new AuthoringReact(page).saveButtonReact).toBeDisabled();
    });

    test('picture preview: overlay metadata and edit actions revealed on hover', {
        annotation: [
            {type: 'confluence', description: '1327759422 complete'}, // Image preview in Editor3
            {type: 'confluence', description: '1310851187 partial'}, // Add image to Editor3
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});
        await goToSports(page);

        const body = await openArticleWithMedia(page, 'Rivendell picture');
        const mediaBlock = getMediaBlock(body, 'picture');

        await expect(mediaBlock.locator('img')).toHaveAttribute('src', /\/api\/upload-raw\//);
        await expect(getDescription(mediaBlock)).toHaveText('Picture fixture for media filtering and image editing');

        const overlay = mediaBlock.getByTestId('media-block-overlay');

        // the overlay fades in by opacity and keeps its box, so visibility cannot see the change
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
    });

    test('audio preview: a playable player, metadata and the metadata editor', {
        annotation: [
            {type: 'confluence', description: '1327759424 partial'}, // Audio preview in Editor3
            {type: 'confluence', description: '1310851193 partial'}, // Add audio to Editor3
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});
        await goToSports(page);

        const body = await openArticleWithMedia(page, 'Lothlorien audio');
        const mediaBlock = getMediaBlock(body, 'audio');

        await expect(mediaBlock.getByTestId('media-block-title')).toHaveValue('Lothlorien audio');
        await expect(getDescription(mediaBlock)).toHaveText('Audio fixture for media filtering');

        const player = mediaBlock.locator('audio');

        await expect(player).toHaveAttribute('controls', '');
        await expect(player).toHaveAttribute('src', /\/api\/upload-raw\//);

        // a finite duration means the browser decoded the file; play() then proves it plays
        await expect.poll(() => player.evaluate((el: HTMLAudioElement) => el.duration)).toBeGreaterThan(0);

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
        await expect(page.getByTestId('media-editor').locator('audio')).toBeVisible();
        await details.getByTestId('done').click();
        await expect(details).toBeHidden();
    });

    test('video preview: a player, metadata and the metadata editor', {
        annotation: [
            {type: 'confluence', description: '1327759426 partial'}, // Video preview in Editor3
            {type: 'confluence', description: '1310851191 partial'}, // Add video to Editor3
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});
        await goToSports(page);

        const body = await openArticleWithMedia(page, 'Isengard video');
        const mediaBlock = getMediaBlock(body, 'video');

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
        await expect(page.getByTestId('media-editor').locator('video')).toBeVisible();
        await details.getByTestId('done').click();
        await expect(details).toBeHidden();
    });

    /**
     * Editing a media block's title or description in the body. `coverage` follows the preview
     * cases: audio and video stay partial for the player controls listed in the header.
     */
    const EDITS: Array<{
        case: string;
        coverage: 'complete' | 'partial';
        item: string;
        type: 'picture' | 'audio' | 'video';
        title?: string;
        description: string;
    }> = [
        {
            case: '1327759422',
            coverage: 'complete',
            item: 'Rivendell picture',
            type: 'picture',
            description: 'Rivendell seen from the ford',
        },
        {
            case: '1327759424',
            coverage: 'partial',
            item: 'Lothlorien audio',
            type: 'audio',
            title: 'Lothlorien lament',
            description: 'Recorded under the mallorn trees',
        },
        {
            case: '1327759426',
            coverage: 'partial',
            item: 'Isengard video',
            type: 'video',
            title: 'Isengard from the tower',
            description: 'The wheels and gears of Orthanc',
        },
    ];

    for (const edit of EDITS) {
        test(`editing the ${edit.type} block's title and description in the body survives save and reopen`, {
            annotation: [{type: 'confluence', description: `${edit.case} ${edit.coverage}`}],
        }, async ({page}) => {
            await restoreDatabaseSnapshot({snapshotName: 'media-items'});
            await goToSports(page);

            const authoring = new Authoring(page);
            const body = await openArticleWithMedia(page, edit.item);
            const mediaBlock = getMediaBlock(body, edit.type);

            if (edit.title != null) {
                await mediaBlock.getByTestId('media-block-title').fill(edit.title);
            }

            await setEditor3FieldValue(getDescription(mediaBlock), edit.description);

            await authoring.saveAndClose();
            await openArticle(page);

            const reopened = getMediaBlock(getBody(page), edit.type);

            if (edit.title != null) {
                await expect(reopened.getByTestId('media-block-title')).toHaveValue(edit.title);
            }

            await expect(getDescription(reopened)).toHaveText(edit.description);
        });
    }

    test('editing the picture block\'s description in the body updates the picture\'s association', {
        annotation: [{type: 'confluence', description: '1327759422 complete'}], // Image preview in Editor3
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});
        await goToSports(page);

        const authoring = new Authoring(page);
        const body = await openArticleWithMedia(page, 'Rivendell picture');
        const description = 'Rivendell seen from the ford';

        await setEditor3FieldValue(getDescription(getMediaBlock(body, 'picture')), description);

        const {response} = await authoring.saveAndGetRequest();

        expect(getBodyMediaAssociations(response)).toEqual([expect.objectContaining({description_text: description})]);
    });

    test('a description edit only autosaved and reopened reaches the picture\'s association on save', {
        annotation: [{type: 'confluence', description: '1327759422 complete'}], // Image preview in Editor3
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});
        await goToSports(page);

        const authoring = new Authoring(page);
        const body = await openArticleWithMedia(page, 'Rivendell picture');
        const description = 'Rivendell seen from the ford';
        const autosaved = page.waitForResponse(
            (r) => new URL(r.url()).pathname.endsWith('/archive_autosave') && r.request().method() === 'POST',
        );

        await setEditor3FieldValue(getDescription(getMediaBlock(body, 'picture')), description);
        await autosaved;

        // the reload drops the editor's state, so the article reopens from its autosave
        await page.reload();
        await expect(getDescription(getMediaBlock(getBody(page), 'picture'))).toHaveText(description);

        const {response} = await authoring.saveAndGetRequest();

        expect(getBodyMediaAssociations(response)).toEqual([expect.objectContaining({description_text: description})]);
    });
});
