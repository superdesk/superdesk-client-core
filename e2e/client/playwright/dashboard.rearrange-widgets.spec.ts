import {test, expect, type Page} from '@playwright/test';
import {Dashboard} from './page-object-models/dashboard';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Rearrange widgets" (Workspace, Confluence 1308524872).
 *
 * Not covered: dragging a widget from the add-widget modal onto the grid. The modal
 * is click-only, widgets are placed with "Add This Widget" (views/workspace.html).
 *
 * The fixture ships only a Monitor widget, so each test adds a World Clock.
 */
test.describe('rearranging dashboard widgets', {
    annotation: [
        {type: 'confluence', description: '1308524872 partial'}, // Rearrange widgets
    ],
}, () => {
    const MONITOR = 'aggregate';
    const WORLD_CLOCK = 'world-clock';

    async function openDashboardWithTwoWidgets(page: Page): Promise<Dashboard> {
        const dashboard = new Dashboard(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace');

        await expect(dashboard.getWidget(MONITOR)).toBeVisible();
        await dashboard.addWidget(WORLD_CLOCK);

        // The fixture stores no position for the Monitor, so gridster packs both into row 1.
        await expect(dashboard.getWidget(MONITOR)).toHaveAttribute('data-col', '1');
        await expect(dashboard.getWidget(MONITOR)).toHaveAttribute('data-row', '1');
        await expect(dashboard.getWidget(WORLD_CLOCK)).toHaveAttribute('data-col', '2');
        await expect(dashboard.getWidget(WORLD_CLOCK)).toHaveAttribute('data-row', '1');

        return dashboard;
    }

    test('rearrange mode reveals a remove control on every widget and resize arrows on hover', async ({page}) => {
        const dashboard = await openDashboardWithTwoWidgets(page);
        const monitor = dashboard.getWidget(MONITOR);
        const worldClock = dashboard.getWidget(WORLD_CLOCK);

        await expect(monitor.getByTestId('widget-remove')).toBeHidden();
        await expect(worldClock.getByTestId('widget-remove')).toBeHidden();
        await expect(monitor.getByTestId('widget-resize-right')).toBeHidden();
        await expect(worldClock.getByTestId('widget-resize-right')).toBeHidden();

        await dashboard.startRearranging();

        await expect(monitor.getByTestId('widget-remove')).toBeVisible();
        await expect(worldClock.getByTestId('widget-remove')).toBeVisible();

        // Arrows are transparent until hover, and Playwright counts opacity 0 as visible.
        for (const arrow of ['widget-resize-left', 'widget-resize-right', 'widget-resize-up', 'widget-resize-down']) {
            await expect(worldClock.getByTestId(arrow)).toHaveCSS('opacity', '0');
        }

        await worldClock.hover();

        for (const arrow of ['widget-resize-left', 'widget-resize-right', 'widget-resize-up', 'widget-resize-down']) {
            await expect(worldClock.getByTestId(arrow)).toHaveCSS('opacity', '0.5');
        }

        await expect(monitor.getByTestId('widget-resize-right')).toHaveCSS('opacity', '0');
    });

    test('resize arrows grow and shrink a widget and the new size is kept after accepting', async ({page}) => {
        const dashboard = await openDashboardWithTwoWidgets(page);
        const worldClock = dashboard.getWidget(WORLD_CLOCK);

        await expect(worldClock).toHaveAttribute('data-sizex', '1');

        await dashboard.startRearranging();

        await worldClock.getByTestId('widget-resize-right').click();
        await expect(worldClock).toHaveAttribute('data-sizex', '2');

        await worldClock.getByTestId('widget-resize-left').click();
        await expect(worldClock).toHaveAttribute('data-sizex', '1');

        await worldClock.getByTestId('widget-resize-right').click();
        await expect(worldClock).toHaveAttribute('data-sizex', '2');

        await dashboard.acceptRearranging();

        await page.reload();
        await expect(dashboard.getWidget(WORLD_CLOCK)).toHaveAttribute('data-sizex', '2');
    });

    test('a widget dragged to a free column moves there and floats up to fill the gap above it', async ({page}) => {
        const dashboard = await openDashboardWithTwoWidgets(page);
        const monitor = dashboard.getWidget(MONITOR);
        const worldClock = dashboard.getWidget(WORLD_CLOCK);

        await dashboard.startRearranging();

        // One row tall, so the World Clock it pushes down stays in the viewport for the mouse.
        await expect(monitor).toHaveAttribute('data-sizey', '2');
        await monitor.getByTestId('widget-resize-up').click();
        await expect(monitor).toHaveAttribute('data-sizey', '1');

        await monitor.getByTestId('widget-resize-right').click();
        await expect(monitor).toHaveAttribute('data-sizex', '2');
        await expect(worldClock).toHaveAttribute('data-col', '2');
        await expect(worldClock).toHaveAttribute('data-row', '2');

        // gridster animates the push; hovering waits for the widget to settle before the drag.
        await worldClock.hover();

        // The third column is empty above the drop, so gridster floats the widget up to row 1.
        await dashboard.dragWidget(WORLD_CLOCK, {columns: 1, rows: 0});

        await expect(worldClock).toHaveAttribute('data-col', '3');
        await expect(worldClock).toHaveAttribute('data-row', '1');
        await expect(monitor).toHaveAttribute('data-col', '1');

        await dashboard.acceptRearranging();

        await page.reload();
        await expect(dashboard.getWidget(WORLD_CLOCK)).toHaveAttribute('data-col', '3');
        await expect(dashboard.getWidget(WORLD_CLOCK)).toHaveAttribute('data-row', '1');
    });

    test('the x control deletes a widget and the deletion is kept after accepting', async ({page}) => {
        const dashboard = await openDashboardWithTwoWidgets(page);

        await dashboard.startRearranging();

        await dashboard.getWidget(WORLD_CLOCK).getByTestId('widget-remove').click();

        await expect(dashboard.getWidget(WORLD_CLOCK)).toBeHidden();
        await expect(dashboard.getWidget(MONITOR)).toBeVisible();

        await dashboard.acceptRearranging();

        await page.reload();
        await expect(dashboard.getWidget(MONITOR)).toBeVisible();
        await expect(dashboard.getWidget(WORLD_CLOCK)).toBeHidden();
    });
});
