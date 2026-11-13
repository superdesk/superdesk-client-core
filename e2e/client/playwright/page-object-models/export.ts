import {Download, Locator, Page, Response, expect} from '@playwright/test';

export class ExportDialog {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get modal(): Locator {
        return this.page.getByTestId('export-modal');
    }

    get formatterSelect(): Locator {
        return this.modal.getByTestId('export-formatter');
    }

    get selectedFormatter(): Locator {
        return this.formatterSelect.locator('option:checked');
    }

    get validateSwitch(): Locator {
        return this.modal.getByTestId('validate-switch');
    }

    get exportButton(): Locator {
        return this.modal.getByTestId('export-confirm');
    }

    get cancelButton(): Locator {
        return this.modal.getByTestId('cancel');
    }

    async cancel(): Promise<void> {
        await this.cancelButton.click();
        await expect(this.modal).toBeHidden();
    }

    /**
     * The download happens in a new tab, not on this page: the archive URL is on the API
     * origin, so `scripts/core/global-fixes/open-external-links-in-new-tab.ts` reopens it
     * there. The popup navigates as soon as it exists, so the download listener must be
     * attached before the Export click.
     */
    async submit(): Promise<{response: Response; download: Download}> {
        const downloadFromPopup = new Promise<Download>((resolve) => {
            this.page.context().once('page', (popup) => {
                popup.once('download', resolve);
            });
        });

        const [response] = await Promise.all([
            this.page.waitForResponse(
                (candidate) => candidate.url().includes('/api/export')
                    && candidate.request().method() === 'POST',
            ),
            this.page.waitForEvent('popup'),
            this.exportButton.click(),
        ]);

        return {response, download: await downloadFromPopup};
    }
}
