import {test, expect, type Page} from '@playwright/test';
import {Dashboard} from './page-object-models/dashboard';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Rearrange widgets" (Workspace, Confluence 1308524872).
 *
 * Not covered: "select and drag a widget to the desired area of your Dashboard to
 * place it". The add-widget modal has no drag-to-place: its widget list is
 * click-only and the widget is placed by the "Add This Widget" button
 * (scripts/apps/dashboard/views/workspace.html).
 *
 * The workspace fixture ships a single Monitor widget, so each test adds a
 * World Clock to get a second widget to rearrange against.
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

        // The fixture stores no position for the Monitor widget, so gridster
        // packs both widgets into the first row.
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

        // The arrows are rendered but fully transparent until the widget is
        // hovered. Playwright treats a zero-opacity element as visible, so
        // assert the computed opacity.
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

        // The Monitor is made one row tall first so that the World Clock it pushes
        // down stays inside the viewport, where the mouse can grab it.
        await expect(monitor).toHaveAttribute('data-sizey', '2');
        await monitor.getByTestId('widget-resize-up').click();
        await expect(monitor).toHaveAttribute('data-sizey', '1');

        // Widening the Monitor over the second column pushes the World Clock below it.
        await monitor.getByTestId('widget-resize-right').click();
        await expect(monitor).toHaveAttribute('data-sizex', '2');
        await expect(worldClock).toHaveAttribute('data-col', '2');
        await expect(worldClock).toHaveAttribute('data-row', '2');

        // gridster animates the push, and the drag aims at where the widget is now.
        // Hovering waits for the widget to stop moving.
        await worldClock.hover();

        // Dropped one column right on the row it was pushed to. The third column
        // is empty above it, so gridster pulls the widget up to the first row.
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
