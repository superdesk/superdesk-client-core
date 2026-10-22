import {FileChooser, Locator, Page, expect} from '@playwright/test';
import {s} from '../utils';
import fs from 'fs';
import path from 'path';

/**
 * Upload sources owned by the Playwright suite. Resolved from `__dirname` rather
 * than the process cwd, so a run started from the repository root reads the same
 * files as one started from `e2e/client`.
 */
const TEST_FILE_DIR = path.resolve(__dirname, '..', '..', 'test-files');

/**
 * Repo-root `fixtures/` is the Karma unit-test asset directory (`karma.conf.js`
 * serves `fixtures/**` to the unit tests). It already carries image and video
 * sources with and without embedded metadata, so the upload specs read those from
 * here rather than copying a second set into `test-files`. Anything the specs need
 * that is not already there belongs in `test-files`, not in this directory.
 */
const FIXTURE_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'fixtures');

/**
 * A file handed to the upload screen, either dropped on the drop area or picked
 * through the file dialog. The upload screen takes the media type from `mimeType`
 * and tells items apart by `name`; neither is read back out of the bytes.
 *
 * This is also the shape `FileChooser.setFiles` accepts, so the same payload works
 * for both entry modes.
 */
export interface IUploadFile {
    name: string;
    mimeType: string;
    buffer: Buffer;
}

/**
 * A payload over a file in `e2e/client/test-files`.
 *
 * `name` defaults to the file's own name. Passing a different one is how a
 * multi-file upload is built from a single fixture: the screen keeps one item per
 * name, so the same bytes under two names are two files to it.
 */
export function testFile(filename: string, mimeType: string, name: string = filename): IUploadFile {
    return {name, mimeType, buffer: fs.readFileSync(path.join(TEST_FILE_DIR, filename))};
}

/** A payload over a media file in the repo-root `fixtures` directory. */
export function mediaFixture(filename: string, mimeType: string, name: string = filename): IUploadFile {
    return {name, mimeType, buffer: fs.readFileSync(path.join(FIXTURE_DIR, filename))};
}

export class MediaUpload {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async selectFile(filename: string): Promise<void> {
        await this.page.locator(s('file-upload', 'select-file-button')).click();
        await this.page.locator(s('file-upload', 'image-upload-input'))
            .setInputFiles(path.join(TEST_FILE_DIR, filename));
    }

    /**
     * Clicks "Select them from folder" and returns the file dialog it opens.
     *
     * `selectFile` fills the hidden `<input type="file">` directly; going through
     * the chooser instead exercises the button a user actually clicks and exposes
     * `isMultiple()`, which is the only handle on whether the input accepts a
     * multi-file selection. The chooser must be consumed: an unanswered one leaves
     * the input waiting and every later interaction blocked.
     */
    async openFilePicker(): Promise<FileChooser> {
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.getModal().getByTestId('select-file-button').click(),
        ]);

        return fileChooser;
    }

    /** Adds files to the upload through the "Select them from folder" dialog. */
    async selectFiles(files: Array<IUploadFile>): Promise<void> {
        const filePicker = await this.openFilePicker();

        await filePicker.setFiles(files);
    }

    async startUpload(): Promise<void> {
        await this.page.locator(s('file-upload', 'multi-image-edit--start-upload')).click();
    }

    getModal(): Locator {
        return this.page.getByTestId('file-upload');
    }

    getDropArea(): Locator {
        return this.getModal().getByTestId('drag-area');
    }

    getUploadButton(): Locator {
        return this.getModal().getByTestId('multi-image-edit--start-upload');
    }

    getCancelButton(): Locator {
        return this.getModal().getByTestId('multi-image-edit--cancel-upload');
    }

    getSelectedDesk(): Locator {
        return this.getModal().getByTestId('upload-selected-desk');
    }

    /**
     * Items already added to the upload, one per file waiting to be uploaded.
     */
    getItems(): Locator {
        return this.getModal().getByTestId('media-grid-item');
    }

    /**
     * Adds a file from `test-files` to the upload by dropping it on the drop area.
     */
    async dropFile(filename: string, mimeType: string = 'image/jpeg'): Promise<void> {
        await this.dropFiles([testFile(filename, mimeType)]);
    }

    /**
     * Drops files on the drop area in one gesture, the way an OS multi-file drag
     * does. Each file carries its own name and MIME type, which is what makes a
     * mixed-type drop expressible at all.
     *
     * A real OS drag-and-drop cannot be driven from Playwright, so the files are
     * constructed inside the page and handed to a synthetic `drop` event. The
     * bytes cross the boundary base64-encoded because `evaluateHandle` arguments
     * are JSON-serialised. ng-file-upload's `ngf-drop` reads
     * `dataTransfer.items`, which is what `DataTransfer.items.add(file)` fills.
     *
     * The dispatch is fire-and-forget at one specific DOM node, and the event is
     * lost with no observable difference from success when the drop area is
     * re-rendered around it. The drop is therefore verified by the item count and
     * dispatched again, only for as long as no file of this drop has landed:
     * re-dispatching after a merely slow drop would duplicate every item.
     */
    async dropFiles(files: Array<IUploadFile>): Promise<void> {
        const payload = files.map(({name, mimeType, buffer}) => ({
            base64: buffer.toString('base64'),
            name,
            type: mimeType,
        }));

        // a non-media file is refused with a notification instead of becoming an item
        const mediaCount = files
            .filter(({mimeType}) => /^(image|video|audio)\//.test(mimeType))
            .length;
        const countBefore = await this.getItems().count();

        const dataTransfer = await this.page.evaluateHandle((entries) => {
            const transfer = new DataTransfer();

            for (const {base64, name, type} of entries) {
                const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

                transfer.items.add(new File([bytes], name, {type}));
            }

            return transfer;
        }, payload);

        await expect(async () => {
            if (await this.getItems().count() === countBefore) {
                await this.getDropArea().dispatchEvent('drop', {dataTransfer});
            }

            await expect(this.getItems()).toHaveCount(countBefore + mediaCount, {timeout: 3000});
        }).toPass();

        await dataTransfer.dispose();
    }

    /**
     * Picks the desk the uploaded media will be sent to.
     */
    async selectDesk(deskName: string): Promise<void> {
        await this.getSelectedDesk().click();

        await this.getModal()
            .getByTestId('upload-select-desk-options')
            .getByRole('button', {name: deskName, exact: true})
            .click();

        await expect(this.getSelectedDesk()).toContainText(deskName);
    }
}
