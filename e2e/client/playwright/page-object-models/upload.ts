import {Locator, Page} from '@playwright/test';
import {s} from '../utils';
import path from 'path';

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

    /**
     * Attaches an in-memory file to the hidden upload input. `selectFile` covers the
     * on-disk case and goes through the "Select them from folder" button; this one
     * exists so a test can offer a file type the picker is meant to reject without
     * adding a fixture to `test-files/` for it.
     */
    async attachFile(file: {name: string; mimeType: string; buffer: Buffer}): Promise<void> {
        await this.page.getByTestId('file-upload').getByTestId('image-upload-input').setInputFiles(file);
    }

    async startUpload(): Promise<void> {
        await this.page.locator(s('file-upload', 'multi-image-edit--start-upload')).click();
    }

    async cancelUpload(): Promise<void> {
        await this.page.getByTestId('file-upload').getByTestId('multi-image-edit--cancel-upload').click();
    }

    getSelectedFiles(): Locator {
        return this.page.getByTestId('file-upload').getByTestId('media-grid-item');
    }
}
