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
 * serves `fixtures/**` to the unit tests), and the only place in the repo holding
 * non-image media: `empty_metadata.mov` and `audio.wav` live there, while
 * `test-files` carries images. Non-image upload sources are taken from it rather
 * than copied into a second directory.
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
     * Upload progress circles, one per item. An item draws its circle only once its
     * own progress is above zero, which happens when its upload request is answered
     * (see `holdArchiveRequests`), and keeps it until the screen closes.
     */
    getProgressIndicators(): Locator {
        return this.getModal().getByTestId('upload-progress-circle');
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
     */
    async dropFiles(files: Array<IUploadFile>): Promise<void> {
        const payload = files.map(({name, mimeType, buffer}) => ({
            base64: buffer.toString('base64'),
            name,
            type: mimeType,
        }));

        const dataTransfer = await this.page.evaluateHandle((entries) => {
            const transfer = new DataTransfer();

            for (const {base64, name, type} of entries) {
                const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

                transfer.items.add(new File([bytes], name, {type}));
            }

            return transfer;
        }, payload);

        await this.getDropArea().dispatchEvent('drop', {dataTransfer});

        await dataTransfer.dispose();
    }

    /**
     * Parks the response of the next `count` archive requests of `method` until the
     * release callback handed back for each of them is called. The request is sent
     * for real and only its answer is withheld, so the screen stays in the state
     * that request produced for as long as the assertions need, with nothing
     * depending on a fixed delay.
     *
     * This is what makes the per-file progress circles assertable. An item's
     * progress is only moved off zero by ng-file-upload's `xhr.upload` events and
     * by `item.progress = 100` when its upload answers; Playwright answers an
     * intercepted request from outside the page, so no upload event ever fires and
     * a circle appears exactly when that file's response lands. Files are posted one
     * after another and the screen closes once every item has also been patched with
     * its metadata, so releasing the posts one by one brings the circles up one by
     * one, and holding the patches keeps them all on screen.
     *
     * `POST` goes to `/api/archive` and `PATCH` to `/api/archive/<id>`, which is why
     * the two need different URL patterns. Unmatched requests, and any past `count`,
     * are let through untouched. Call `stopHoldingArchiveRequests` when done.
     */
    async holdArchiveRequests(method: 'POST' | 'PATCH', count: number): Promise<Array<() => void>> {
        const releases: Array<() => void> = [];
        const gates = Array.from(
            {length: count},
            () => new Promise<void>((resolve) => releases.push(resolve)),
        );
        let matched = 0;

        await this.page.route(archiveUrlPattern(method), async (route) => {
            const gate = route.request().method() === method ? gates[matched++] : undefined;

            if (gate == null) {
                await route.continue();

                return;
            }

            const response = await route.fetch();

            await gate;
            await route.fulfill({response});
        });

        return releases;
    }

    async stopHoldingArchiveRequests(method: 'POST' | 'PATCH'): Promise<void> {
        await this.page.unroute(archiveUrlPattern(method));
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

function archiveUrlPattern(method: 'POST' | 'PATCH'): string {
    return method === 'POST' ? '**/api/archive*' : '**/api/archive/*';
}
