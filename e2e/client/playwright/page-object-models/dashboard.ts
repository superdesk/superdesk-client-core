import {Locator, Page, Response, expect} from '@playwright/test';

export class Dashboard {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    getWidget(widgetId: string): Locator {
        return this.page
            .getByTestId('widget-grid')
            .getByTestId('widget')
            .and(this.page.locator(`[data-test-value="${widgetId}"]`));
    }

    // Adding a widget saves the dashboard in the background, so wait for it: a reload would abort the
    // write, and a second one sent meanwhile gets a 412 on the stale etag. A desk never saved before
    // has no workspace document yet, so its first write is a POST and later ones are PATCHes.
    // Matches URL and method only, so a failed save is reported by `expectLayoutPersisted` and not a timeout.
    private waitForLayoutPersisted(): Promise<Response> {
        return this.page.waitForResponse(
            (response) => /\/workspaces(\/[^/]+)?$/.test(response.url())
                && ['POST', 'PATCH'].includes(response.request().method()),
        );
    }

    private async expectLayoutPersisted(layoutPersisted: Promise<Response>): Promise<void> {
        const response = await layoutPersisted;

        expect(response.ok(), `saving the dashboard layout failed with ${response.status()}`).toBe(true);
    }

    async addWidget(widgetId: string): Promise<void> {
        const modal = this.page.getByTestId('widget-modal');

        await this.page.getByRole('button', {name: 'Add widget'}).click();
        await modal.getByTestId('widget-item').and(this.page.locator(`[data-test-value="${widgetId}"]`)).click();

        const layoutPersisted = this.waitForLayoutPersisted();

        await modal.getByRole('button', {name: 'Add This Widget'}).click();
        await modal.getByRole('button', {name: 'Done'}).click();

        await expect(modal).not.toBeVisible();
        await expect(this.getWidget(widgetId)).toBeVisible();
        await this.expectLayoutPersisted(layoutPersisted);
    }
}
