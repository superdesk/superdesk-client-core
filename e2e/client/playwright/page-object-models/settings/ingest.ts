import {Locator, Page, expect} from '@playwright/test';
import {ContentExpiryField} from '../content-expiry';

/**
 * Ingest settings (`#/settings/ingest`), Sources tab.
 */
export class IngestSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get modal(): Locator {
        return this.page.getByTestId('ingest-source-modal');
    }

    get contentExpiry(): ContentExpiryField {
        return new ContentExpiryField(this.modal);
    }

    async open(): Promise<void> {
        await this.page.goto('/#/settings/ingest');
        await expect(this.page.getByTestId('ingest-sources-status-filter')).toBeVisible();
    }

    /**
     * The Add New button only opens the modal once the feeding services have
     * loaded, and nothing on the page reflects that, so retry the click.
     */
    async addNewSource(): Promise<void> {
        await expect(async () => {
            await this.page.getByRole('button', {name: 'Add New'}).click();
            await expect(this.modal).toBeVisible({timeout: 3000});
        }).toPass({timeout: 30000});
    }

    /** The source list is filtered by status; closed sources need the filter. */
    async filterByStatus(status: 'Active' | 'All' | 'Closed'): Promise<void> {
        await this.page.getByTestId('ingest-sources-status-filter').click();
        await this.page.getByTestId('ingest-sources-status-filter--option')
            .and(this.page.locator(`[data-test-value="${status}"]`))
            .click();
    }

    getSourceRow(name: string): Locator {
        return this.page.getByTestId('ingest-source').and(this.page.locator(`[data-test-value="${name}"]`));
    }

    async openEdit(name: string): Promise<void> {
        const row = this.getSourceRow(name);

        await expect(row).toBeVisible();
        await row.hover();
        await row.getByTestId('ingest-source--edit').click();
        await expect(this.modal).toBeVisible();
    }

    async save(): Promise<void> {
        const [response] = await Promise.all([
            this.page.waitForResponse(
                (r) => /\/ingest_providers(\/[^/]+)?$/.test(new URL(r.url()).pathname)
                    && ['POST', 'PATCH'].includes(r.request().method()),
            ),
            this.modal.getByRole('button', {name: 'Save', exact: true}).click(),
        ]);

        expect(response.status()).toBeLessThan(300);
        await expect(this.modal).toBeHidden();
    }
}
