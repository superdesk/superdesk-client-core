import {Page} from '@playwright/test';
import {s} from '../utils';
import path from 'path';

export class MediaEditor {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    field(field: string) {
        return this.page.locator(s('media-metadata-editor', 'field--' + field)).getByRole('textbox');
    }

    async saveMetadata() {
        await this.page.locator(s('apply-metadata-button')).click();
        await this.page.locator(s('done')).click();
    }

    async selectUploadFile(fileName: string) {
        await this.page.getByRole('button', {name: 'Select them from folder'}).click();
        await this.page.locator(s('image-upload-input')).setInputFiles(path.join('test-files', fileName));
    }

    async startUpload() {
        await this.page.locator(s('multi-image-edit--start-upload')).click();
    }
}
