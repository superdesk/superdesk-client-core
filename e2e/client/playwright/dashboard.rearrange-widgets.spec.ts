import {test, expect, type Page} from '@playwright/test';
import {Dashboard} from './page-object-models/dashboard';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Rearrange widgets" (Workspace, Confluence 1308524872).
 *
 * The documented expected results and where they are covered:
 *  - "Click Rearrange Widgets and you'll see an x appear in the top-right
 *    corner of each widget" -> first test.
 *  - "resize widgets by clicking the grey arrows that appear at the edges of
 *    each widget when you hover over them" -> first test (the arrows only
 *    appear on hover) and second test (clicking them resizes).
 *  - "Click and drag the body of the widget to move it to a different spot" and
 *    "if there is a gap above one of the widgets, it will automatically move up
 *    to fill the space" -> third test, which drops the widget a row lower than
 *    the top of a free column and asserts it lands back on row 1.
 *  - "Click x for each widget you'd like to delete" -> fourth test.
 *  - "then select and drag a widget to the desired area of your Dashboard to
 *    place it" -> not covered, and there is no behaviour to cover it with: the
 *    add-widget modal has no drag-to-place, its widget list is click-only and
 *    the widget is placed by the "Add This Widget" button
 *    (scripts/apps/dashboard/views/workspace.html).
 *
 * The workspace fixture ships a single Monitor widget, so each test adds a
 * World Clock through the (single-action) add-widget flow to get a second
 * widget to rearrange against.
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
        // packs both widgets into the first row. The rest of the spec moves and
        // resizes against these coordinates.
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

        // The arrows are rendered as soon as rearrange mode starts but are
        // fully transparent until the widget is hovered, which is the "appear
        // when you hover over them" behaviour under test. Playwright treats a
        // zero-opacity element as visible, so assert the computed opacity.
        for (const arrow of ['widget-resize-left', 'widget-resize-right', 'widget-resize-up', 'widget-resize-down']) {
            await expect(worldClock.getByTestId(arrow)).toHaveCSS('opacity', '0');
        }

        await worldClock.hover();

        for (const arrow of ['widget-resize-left', 'widget-resize-right', 'widget-resize-up', 'widget-resize-down']) {
            await expect(worldClock.getByTestId(arrow)).toHaveCSS('opacity', '0.5');
        }

        // Only the hovered widget shows its arrows.
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
        const worldClock = dashboard.getWidget(WORLD_CLOCK);

        await dashboard.startRearranging();

        // Dropped one column to the right and one row down. The third column is
        // empty, so gridster pulls the widget back up to the first row instead
        // of leaving a gap above it.
        await dashboard.dragWidget(WORLD_CLOCK, {columns: 1, rows: 1});

        await expect(worldClock).toHaveAttribute('data-col', '3');
        await expect(worldClock).toHaveAttribute('data-row', '1');
        await expect(dashboard.getWidget(MONITOR)).toHaveAttribute('data-col', '1');

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
