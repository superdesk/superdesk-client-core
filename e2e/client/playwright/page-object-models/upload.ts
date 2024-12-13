import {Page} from '@playwright/test';
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

    async startUpload(): Promise<void> {
        await this.page.locator(s('file-upload', 'multi-image-edit--start-upload')).click();
    }
}
