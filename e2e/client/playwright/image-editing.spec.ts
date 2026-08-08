import {test, expect, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MediaEditor} from './page-object-models/media-editor';
import {PictureAuthoring} from './page-object-models/authoring';
import {dismissSessionExpiry, restoreDatabaseSnapshot} from './utils';

/**
 * QA cases for the media editor of a picture item: opening it, cropping the
 * original, rotating, flipping, adjusting colours and editing rendition crops.
 *
 * Every test works on "Rivendell picture" from the `media-items` snapshot, the
 * only fixture picture that carries a full set of renditions. Its original is
 * 2100 x 1050 and the `crop_sizes` vocabulary defines a single crop, FIXME
 * (800 x 600), so the Edit crops tab lists exactly Original and FIXME.
 *
 * Assertions are on state, never on pixels: the live preview is checked through
 * the CSS transform the preview canvas carries, and a change that reached the
 * server is checked through the stored original size and the rendition URLs.
 *
 * Uncovered expected results:
 *
 * - "Open image in Edit image mode" (1315931606) also expects the dialog to be
 *   reachable from a picture inserted in an editor3 body. No snapshot carries an
 *   article with an embedded picture and building one needs the upload flow, so
 *   only the authoring entry point is covered.
 * - "Crop image" (1315931417) expects the Width and Height fields to default to
 *   the original size, to keep their values while the crop is moved, and the
 *   ratio buttons to activate Confirm crop. None of the three holds: the fields
 *   are bound to `CropRight` / `CropBottom` rather than to a width and a height,
 *   they start empty because `areaOfInterestData` is initialised to `{}`, and
 *   `isAoIDirty` is only ever set from jCrop's `onSelect`, which `setRatio()`
 *   suppresses. The test covers the behaviour that does hold.
 * - "Edit crops" (1311834326) expects a red message in place of a rendition the
 *   original is too small to produce. Rivendell picture is larger than the only
 *   configured crop and no fixture picture is smaller, so it is unreachable.
 */
// Every Apply and every confirmed crop is a round trip through the server-side
// image processing, and several tests do more than one.
test.setTimeout(180000);

test.describe('image editing', () => {
    const ORIGINAL_SIZE = 'Original (2100 x 1050 px)';

    async function openPicture(page: Page): Promise<void> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');

        /*
         * Restoring a snapshot sometimes leaves the first request of the fresh page
         * unauthenticated: the auth interceptor then covers monitoring with the
         * "session has expired" overlay, and the re-login that clears it can raise
         * the first-run "Welcome to Superdesk" modal on top of it, because the
         * phone_home flag is read while the backend is still settling. Both only
         * ever show up on this first navigation, and both swallow every click until
         * dismissed, so wait for a monitoring view with no modal over it.
         */
        await expect(async () => {
            await dismissSessionExpiry(page);

            const skipWelcome = page.getByRole('button', {name: 'Skip', exact: true});

            if (await skipWelcome.isVisible()) {
                await skipWelcome.click();
            }

            await expect(page.locator('.modal__backdrop')).toHaveCount(0);
            await expect(page.getByTestId('monitoring--selected-desk')).toBeVisible({timeout: 5000});
        }).toPass({timeout: 90000});

        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.getArticleLocator('Rivendell picture').dblclick();
    }

    /*
     * Every test leaves the picture open in authoring, which keeps it locked for
     * the session. restoreDatabaseSnapshot() resolves even when the restore call
     * fails, so a test that inherited a stale lock would fail on an unrelated
     * assertion; closing the item makes each test independent of that.
     */
    test.afterEach(async ({page}) => {
        const close = page.getByTestId('authoring-topbar').getByTestId('close');

        if (await close.isVisible()) {
            await close.click({timeout: 15000});
        }
    });

    async function reopenPicture(page: Page): Promise<void> {
        await page.getByTestId('authoring-topbar').getByTestId('close').click();
        await expect(page.getByTestId('authoring-topbar')).toBeHidden();

        await new Monitoring(page).getArticleLocator('Rivendell picture').dblclick();
    }

    test('the media editor offers the three tabs, the image controls and the colour scales', {
        annotation: [
            {type: 'confluence', description: '1315931606 partial'}, // Open image in Edit image mode
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const picture = new PictureAuthoring(page);
        const mediaEditor = new MediaEditor(page);

        await openPicture(page);
        await expect(picture.originalSizeLabel).toHaveText(ORIGINAL_SIZE);

        await picture.hoverMedia();

        for (const [testId, tooltip] of [
            ['edit-metadata', 'Edit metadata'],
            ['edit-image', 'Edit image'],
            ['crop', 'Edit crops'],
        ]) {
            await expect(picture.mediaField.getByTestId(testId)).toBeVisible();
            await expect(picture.mediaField.getByTestId(testId)).toHaveAttribute('sd-tooltip', tooltip);
        }

        await picture.openImageEditor();

        await expect(mediaEditor.header.getByRole('heading')).toHaveText('Edit image');
        await expect(mediaEditor.controlsPanel).toBeVisible();
        await expect(mediaEditor.preview).toBeVisible();

        for (const [control, tooltip] of [
            ['crop', 'Crop'],
            ['rotate-left', 'Rotate left'],
            ['rotate-right', 'Rotate right'],
            ['flip-horizontal', 'Flip horizontal'],
            ['flip-vertical', 'Flip vertical'],
        ] as const) {
            await expect(mediaEditor.control(control)).toBeEnabled();
            await expect(mediaEditor.control(control)).toHaveAttribute('sd-tooltip', tooltip);
        }

        await expect(mediaEditor.adjustColours).toBeVisible();

        // The scales are expressed as multipliers and rendered as a percentage
        // offset, so 0..2 is -100%..+100% and 0.5..1.5 is -50%..+50%.
        for (const [control, min, max] of [
            ['brightness', '0', '2'],
            ['contrast', '.5', '1.5'],
            ['saturation', '0', '2'],
        ] as const) {
            await expect(mediaEditor.slider(control)).toHaveAttribute('min', min);
            await expect(mediaEditor.slider(control)).toHaveAttribute('max', max);
            await expect(mediaEditor.sliderValue(control)).toHaveText('0%');
        }

        await mediaEditor.tab('view').click();
        await expect(mediaEditor.metadataField('headline')).toBeVisible();
        await expect(mediaEditor.controlsPanel).toBeHidden();

        await mediaEditor.tab('crop').click();
        await expect(mediaEditor.header.getByRole('heading')).toHaveText('Edit Crops');
        await expect(mediaEditor.renditions).toHaveCount(2);
        await expect(mediaEditor.controlsPanel).toBeHidden();

        await mediaEditor.tab('image-edit').click();
        await expect(mediaEditor.controlsPanel).toBeVisible();

        await expect(mediaEditor.doneButton).toBeEnabled();
        await mediaEditor.doneButton.click();

        await expect(mediaEditor.header).toBeHidden();
        await expect(picture.originalSizeLabel).toHaveText(ORIGINAL_SIZE);
    });

    test('rotating previews each step, Cancel reverts it and Apply stores the rotated image', {
        annotation: [
            {type: 'confluence', description: '1315931420 complete'}, // Rotate image
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const picture = new PictureAuthoring(page);
        const mediaEditor = new MediaEditor(page);

        await openPicture(page);
        await picture.openImageEditor();

        await expect(mediaEditor.controlsToolbar).toBeHidden();

        await mediaEditor.control('rotate-left').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateZ\(-90deg\)/);
        await expect(mediaEditor.controlsToolbar.getByTestId('cancel')).toBeVisible();
        await expect(mediaEditor.controlsToolbar.getByTestId('apply')).toBeVisible();

        await mediaEditor.control('rotate-left').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateZ\(-180deg\)/);

        await mediaEditor.controlsToolbar.getByTestId('cancel').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateZ\(0deg\)/);
        await expect(mediaEditor.controlsToolbar).toBeHidden();

        await mediaEditor.control('rotate-right').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateZ\(90deg\)/);
        await mediaEditor.control('rotate-right').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateZ\(180deg\)/);
        await mediaEditor.control('rotate-left').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateZ\(90deg\)/);

        await mediaEditor.controlsToolbar.getByTestId('apply').click();
        await expect(mediaEditor.controlsToolbar).toBeHidden();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateZ\(0deg\)/);

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();

        // A quarter turn swaps the stored dimensions of the original rendition.
        await expect(picture.originalSizeLabel).toHaveText('Original (1050 x 2100 px)');

        await reopenPicture(page);
        await expect(picture.originalSizeLabel).toHaveText('Original (1050 x 2100 px)');
    });

    test('flipping previews each step, Cancel reverts it and Apply stores the flipped image', {
        annotation: [
            {type: 'confluence', description: '1315931422 complete'}, // Flip image
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const picture = new PictureAuthoring(page);
        const mediaEditor = new MediaEditor(page);

        await openPicture(page);

        const sourceBefore = await picture.previewImage.getAttribute('src');

        await picture.openImageEditor();

        await expect(mediaEditor.controlsToolbar).toBeHidden();

        await mediaEditor.control('flip-horizontal').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateY\(180deg\)/);
        await expect(mediaEditor.controlsToolbar.getByTestId('cancel')).toBeVisible();
        await expect(mediaEditor.controlsToolbar.getByTestId('apply')).toBeVisible();

        await mediaEditor.controlsToolbar.getByTestId('cancel').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateY\(0deg\)/);
        await expect(mediaEditor.controlsToolbar).toBeHidden();

        await mediaEditor.control('flip-vertical').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateX\(180deg\)/);
        await mediaEditor.control('flip-horizontal').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateY\(180deg\)/);
        await mediaEditor.control('flip-horizontal').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateY\(360deg\)/);

        await mediaEditor.controlsToolbar.getByTestId('apply').click();
        await expect(mediaEditor.controlsToolbar).toBeHidden();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateY\(0deg\) rotateX\(0deg\)/);

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();

        // A flip keeps the dimensions, so the only visible trace of it is that the
        // renditions were regenerated and now point at newly stored media.
        await expect(picture.originalSizeLabel).toHaveText(ORIGINAL_SIZE);
        await expect(picture.previewImage).not.toHaveAttribute('src', sourceBefore ?? '');

        await reopenPicture(page);
        await expect(picture.originalSizeLabel).toHaveText(ORIGINAL_SIZE);
        await expect(picture.previewImage).toBeVisible();
        await expect(picture.previewImage).not.toHaveAttribute('src', sourceBefore ?? '');
    });

    test('colour scales drive the preview, Cancel restores them and Apply recentres them', {
        annotation: [
            {type: 'confluence', description: '1315931424 complete'}, // Adjust colours
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const picture = new PictureAuthoring(page);
        const mediaEditor = new MediaEditor(page);

        await openPicture(page);

        const sourceBefore = await picture.previewImage.getAttribute('src');

        await picture.openImageEditor();

        await expect(mediaEditor.controlsToolbar).toBeHidden();

        await mediaEditor.slider('brightness').fill('1.5');
        await expect(mediaEditor.sliderValue('brightness')).toHaveText('50%');
        await expect(mediaEditor.controlsToolbar.getByTestId('cancel')).toBeVisible();
        await expect(mediaEditor.controlsToolbar.getByTestId('apply')).toBeVisible();

        await mediaEditor.controlsToolbar.getByTestId('cancel').click();
        await expect(mediaEditor.sliderValue('brightness')).toHaveText('0%');
        await expect(mediaEditor.slider('brightness')).toHaveValue('1');
        await expect(mediaEditor.controlsToolbar).toBeHidden();

        await mediaEditor.slider('brightness').fill('1.5');
        await mediaEditor.slider('contrast').fill('1.25');
        await mediaEditor.slider('saturation').fill('0.5');
        await expect(mediaEditor.sliderValue('brightness')).toHaveText('50%');
        await expect(mediaEditor.sliderValue('contrast')).toHaveText('25%');
        await expect(mediaEditor.sliderValue('saturation')).toHaveText('-50%');

        await mediaEditor.controlsToolbar.getByTestId('apply').click();
        await expect(mediaEditor.controlsToolbar).toBeHidden();

        // Apply bakes the adjustment into the stored image and recentres the scales.
        for (const control of ['brightness', 'contrast', 'saturation'] as const) {
            await expect(mediaEditor.sliderValue(control)).toHaveText('0%');
            await expect(mediaEditor.slider(control)).toHaveValue('1');
        }

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();

        await expect(picture.previewImage).not.toHaveAttribute('src', sourceBefore ?? '');

        await reopenPicture(page);
        await expect(picture.previewImage).toBeVisible();
        await expect(picture.previewImage).not.toHaveAttribute('src', sourceBefore ?? '');
    });

    test('cropping the original with the crop tool and the ratio buttons', {
        annotation: [
            {type: 'confluence', description: '1315931417 partial'}, // Crop image
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const picture = new PictureAuthoring(page);
        const mediaEditor = new MediaEditor(page);

        await openPicture(page);
        await picture.openImageEditor();

        await mediaEditor.control('crop').click();

        await expect(mediaEditor.cropToolbar.getByTestId('cancel')).toBeVisible();
        // The toolbar buttons are anchors carrying ng-disabled, so the disabled
        // state is an attribute rather than the form-control state toBeDisabled reads.
        await expect(mediaEditor.cropToolbar.getByTestId('confirm-crop')).toHaveAttribute('disabled');
        await expect(mediaEditor.cropPreview).toBeVisible();

        // Crop mode owns the whole image, so the other transforms and the colour
        // scales are out of reach until it is confirmed or cancelled.
        for (const control of ['rotate-left', 'rotate-right', 'flip-horizontal', 'flip-vertical'] as const) {
            await expect(mediaEditor.control(control)).toBeDisabled();
        }
        await expect(mediaEditor.adjustColours).toBeHidden();

        await mediaEditor.cropToolbar.getByTestId('cancel').click();
        await expect(mediaEditor.cropToolbar).toBeHidden();
        await expect(mediaEditor.adjustColours).toBeVisible();

        await mediaEditor.control('crop').click();
        await expect(mediaEditor.cropToolbar).toBeVisible();

        const fullSelection = await mediaEditor.cropSelection().boundingBox();

        await mediaEditor.resizeCrop(-160, -80);

        // Dragging the crop is the only interaction that marks it changed.
        await expect(mediaEditor.cropToolbar.getByTestId('confirm-crop')).not.toHaveAttribute('disabled');
        expect((await mediaEditor.cropSelection().boundingBox())?.width)
            .toBeLessThan(fullSelection?.width ?? 0);

        const cropWidth = mediaEditor.cropWidth();
        const cropHeight = mediaEditor.cropHeight();

        // The ratio buttons letterbox the 2100 x 1050 original: 16:9, 4:3 and 3:2 are
        // all taller than it is, so each keeps the full height and narrows the width.
        await mediaEditor.ratioButton('original').click();
        await expect(cropWidth).toHaveValue('2100');
        await expect(cropHeight).toHaveValue('1050');

        await mediaEditor.ratioButton('16:9').click();
        await expect(cropWidth).toHaveValue('1983');
        await expect(cropHeight).toHaveValue('1050');

        await mediaEditor.ratioButton('3:2').click();
        await expect(cropWidth).toHaveValue('1837');
        await expect(cropHeight).toHaveValue('1050');

        await mediaEditor.ratioButton('4:3').click();
        await expect(cropWidth).toHaveValue('1750');
        await expect(cropHeight).toHaveValue('1050');

        const ratioSelection = await mediaEditor.cropSelection().boundingBox();

        await cropWidth.fill('1200');
        await expect(async () => {
            expect((await mediaEditor.cropSelection().boundingBox())?.width)
                .toBeLessThan(ratioSelection?.width ?? 0);
        }).toPass();

        await mediaEditor.ratioButton('4:3').click();
        await expect(cropWidth).toHaveValue('1750');

        await mediaEditor.cropToolbar.getByTestId('confirm-crop').click();
        await expect(mediaEditor.cropToolbar).toBeHidden();
        await expect(mediaEditor.adjustColours).toBeVisible();

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();

        // 4:3 of a 2100 x 1050 original keeps the height and takes 1400 of the width.
        await expect(picture.originalSizeLabel).toHaveText('Original (1400 x 1050 px)');

        await reopenPicture(page);
        await expect(picture.originalSizeLabel).toHaveText('Original (1400 x 1050 px)');
    });

    test('editing a rendition crop and the point of interest', {
        annotation: [
            {type: 'confluence', description: '1311834326 partial'}, // Edit crops
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const picture = new PictureAuthoring(page);
        const mediaEditor = new MediaEditor(page);

        await openPicture(page);

        await expect(picture.crop('FIXME')).toBeVisible();

        const cropSourceBefore = await picture.crop('FIXME').locator('img').getAttribute('src');

        await picture.openCropsEditor();

        await expect(mediaEditor.header.getByRole('heading')).toHaveText('Edit Crops');
        await expect(mediaEditor.renditions).toHaveCount(2);
        await expect(mediaEditor.rendition('Original')).toBeVisible();
        await expect(mediaEditor.rendition('FIXME')).toBeVisible();

        // The original is previewed until a rendition is picked.
        await expect(mediaEditor.cropPreviewLabel).toHaveText(/Original\s+2100 x 1050/);

        await mediaEditor.rendition('FIXME').click();
        await expect(mediaEditor.cropPreviewLabel).toHaveText('FIXME');

        await mediaEditor.resizeCrop(-60, -45);
        await expect(mediaEditor.cropsToolbar.getByTestId('cancel')).toBeVisible();
        await expect(mediaEditor.cropsToolbar.getByTestId('save')).toBeVisible();

        await mediaEditor.cropsToolbar.getByTestId('cancel').click();
        await expect(mediaEditor.cropsToolbar).toBeHidden();

        await mediaEditor.resizeCrop(-60, -45);
        await mediaEditor.cropsToolbar.getByTestId('save').click();
        await expect(mediaEditor.cropsToolbar).toBeHidden();

        await mediaEditor.rendition('Original').click();
        await expect(mediaEditor.cropPreviewLabel).toHaveText(/Original\s+2100 x 1050/);

        await mediaEditor.setPointOfInterest(0.3, 0.3);
        await expect(mediaEditor.cropsToolbar.getByTestId('save')).toBeVisible();
        await mediaEditor.cropsToolbar.getByTestId('save').click();
        await expect(mediaEditor.cropsToolbar).toBeHidden();

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();

        await expect(picture.crop('FIXME')).toBeVisible();
        await expect(picture.crop('FIXME').locator('img')).not.toHaveAttribute('src', cropSourceBefore ?? '');

        await reopenPicture(page);
        await expect(picture.crop('FIXME').locator('img')).toBeVisible();
        await expect(picture.crop('FIXME').locator('img')).not.toHaveAttribute('src', cropSourceBefore ?? '');
    });
});
