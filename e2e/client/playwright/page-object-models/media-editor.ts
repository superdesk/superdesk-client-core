import {Locator, Page} from '@playwright/test';
import {s} from '../utils';

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
}
