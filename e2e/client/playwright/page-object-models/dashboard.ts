import {Locator, Page, expect} from '@playwright/test';

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

    async addWidget(widgetId: string): Promise<void> {
        const modal = this.page.getByTestId('widget-modal');

        await this.page.getByRole('button', {name: 'Add widget'}).click();
        await modal.getByTestId('widget-item').and(this.page.locator(`[data-test-value="${widgetId}"]`)).click();
        await modal.getByRole('button', {name: 'Add This Widget'}).click();
        await modal.getByRole('button', {name: 'Done'}).click();

        await expect(this.getWidget(widgetId)).toBeVisible();
    }

    async startRearranging(): Promise<void> {
        await this.page.getByTestId('rearrange-widgets').click();
        await expect(this.page.getByTestId('accept-rearrange')).toBeVisible();
    }

    /**
     * Accepting leaves rearrange mode synchronously but persists the layout with
     * a background PATCH of the workspace. Wait for that response, otherwise a
     * following reload aborts the request and the layout silently reverts.
     */
    async acceptRearranging(): Promise<void> {
        const layoutPersisted = this.page.waitForResponse(
            (response) => /\/workspaces\/[^/]+$/.test(response.url())
                && response.request().method() !== 'GET'
                && response.ok(),
        );

        await this.page.getByTestId('accept-rearrange').click();
        await expect(this.page.getByTestId('rearrange-widgets')).toBeVisible();
        await layoutPersisted;
    }

    /**
     * Drags a widget by whole grid steps.
     *
     * gridster listens for raw mousedown/mousemove/mouseup on the grid, so
     * page.dragTo() (which fires HTML5 drag events) does not move a widget.
     * The first mousemove past gridster's 1px threshold only starts the drag;
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
