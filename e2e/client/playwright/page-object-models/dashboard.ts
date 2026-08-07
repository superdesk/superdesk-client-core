import {Locator, Page, Response, expect} from '@playwright/test';

/**
 * The dashboard widget grid is driven by gridster.js. A widget's placement and
 * size are not inline styles but the `data-col` / `data-row` / `data-sizex` /
 * `data-sizey` attributes gridster writes on the grid item; the pixel position
 * comes from a generated stylesheet keyed off those attributes. Assert on the
 * attributes, they are the state the dashboard also persists.
 */
export class Dashboard {
    /**
     * One grid step in pixels. gridster is configured in
     * scripts/apps/dashboard/grid/grid.ts with widget_base_dimensions
     * [320, 250] and widget_margins [20, 20]; a step is the base dimension
     * plus a margin on each side.
     */
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

    /**
     * Adding a widget and accepting a rearrange both persist the dashboard the
     * same way: a background `PATCH /workspaces/<id>` fired after the click.
     * Every action that triggers one has to wait for the response, otherwise a
     * following reload aborts the request and the change silently reverts, and
     * a second PATCH sent while the first is in flight carries a stale
     * `If-Match` etag and is rejected with 412.
     */
    private waitForLayoutPersisted(): Promise<Response> {
        return this.page.waitForResponse(
            (response) => /\/workspaces\/[^/]+$/.test(response.url())
                && response.request().method() === 'PATCH'
                && response.ok(),
        );
    }

    async addWidget(widgetId: string): Promise<void> {
        const modal = this.page.getByTestId('widget-modal');

        await this.page.getByRole('button', {name: 'Add widget'}).click();
        await modal.getByTestId('widget-item').and(this.page.locator(`[data-test-value="${widgetId}"]`)).click();

        const layoutPersisted = this.waitForLayoutPersisted();

        await modal.getByRole('button', {name: 'Add This Widget'}).click();
        await modal.getByRole('button', {name: 'Done'}).click();

        await expect(this.getWidget(widgetId)).toBeVisible();
        await layoutPersisted;
    }

    async startRearranging(): Promise<void> {
        await this.page.getByTestId('rearrange-widgets').click();
        await expect(this.page.getByTestId('accept-rearrange')).toBeVisible();
    }

    async acceptRearranging(): Promise<void> {
        const layoutPersisted = this.waitForLayoutPersisted();

        await this.page.getByTestId('accept-rearrange').click();
        await expect(this.page.getByTestId('rearrange-widgets')).toBeVisible();
        await layoutPersisted;
    }

    /**
     * Drags a widget by whole grid steps.
     *
     * The drop target is an empty grid cell, which has no element for
     * `locator.dragTo()` to aim at, so the mouse events are driven by hand.
     * The first mousemove past gridster's drag threshold only starts the drag;
     * the drop cell is recomputed on the moves after it, hence `steps`.
     */
    async dragWidget(widgetId: string, steps: {columns: number; rows: number}): Promise<void> {
        const widget = this.getWidget(widgetId);
        const box = await widget.boundingBox();

        if (box == null) {
            throw new Error(`widget "${widgetId}" is not rendered`);
        }

        // Grab the widget header: the remove and resize controls sit on the
        // widget's edges and corners, and pressing one of them would fire its
        // click handler on mouseup instead of moving the widget.
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
