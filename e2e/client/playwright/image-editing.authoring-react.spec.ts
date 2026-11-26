import {test, expect, type Locator, type Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {MediaEditor} from './page-object-models/media-editor';
import {PictureAuthoringReact} from './page-object-models/authoring-react';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

/**
 * QA cases for editing a picture item in authoring-react: the media editor itself is the
 * angular dialog that `image-editing.spec.ts` covers step by step, so these tests cover what
 * authoring-react owns: the entry points on the `_media_self` field, carrying the editor's
 * result into the open item, and saving it.
 *
 * Every test works on "Rivendell picture" (2100 x 1050, one "4-3" crop) from `media-items`.
 * A stored change is read back after closing and reopening the item.
 */
test.use({storageState: getStorageState({}, {authoringReact: true})});

// Every Apply is a round trip through the server-side image processing.
test.setTimeout(90000);

const THUMB_WIDTH = 16;
const THUMB_HEIGHT = 8;

async function openPicture(page: Page): Promise<PictureAuthoringReact> {
    const monitoring = new Monitoring(page);
    const picture = new PictureAuthoringReact(page);

    await monitoring.openMonitoringForDesk('Sports');
    await monitoring.editItem(monitoring.getArticleLocator('Rivendell picture'), picture.mediaField);

    return picture;
}

async function saveAndReopen(page: Page): Promise<void> {
    await new PictureAuthoringReact(page).saveAndClose();
    await openPicture(page);
}

async function srcOf(image: Locator): Promise<string> {
    const source = await image.getAttribute('src');

    if (source == null) {
        throw new Error('the image has no src');
    }

    return source;
}

// Downscaling averages away JPEG re-encoding noise. Fetched outside the page: the media server sends no CORS headers.
async function thumbnailPixels(page: Page, url: string): Promise<Array<number>> {
    const response = await page.request.get(url);

    expect(response.ok()).toBe(true);

    const encoded = (await response.body()).toString('base64');

    return page.evaluate(async ({data, width, height}) => {
        const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes]));
        const context = new OffscreenCanvas(width, height).getContext('2d');

        if (context == null) {
            throw new Error('no 2d canvas context');
        }

        context.drawImage(bitmap, 0, 0, width, height);

        return Array.from(context.getImageData(0, 0, width, height).data);
    }, {data: encoded, width: THUMB_WIDTH, height: THUMB_HEIGHT});
}

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

function meanChroma(pixels: Array<number>): number {
    let total = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const rgb = pixels.slice(i, i + 3);

        total += Math.max(...rgb) - Math.min(...rgb);
    }

    return total / (pixels.length / 4);
}

test.describe('image editing (authoring-react)', () => {
    test('the picture offers the three editor entry points and Edit image opens the image tab', {
        annotation: [
            {type: 'confluence', description: '1315931606 partial'}, // Open image in Edit image mode
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const mediaEditor = new MediaEditor(page);
        const picture = await openPicture(page);

        await expect(picture.mediaField).toContainText('2100 x 1050 px');

        await picture.hoverImage();

        for (const action of ['Edit metadata', 'Edit image', 'Edit crops'] as const) {
            await expect(picture.mediaAction(action)).toBeVisible();
        }

        await picture.openMediaEditor('Edit image');

        await expect(mediaEditor.header.getByRole('heading')).toHaveText('Edit image');
        await expect(mediaEditor.controlsPanel).toBeVisible();
        await expect(mediaEditor.preview).toBeVisible();

        for (const control of ['crop', 'rotate-left', 'rotate-right', 'flip-horizontal', 'flip-vertical'] as const) {
            await expect(mediaEditor.control(control)).toBeEnabled();
        }

        for (const control of ['brightness', 'contrast', 'saturation'] as const) {
            await expect(mediaEditor.sliderValue(control)).toHaveText('0%');
        }

        await mediaEditor.tab('view').click();
        await expect(mediaEditor.metadataField('headline')).toBeVisible();
        await mediaEditor.tab('crop').click();
        await expect(mediaEditor.header.getByRole('heading')).toHaveText('Edit Crops');

        await picture.closeMediaEditor();

        await expect(picture.mediaField).toContainText('2100 x 1050 px');
    });

    test('a rotated image is shown in the item and stored on save', {
        annotation: [
            {type: 'confluence', description: '1315931420 complete'}, // Rotate image
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const mediaEditor = new MediaEditor(page);
        const picture = await openPicture(page);

        await picture.openMediaEditor('Edit image');

        await mediaEditor.control('rotate-right').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateZ\(90deg\)/);
        await mediaEditor.controlsToolbar.getByTestId('apply').click();
        await expect(mediaEditor.controlsToolbar).toBeHidden();

        await picture.closeMediaEditor();

        // A quarter turn swaps the dimensions of the original rendition.
        await expect(picture.mediaField).toContainText('1050 x 2100 px');

        await saveAndReopen(page);

        await expect(picture.mediaField).toContainText('1050 x 2100 px');
    });

    test('a vertically flipped image is stored on save', {
        annotation: [
            {type: 'confluence', description: '1315931422 complete'}, // Flip image
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const mediaEditor = new MediaEditor(page);
        const picture = await openPicture(page);

        const sourceBefore = await srcOf(picture.image);
        const pixelsBefore = await thumbnailPixels(page, sourceBefore);

        await picture.openMediaEditor('Edit image');
        await mediaEditor.control('flip-vertical').click();
        await expect(mediaEditor.preview).toHaveAttribute('style', /rotateX\(180deg\)/);
        await mediaEditor.controlsToolbar.getByTestId('apply').click();
        await expect(mediaEditor.controlsToolbar).toBeHidden();
        await picture.closeMediaEditor();

        await saveAndReopen(page);

        await expect(picture.mediaField).toContainText('2100 x 1050 px');
        await expect(picture.image).not.toHaveAttribute('src', sourceBefore);

        const pixelsAfter = await thumbnailPixels(page, await srcOf(picture.image));

        expect(meanDifference(pixelsAfter, pixelsBefore, (x, y) => [x, THUMB_HEIGHT - 1 - y])).toBeLessThan(10);
        expect(meanDifference(pixelsAfter, pixelsBefore, (x, y) => [x, y])).toBeGreaterThan(30);
    });

    test('a desaturated image is stored on save', {
        annotation: [
            {type: 'confluence', description: '1315931424 complete'}, // Adjust colours
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const mediaEditor = new MediaEditor(page);
        const picture = await openPicture(page);

        const sourceBefore = await srcOf(picture.image);

        expect(meanChroma(await thumbnailPixels(page, sourceBefore))).toBeGreaterThan(20);

        await picture.openMediaEditor('Edit image');
        await mediaEditor.slider('saturation').fill('0');
        await expect(mediaEditor.sliderValue('saturation')).toHaveText('-100%');
        await mediaEditor.controlsToolbar.getByTestId('apply').click();
        await expect(mediaEditor.controlsToolbar).toBeHidden();
        await expect(mediaEditor.sliderValue('saturation')).toHaveText('0%');
        await picture.closeMediaEditor();

        await saveAndReopen(page);

        await expect(picture.image).not.toHaveAttribute('src', sourceBefore);
        expect(meanChroma(await thumbnailPixels(page, await srcOf(picture.image)))).toBeLessThan(2);
    });

    test('a cropped original is shown in the item and stored on save', {
        annotation: [
            {type: 'confluence', description: '1315931417 complete'}, // Crop image
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const mediaEditor = new MediaEditor(page);
        const picture = await openPicture(page);

        await picture.openMediaEditor('Edit image');

        await mediaEditor.control('crop').click();
        await expect(mediaEditor.areaOfInterestPreview).toBeVisible();
        await mediaEditor.ratioButton('16:9').click();
        await mediaEditor.resizeAreaOfInterest(-160, -90);

        const confirmCrop = mediaEditor.confirmCropToolbar.getByTestId('confirm-crop');

        await expect(confirmCrop).not.toHaveAttribute('disabled');
        await confirmCrop.click();
        await expect(mediaEditor.confirmCropToolbar).toBeHidden();
        await picture.closeMediaEditor();

        await expect(picture.mediaField).not.toContainText('2100 x 1050 px');

        const sizeInItem = (await picture.mediaField.textContent())?.match(/(\d+) x (\d+) px/);

        expect(sizeInItem).not.toBeNull();
        expect(Number(sizeInItem?.[1])).toBeLessThan(2100);

        await saveAndReopen(page);

        await expect(picture.mediaField).toContainText(`${sizeInItem?.[1]} x ${sizeInItem?.[2]} px`);
    });

    test('a resized rendition crop is shown in the item and stored on save', {
        annotation: [
            {type: 'confluence', description: '1311834326 complete'}, // Edit crops
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'media-items'});

        const mediaEditor = new MediaEditor(page);
        const picture = await openPicture(page);

        await picture.toggleCrops();
        await expect(picture.crop('4-3')).toBeVisible();

        const cropBefore = await srcOf(picture.crop('4-3'));

        await picture.openMediaEditor('Edit crops');
        await expect(mediaEditor.header.getByRole('heading')).toHaveText('Edit Crops');

        await mediaEditor.rendition('4-3').click();
        await expect(mediaEditor.cropPreviewLabel).toHaveText('4-3');
        await mediaEditor.resizeRenditionCrop(-60, -45);
        await mediaEditor.saveCropsToolbar.getByTestId('save').click();
        await expect(mediaEditor.saveCropsToolbar).toBeHidden();
        await picture.closeMediaEditor();

        await expect(picture.crop('4-3')).not.toHaveAttribute('src', cropBefore);

        const cropInItem = await srcOf(picture.crop('4-3'));

        await saveAndReopen(page);

        await picture.toggleCrops();
        await expect(picture.crop('4-3')).toHaveAttribute('src', cropInItem);
    });
});
