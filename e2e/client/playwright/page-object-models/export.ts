import {Download, Locator, Page, Response, expect} from '@playwright/test';

/**
 * The Export dialog reached from an article's 3-dot menu
 * (`scripts/apps/archive/views/export.html`).
 */
export class ExportDialog {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get modal(): Locator {
        return this.page.getByTestId('export-modal');
    }

    get formatterSelect(): Locator {
        return this.modal.getByTestId('formatter-select');
    }

    get selectedFormatter(): Locator {
        return this.formatterSelect.locator('option:checked');
    }

    get validateSwitch(): Locator {
        return this.modal.getByTestId('validate-switch');
    }

    get exportButton(): Locator {
        return this.modal.getByTestId('export-submit');
    }

    get cancelButton(): Locator {
        return this.modal.getByTestId('cancel');
    }

    async cancel(): Promise<void> {
        await this.cancelButton.click();
        await expect(this.modal).toBeHidden();
    }

    /**
     * Clicks Export and returns both the export request's response and the archive the
     * browser downloads.
     *
     * The download does not land on this page. The directive answers the export response
     * by pointing a hidden anchor at the archive URL and clicking it, and that URL is on
     * the API origin rather than the client's, so the global handler in
     * `scripts/core/global-fixes/open-external-links-in-new-tab.ts` cancels the click and
     * reopens the URL in a new tab, where the download happens instead. The popup
     * navigates the moment it is created, so its download listener has to be attached
     * before the Export click rather than after the popup event arrives.
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
