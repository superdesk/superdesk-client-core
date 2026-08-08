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

    /**
     * Adding a widget and accepting a rearrange both persist the dashboard the
     * same way: a background write to `/workspaces` fired after the click.
     * Every action that triggers one has to wait for the response, otherwise a
     * following reload aborts the request and the change silently reverts, and
     * a second write sent while the first is in flight carries a stale
     * `If-Match` etag and is rejected with 412.
     *
     * A desk whose dashboard has never been saved has no workspace document
     * yet (`WorkspaceService.getDeskWorkspace` hands back an unsaved
     * `{desk, widgets: []}`), so the first write on it is a POST to the
     * collection and every later one a PATCH on the document. Both have to be
     * matched: narrowed to a PATCH on a document id, this never matches that
     * first POST and the caller hangs until the `waitForResponse` timeout.
     *
     * The predicate matches on URL and method only. Filtering on the status
     * here would leave a failed save unmatched, so the helper would hang until
     * the `waitForResponse` timeout instead of reporting the status; the status
     * is checked in `expectLayoutPersisted` once the response has arrived.
     */
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

        await expect(this.getWidget(widgetId)).toBeVisible();
        await this.expectLayoutPersisted(layoutPersisted);
    }
}
