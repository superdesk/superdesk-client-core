import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MediaEditor} from './page-object-models/media-editor';
import {PictureAuthoring} from './page-object-models/authoring';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA cases for the media editor of a picture item: opening it, cropping the
 * original, rotating, flipping, adjusting colours and editing rendition crops.
 *
 * Every test works on "Rivendell picture" from the `media-items` snapshot, the
 * only fixture picture with a full set of renditions. Its original is
 * 2100 x 1050 and the `crop_sizes` vocabulary defines a single crop size,
 * "4-3" (800 x 600), so the Edit crops tab lists exactly Original and 4-3.
 *
 * The live preview is checked through the CSS transform on the preview canvas.
 * A change that reached the server is checked through the stored original size,
 * or, for flips and colours, which keep the size, by comparing a downscaled copy
 * of the stored image with the one from before the edit.
 *
 * Uncovered expected results:
 *
 * - "Open image in Edit image mode" (1315931606) also expects the dialog to be
 *   reachable from a picture embedded in an editor3 body; no snapshot carries
 *   one and building it needs the upload flow.
 * - "Crop image" (1315931417) expects the Width and Height fields to default to
 *   the original size and to hold while the crop moves, and the ratio buttons
 *   and typed Width / Height values to activate Confirm crop. None of these
 *   holds: the fields are bound to `CropRight` / `CropBottom`, start empty, and
 *   only a jCrop drag sets `isAoIDirty` (`setRatio()` refreshes jCrop with its
 *   events disabled), so every confirmed cycle here starts with a drag.
 * - "Edit crops" (1311834326) expects a red message in place of a rendition the
 *   original is too small to produce; no fixture picture is smaller than the
 *   only configured crop. Its Cancel after a point-of-interest change hides the
 *   toolbar but leaves the point where it was moved (`cancelCrops()` restores
 *   the crop data only), so only the rendition-crop Cancel is checked to revert.
 */
// Every Apply and every confirmed crop is a round trip through the server-side
// image processing, and several tests do more than one.
test.setTimeout(180000);

test.describe('image editing', () => {
    const ORIGINAL_SIZE = 'Original (2100 x 1050 px)';

    const THUMB_WIDTH = 16;
    const THUMB_HEIGHT = 8;

    async function openPicture(page: Page): Promise<void> {
        const monitoring = new Monitoring(page);

        await page.goto('/#/workspace/monitoring');
        await monitoring.waitUntilReady();
        await monitoring.selectDeskOrWorkspace('Sports');
        await monitoring.getArticleLocator('Rivendell picture').dblclick();
    }

    /**
     * The `src` of a rendition, to compare against after an edit. Throws rather
     * than falling back to '', which would make every later "the renditions were
     * regenerated" assertion pass vacuously.
     */
    async function sourceOf(image: Locator): Promise<string> {
        const source = await image.getAttribute('src');

        if (source == null) {
            throw new Error('the rendition has no src to compare against');
        }

        return source;
    }

    /*
     * Every test leaves the picture open in authoring and therefore locked.
     * restoreDatabaseSnapshot() resolves even when the restore fails, so a test
     * inheriting a stale lock would fail on an unrelated assertion; closing the
     * item keeps each test independent.
     */
    test.afterEach(async ({page}) => {
        const close = page.getByTestId('authoring-topbar').getByTestId('close');

        if (await close.isVisible()) {
            await close.click({timeout: 15000});
            await expect(page.getByTestId('authoring-topbar')).toBeHidden();
        }
    });

    /**
     * Closes the media editor and waits for the edit to reach the server. The
     * editor persists nothing itself: resolving it makes ArticleEditDirective's
     * editMedia() call `scope.save()`, and nothing in the UI blocks on that
     * PATCH, so a Close issued meanwhile unlocks the item and the in-flight save
     * is rejected. Only call this when the editor holds a change: with nothing
     * dirty `done()` rejects the modal, no save is issued and there is no PATCH
     * to wait for.
     */
    async function applyMediaEdits(page: Page, mediaEditor: MediaEditor): Promise<void> {
        const saved = page.waitForResponse(
            (response) => response.request().method() === 'PATCH' && response.url().includes('/archive/'),
        );

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();
        await saved;
    }

    /**
     * The stored image at `url`, scaled down to a 16 x 8 grid of RGBA values. The
     * scaling averages away JPEG re-encoding noise, so two grids differ only where
     * the image content does. The bytes are fetched outside the page because the
     * media server sends no CORS headers, and decoded inside it.
     */
    async function thumbnailPixels(page: Page, url: string): Promise<Array<number>> {
        const response = await page.request.get(url);

        expect(response.ok()).toBe(true);

        const base64 = (await response.body()).toString('base64');

        return page.evaluate(async ({encoded, width, height}) => {
            const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
            const bitmap = await createImageBitmap(new Blob([bytes]));
            const context = new OffscreenCanvas(width, height).getContext('2d');

            if (context == null) {
                throw new Error('no 2d canvas context');
            }

            context.drawImage(bitmap, 0, 0, width, height);

            return Array.from(context.getImageData(0, 0, width, height).data);
        }, {encoded: base64, width: THUMB_WIDTH, height: THUMB_HEIGHT});
    }

    /** Mean per-channel difference between `after` and `before` read at `map(x, y)`. */
    function meanDifference(
        after: Array<number>,
        before: Array<number>,
        map: (x: number, y: number) => [number, number],
    ): number {
        let total = 0;

        for (let y = 0; y < THUMB_HEIGHT; y++) {
            for (let x = 0; x < THUMB_WIDTH; x++) {
                const [beforeX, beforeY] = map(x, y);

                for (let channel = 0; channel < 3; channel++) {
                    total += Math.abs(
                        after[(y * THUMB_WIDTH + x) * 4 + channel]
                        - before[(beforeY * THUMB_WIDTH + beforeX) * 4 + channel],
                    );
                }
            }
        }

        return total / (THUMB_WIDTH * THUMB_HEIGHT * 3);
    }

    /** Mean spread between the strongest and weakest colour channel; 0 for a grey image. */
    function meanChroma(pixels: Array<number>): number {
        let total = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const rgb = pixels.slice(i, i + 3);

            total += Math.max(...rgb) - Math.min(...rgb);
        }

        return total / (pixels.length / 4);
    }

    function meanLightness(pixels: Array<number>): number {
        let total = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            total += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        }

        return total / (pixels.length / 4);
    }

    /**
     * Where the point-of-interest cursor of the Edit crops preview sits, as a fraction
     * of the previewed image, which is how the item stores it (`poi.x`, `poi.y`).
     */
    async function pointOfInterest(mediaEditor: MediaEditor): Promise<{x: number; y: number}> {
        const preview = mediaEditor.pointOfInterestPreview;
        const cursor = await preview.locator('.image-point__poi__cursor').boundingBox();
        const image = await preview.locator('.image-point__image').boundingBox();

        if (cursor == null || image == null) {
            throw new Error('the point of interest preview is not rendered');
        }

        return {
            x: Math.round((cursor.x + cursor.width / 2 - image.x) / image.width * 100) / 100,
            y: Math.round((cursor.y + cursor.height / 2 - image.y) / image.height * 100) / 100,
        };
    }

    async function reopenPicture(page: Page): Promise<void> {
        await page.getByTestId('authoring-topbar').getByTestId('close').click();
        await expect(page.getByTestId('authoring-topbar')).toBeHidden();

        await new Monitoring(page).getArticleLocator('Rivendell picture').dblclick();
    }

    test('the media editor offers the three tabs, the image controls and the colour scales', {
        annotation: [
            {type: 'confluence', description: '1315931606 partial'}, // Open image in Edit image mode
            // Adjust colours: only its first expected result, the range of the three
            // scales. The rest of the case is covered by the colour test below.
            {type: 'confluence', description: '1315931424 partial'},
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

        // Copy / Paste metadata are rendered under the Details / Metadata tab only.
        await expect(mediaEditor.copyMetadataButton).toBeHidden();
        await expect(mediaEditor.pasteMetadataButton).toBeHidden();

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
        await expect(mediaEditor.copyMetadataButton).toBeVisible();
        await expect(mediaEditor.pasteMetadataButton).toBeVisible();
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

        await applyMediaEdits(page, mediaEditor);

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

        const sourceBefore = await sourceOf(picture.previewImage);
        const pixelsBefore = await thumbnailPixels(page, sourceBefore);

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

        await applyMediaEdits(page, mediaEditor);

        // Two horizontal flips cancel out, so what was applied is one vertical flip:
        // the stored image matches the old one mirrored top to bottom, and not the
        // old one as it was.
        async function expectStoredFlippedVertically(): Promise<void> {
            await expect(picture.originalSizeLabel).toHaveText(ORIGINAL_SIZE);
            await expect(picture.previewImage).toBeVisible();
            await expect(picture.previewImage).not.toHaveAttribute('src', sourceBefore);

            const pixelsAfter = await thumbnailPixels(page, await sourceOf(picture.previewImage));

            expect(meanDifference(pixelsAfter, pixelsBefore, (x, y) => [x, THUMB_HEIGHT - 1 - y]))
                .toBeLessThan(10);
            expect(meanDifference(pixelsAfter, pixelsBefore, (x, y) => [x, y])).toBeGreaterThan(30);
        }

        await expectStoredFlippedVertically();

        await reopenPicture(page);
        await expectStoredFlippedVertically();
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

        const sourceBefore = await sourceOf(picture.previewImage);
        const pixelsBefore = await thumbnailPixels(page, sourceBefore);

        // the fixture is a colour photo, so a stored image without colour can only
        // come from the saturation change below
        expect(meanChroma(pixelsBefore)).toBeGreaterThan(20);

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
        await mediaEditor.slider('saturation').fill('0');
        await expect(mediaEditor.sliderValue('brightness')).toHaveText('50%');
        await expect(mediaEditor.sliderValue('contrast')).toHaveText('25%');
        await expect(mediaEditor.sliderValue('saturation')).toHaveText('-100%');

        await mediaEditor.controlsToolbar.getByTestId('apply').click();
        await expect(mediaEditor.controlsToolbar).toBeHidden();

        // Apply bakes the adjustment into the stored image and recentres the scales.
        for (const control of ['brightness', 'contrast', 'saturation'] as const) {
            await expect(mediaEditor.sliderValue(control)).toHaveText('0%');
            await expect(mediaEditor.slider(control)).toHaveValue('1');
        }

        await applyMediaEdits(page, mediaEditor);

        // Saturation at -100% leaves a grey image; the added brightness lifts it.
        async function expectStoredGreyAndBrighter(): Promise<void> {
            await expect(picture.previewImage).toBeVisible();
            await expect(picture.previewImage).not.toHaveAttribute('src', sourceBefore);

            const pixelsAfter = await thumbnailPixels(page, await sourceOf(picture.previewImage));

            expect(meanChroma(pixelsAfter)).toBeLessThan(2);
            expect(meanLightness(pixelsAfter)).toBeGreaterThan(meanLightness(pixelsBefore));
        }

        await expectStoredGreyAndBrighter();

        await reopenPicture(page);
        await expectStoredGreyAndBrighter();
    });

    test('cropping the original twice with the crop tool and the ratio buttons', {
        annotation: [
            {type: 'confluence', description: '1315931417 partial'}, // Crop image
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const CROPPED_SIZE = 'Original (1400 x 788 px)';
        const picture = new PictureAuthoring(page);
        const mediaEditor = new MediaEditor(page);

        await openPicture(page);
        await picture.openImageEditor();

        await mediaEditor.control('crop').click();

        await expect(mediaEditor.confirmCropToolbar.getByTestId('cancel')).toBeVisible();
        // The toolbar buttons are anchors carrying ng-disabled, so the disabled
        // state is an attribute rather than the form-control state toBeDisabled reads.
        await expect(mediaEditor.confirmCropToolbar.getByTestId('confirm-crop')).toHaveAttribute('disabled');
        await expect(mediaEditor.areaOfInterestPreview).toBeVisible();

        // Crop mode owns the whole image, so the other transforms and the colour
        // scales are out of reach until it is confirmed or cancelled.
        for (const control of ['rotate-left', 'rotate-right', 'flip-horizontal', 'flip-vertical'] as const) {
            await expect(mediaEditor.control(control)).toBeDisabled();
        }
        // Crop stays enabled: it is only disabled while a rotate, flip or colour
        // change is pending, which crop mode makes unreachable anyway.
        await expect(mediaEditor.control('crop')).toBeEnabled();
        await expect(mediaEditor.adjustColours).toBeHidden();

        await mediaEditor.confirmCropToolbar.getByTestId('cancel').click();
        await expect(mediaEditor.confirmCropToolbar).toBeHidden();
        await expect(mediaEditor.adjustColours).toBeVisible();

        await mediaEditor.control('crop').click();
        await expect(mediaEditor.confirmCropToolbar).toBeVisible();

        const fullSelection = await mediaEditor.areaOfInterestSelection.boundingBox();
        const cropWidth = mediaEditor.cropWidth;
        const cropHeight = mediaEditor.cropHeight;

        await expect(cropWidth).toHaveValue('');
        await expect(cropHeight).toHaveValue('');

        await mediaEditor.resizeAreaOfInterest(-160, -80);

        // Dragging the crop is the only interaction that marks it changed.
        await expect(mediaEditor.confirmCropToolbar.getByTestId('confirm-crop')).not.toHaveAttribute('disabled');
        expect((await mediaEditor.areaOfInterestSelection.boundingBox())?.width)
            .toBeLessThan(fullSelection?.width ?? 0);

        // The two fields follow the mouse: jCrop reports the dragged corner through
        // `onSelect`, which writes it into `CropRight` / `CropBottom`. Dragging the
        // bottom-right handle inwards therefore leaves both inside the original.
        await expect(async () => {
            expect(Number(await cropWidth.inputValue())).toBeGreaterThan(0);
            expect(Number(await cropWidth.inputValue())).toBeLessThan(2100);
            expect(Number(await cropHeight.inputValue())).toBeGreaterThan(0);
            expect(Number(await cropHeight.inputValue())).toBeLessThan(1050);
        }).toPass();

        // The ratio buttons letterbox the 2100 x 1050 original: 16:9, 4:3 and 3:2 are
        // all taller than it is, so each keeps the full height and narrows the width,
        // centred. The Width field is bound to the crop's right edge, not its width,
        // so it shows (2100 + width) / 2: 1983 for 16:9 (1867 wide), 1837 for 3:2
        // (1575 wide) and 1750 for 4:3 (1400 wide, the size stored below).
        await mediaEditor.ratioButton('Original').click();
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

        const ratioSelection = await mediaEditor.areaOfInterestSelection.boundingBox();

        await cropWidth.fill('1200');
        await expect(async () => {
            expect((await mediaEditor.areaOfInterestSelection.boundingBox())?.width)
                .toBeLessThan(ratioSelection?.width ?? 0);
        }).toPass();

        await mediaEditor.ratioButton('4:3').click();
        await expect(cropWidth).toHaveValue('1750');

        await mediaEditor.confirmCropToolbar.getByTestId('confirm-crop').click();
        await expect(mediaEditor.confirmCropToolbar).toBeHidden();
        await expect(mediaEditor.adjustColours).toBeVisible();

        // A second crop of the result of the first: crop mode starts clean again, and
        // 16:9 of the now 1400 x 1050 image keeps the width and narrows the height.
        await mediaEditor.control('crop').click();
        await expect(mediaEditor.confirmCropToolbar.getByTestId('confirm-crop')).toHaveAttribute('disabled');

        await mediaEditor.resizeAreaOfInterest(-80, -40);
        await expect(mediaEditor.confirmCropToolbar.getByTestId('confirm-crop')).not.toHaveAttribute('disabled');

        await mediaEditor.ratioButton('16:9').click();
        await mediaEditor.confirmCropToolbar.getByTestId('confirm-crop').click();
        await expect(mediaEditor.confirmCropToolbar).toBeHidden();

        await applyMediaEdits(page, mediaEditor);

        await expect(picture.originalSizeLabel).toHaveText(CROPPED_SIZE);

        await reopenPicture(page);
        await expect(picture.originalSizeLabel).toHaveText(CROPPED_SIZE);
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

        await expect(picture.crop('4-3')).toBeVisible();

        const cropSourceBefore = await sourceOf(picture.crop('4-3').locator('img'));

        await picture.openCropsEditor();

        await expect(mediaEditor.header.getByRole('heading')).toHaveText('Edit Crops');
        await expect(mediaEditor.renditions).toHaveCount(2);
        await expect(mediaEditor.rendition('Original')).toBeVisible();
        await expect(mediaEditor.rendition('4-3')).toBeVisible();

        // The original is previewed until a rendition is picked.
        await expect(mediaEditor.cropPreviewLabel).toHaveText(/Original\s+2100 x 1050/);

        await mediaEditor.rendition('4-3').click();
        await expect(mediaEditor.cropPreviewLabel).toHaveText('4-3');

        const renditionSelection = mediaEditor.renditionCropPreview.locator('.jcrop-holder > div').first();
        const storedSelection = await renditionSelection.boundingBox();

        await mediaEditor.resizeRenditionCrop(-60, -45);
        await expect(mediaEditor.saveCropsToolbar.getByTestId('cancel')).toBeVisible();
        await expect(mediaEditor.saveCropsToolbar.getByTestId('save')).toBeVisible();
        expect((await renditionSelection.boundingBox())?.width).toBeLessThan(storedSelection?.width ?? 0);

        await mediaEditor.saveCropsToolbar.getByTestId('cancel').click();
        await expect(mediaEditor.saveCropsToolbar).toBeHidden();
        await expect.poll(() => renditionSelection.boundingBox()).toEqual(storedSelection);

        await mediaEditor.resizeRenditionCrop(-60, -45);
        await mediaEditor.saveCropsToolbar.getByTestId('save').click();
        await expect(mediaEditor.saveCropsToolbar).toBeHidden();

        await mediaEditor.rendition('Original').click();
        await expect(mediaEditor.cropPreviewLabel).toHaveText(/Original\s+2100 x 1050/);

        // the fixture has no point of interest of its own, so it sits in the centre
        await expect.poll(() => pointOfInterest(mediaEditor)).toEqual({x: 0.5, y: 0.5});

        await mediaEditor.setPointOfInterest(0.3, 0.3);
        await expect(mediaEditor.saveCropsToolbar.getByTestId('cancel')).toBeVisible();
        await expect(mediaEditor.saveCropsToolbar.getByTestId('save')).toBeVisible();

        await mediaEditor.saveCropsToolbar.getByTestId('cancel').click();
        await expect(mediaEditor.saveCropsToolbar).toBeHidden();

        await mediaEditor.setPointOfInterest(0.7, 0.4);
        await expect(mediaEditor.saveCropsToolbar.getByTestId('save')).toBeVisible();
        await mediaEditor.saveCropsToolbar.getByTestId('save').click();
        await expect(mediaEditor.saveCropsToolbar).toBeHidden();

        await applyMediaEdits(page, mediaEditor);

        await expect(picture.crop('4-3')).toBeVisible();
        await expect(picture.crop('4-3').locator('img')).toBeVisible();
        await expect(picture.crop('4-3').locator('img')).not.toHaveAttribute('src', cropSourceBefore);

        await reopenPicture(page);
        await expect(picture.crop('4-3').locator('img')).toBeVisible();
        await expect(picture.crop('4-3').locator('img')).not.toHaveAttribute('src', cropSourceBefore);

        await picture.openCropsEditor();
        await expect(mediaEditor.cropPreviewLabel).toHaveText(/Original\s+2100 x 1050/);
        await expect.poll(() => pointOfInterest(mediaEditor)).toEqual({x: 0.7, y: 0.4});

        await mediaEditor.doneButton.click();
        await expect(mediaEditor.header).toBeHidden();
    });
});
