import {Locator, Page} from '@playwright/test';
import {s} from '../utils';

type ImageControl = 'crop' | 'rotate-left' | 'rotate-right' | 'flip-horizontal' | 'flip-vertical';
type ColourControl = 'brightness' | 'contrast' | 'saturation';
type MediaEditorTab = 'view' | 'image-edit' | 'crop';

/**
 * The full-screen media editor (`change-image.html`), shared by its three tabs:
 * Details / Metadata, Edit image and Edit crops.
 */
export class MediaEditor {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    field(field: string): Locator {
        return this.page.locator(s('media-metadata-editor', field)).getByRole('textbox');
    }

    async saveMetadata(): Promise<void> {
        await this.page.locator(s('media-editor', 'apply-metadata-button')).click();
        await this.page.locator(s('change-image', 'done')).click();
    }

    get header(): Locator {
        return this.page.getByTestId('change-image');
    }

    get body(): Locator {
        return this.page.getByTestId('media-editor');
    }

    /**
     * A row of the Details / Metadata tab. Rows are addressed by field because
     * `media-metadata-editor` sits on the repeated row, not on a single wrapper.
     */
    metadataField(field: string): Locator {
        return this.body.getByTestId(`field--${field}`);
    }

    get controlsPanel(): Locator {
        return this.body.getByTestId('controls-panel');
    }

    get adjustColours(): Locator {
        return this.controlsPanel.getByTestId('adjust-colours');
    }

    /** Cancel / Apply, shown while a rotate, flip or colour change is pending. */
    get controlsToolbar(): Locator {
        return this.controlsPanel.getByTestId('controls-toolbar');
    }

    /** Cancel / Confirm crop, shown while the original image is being cropped. */
    get cropToolbar(): Locator {
        return this.controlsPanel.getByTestId('crop-toolbar');
    }

    /** Cancel / Save, shown while a rendition crop or the point of interest is pending. */
    get cropsToolbar(): Locator {
        return this.body.getByTestId('crops-toolbar');
    }

    /** The canvas the Edit image tab draws the live preview on. */
    get preview(): Locator {
        return this.body.getByTestId('image-modify-canvas');
    }

    /** The jCrop-driven image, both in crop mode and on the Edit crops tab. */
    get cropPreview(): Locator {
        return this.body.getByTestId('crop-preview');
    }

    get cropPreviewLabel(): Locator {
        return this.body.getByTestId('crop-preview-label');
    }

    get renditions(): Locator {
        return this.body.getByTestId('renditions-strip').getByTestId('rendition-item');
    }

    get doneButton(): Locator {
        return this.header.getByTestId('done');
    }

    tab(tab: MediaEditorTab): Locator {
        return this.header.getByTestId(`nav-${tab}`);
    }

    control(control: ImageControl): Locator {
        return this.controlsPanel.getByTestId(`${control}-button`);
    }

    slider(control: ColourControl): Locator {
        return this.adjustColours.getByTestId(`${control}-slider`);
    }

    /** The percentage readout next to a colour slider. */
    sliderValue(control: ColourControl): Locator {
        return this.adjustColours.getByTestId(`${control}-value`);
    }

    /** Bound to the crop's right edge rather than to a width, so it is empty until jCrop reports a selection. */
    get cropWidth(): Locator {
        return this.controlsPanel.getByTestId('crop-width');
    }

    /** Bound to the crop's bottom edge rather than to a height, so it is empty until jCrop reports a selection. */
    get cropHeight(): Locator {
        return this.controlsPanel.getByTestId('crop-height');
    }

    /** Copy metadata / Paste metadata, rendered only on the Details / Metadata tab. */
    get copyMetadataButton(): Locator {
        return this.body.getByTestId('copy-metadata');
    }

    get pasteMetadataButton(): Locator {
        return this.body.getByTestId('paste-metadata');
    }

    ratioButton(ratio: 'original' | '16:9' | '4:3' | '3:2'): Locator {
        return this.controlsPanel.getByTestId('ratio').and(this.page.locator(`[data-test-value="${ratio}"]`));
    }

    rendition(name: string): Locator {
        return this.renditions.and(this.page.locator(`[data-test-value="${name}"]`));
    }

    /**
     * jCrop is a third-party widget that renders no test ids, so its selection box
     * and resize handles have to be addressed by the class names it hard-codes.
     * The selection box is jCrop's first child; its size is the crop in preview pixels.
     */
    get cropSelection(): Locator {
        return this.cropPreview.locator('.jcrop-holder > div').first();
    }

    /**
     * Resizes the crop by dragging the bottom-right jCrop handle. Only a drag that
     * jCrop reports through its `onSelect` callback marks the crop dirty, which is
     * why the ratio buttons and the width/height fields cannot stand in for it.
     */
    async resizeCrop(dx: number, dy: number): Promise<void> {
        await this.dragBy(this.cropPreview.locator('.jcrop-holder .ord-se.jcrop-handle'), dx, dy);
    }

    /** Sets the point of interest by clicking the overlay of the Edit crops preview. */
    async setPointOfInterest(fractionX: number, fractionY: number): Promise<void> {
        const overlay = this.cropPreview.locator('.image-point__poi__overlay');
        const box = await overlay.boundingBox();

        if (box == null) {
            throw new Error('the point of interest overlay is not rendered');
        }

        await this.page.mouse.click(box.x + box.width * fractionX, box.y + box.height * fractionY);
    }

    private async dragBy(target: Locator, dx: number, dy: number): Promise<void> {
        const box = await target.boundingBox();

        if (box == null) {
            throw new Error('the crop handle is not rendered');
        }

        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;

        await this.page.mouse.move(x, y);
        await this.page.mouse.down();
        // jCrop tracks document mousemove, so the drag needs intermediate positions
        await this.page.mouse.move(x + dx, y + dy, {steps: 10});
        await this.page.mouse.up();
    }
}
