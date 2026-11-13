import {Locator, Page, Response, expect} from '@playwright/test';

// Placement and size live in gridster's `data-col` / `data-row` / `data-sizex` / `data-sizey`
// attributes, not inline styles.
export class Dashboard {
    // Grid step in px: widget_base_dimensions [320, 250] plus a [20, 20] margin (dashboard/grid/grid.ts).
    static readonly COLUMN_STEP = 360;
    static readonly ROW_STEP = 290;

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

    // Adding a widget and accepting a rearrange save via a background `PATCH /workspaces/<id>`.
    // Wait for it: a reload aborts it and the change silently reverts, and a second PATCH
    // while the first is in flight carries a stale etag and gets 412. Status is not filtered
    // here so a failed save fails fast in `expectLayoutPersisted` instead of timing out.
    private waitForLayoutPersisted(): Promise<Response> {
        return this.page.waitForResponse(
            (response) => /\/workspaces\/[^/]+$/.test(response.url())
                && response.request().method() === 'PATCH',
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

    async startRearranging(): Promise<void> {
        await this.page.getByTestId('rearrange-widgets').click();
        await expect(this.page.getByTestId('accept-rearrange')).toBeVisible();
    }

    async acceptRearranging(): Promise<void> {
        const layoutPersisted = this.waitForLayoutPersisted();

        await this.page.getByTestId('accept-rearrange').click();
        await expect(this.page.getByTestId('rearrange-widgets')).toBeVisible();
        await this.expectLayoutPersisted(layoutPersisted);
    }

    // The drop target is an empty cell, so `dragTo()` has nothing to aim at. The first move
    // past gridster's threshold only starts the drag; the drop cell updates on later moves,
    // hence `steps`.
    async dragWidget(widgetId: string, steps: {columns: number; rows: number}): Promise<void> {
        const widget = this.getWidget(widgetId);
        const box = await widget.boundingBox();

        if (box == null) {
            throw new Error(`widget "${widgetId}" is not rendered`);
        }

        // Grab the header: remove and resize controls sit on the edges and corners.
        const fromX = box.x + box.width / 2;
        const fromY = box.y + 30;

        await this.page.mouse.move(fromX, fromY);
        await this.page.mouse.down();
        await this.page.mouse.move(
            fromX + steps.columns * Dashboard.COLUMN_STEP,
            fromY + steps.rows * Dashboard.ROW_STEP,
            {steps: 20},
        );
        await this.page.mouse.up();
    }
}
