import {Locator, Page, expect} from '@playwright/test';
import {s} from '../utils';
import fs from 'fs';
import path from 'path';

const TEST_FILE_DIR = 'test-files';

export class MediaUpload {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async selectFile(filename: string): Promise<void> {
        await this.page.locator(s('file-upload', 'select-file-button')).click();
        await this.page.locator(s('file-upload', 'image-upload-input'))
            .setInputFiles(path.join('test-files', filename));
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
     * Adds a file to the upload by dropping it on the drop area.
     *
     * A real OS drag-and-drop cannot be driven from Playwright, so the file is
     * constructed inside the page and handed to a synthetic `drop` event. The
     * bytes cross the boundary base64-encoded because `evaluateHandle` arguments
     * are JSON-serialised. ng-file-upload's `ngf-drop` reads
     * `dataTransfer.items`, which is what `DataTransfer.items.add(file)` fills.
     */
    async dropFile(filename: string, mimeType: string = 'image/jpeg'): Promise<void> {
        const contents = fs.readFileSync(path.join(TEST_FILE_DIR, filename)).toString('base64');

        const dataTransfer = await this.page.evaluateHandle(({base64, name, type}) => {
            const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
            const transfer = new DataTransfer();

            transfer.items.add(new File([bytes], name, {type}));

            return transfer;
        }, {base64: contents, name: filename, type: mimeType});

        await this.getDropArea().dispatchEvent('drop', {dataTransfer});

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
