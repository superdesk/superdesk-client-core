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

    /**
     * The `sd-line-input` wrapper around a field rather than the control inside it.
     * Whether a field is required is expressed on the wrapper, as the
     * `sd-line-input--required` class that draws the red star on the label.
     */
    fieldContainer(field: string): Locator {
        return this.page.getByTestId('media-metadata-editor').getByTestId(field);
    }

    async saveMetadata(): Promise<void> {
        await this.page.locator(s('media-editor', 'apply-metadata-button')).click();
        await this.page.locator(s('change-image', 'done')).click();
    }

    get header(): Locator {
        return this.page.getByTestId('change-image');
    }

    get doneButton(): Locator {
        return this.header.getByTestId('done');
    }
}
