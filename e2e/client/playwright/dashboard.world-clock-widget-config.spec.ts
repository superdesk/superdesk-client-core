import {test, expect, Locator, Page} from '@playwright/test';
import {Dashboard} from './page-object-models/dashboard';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, waitForToastMessage} from './utils';

/**
 * Documented expected results that are NOT covered here:
 *
 * - "When you select more than 3 clocks, you will have to adjust the size of your widget to display them all at
 *   the same time. This can be done on the Rearrange widgets settings page."
 *   Blocker: proving the fourth clock is clipped until the widget is resized needs a pixel-level layout check
 *   (no visual snapshots are allowed) and a gridster drag-resize, which is inherently flaky. The spec covers the
 *   data half of it: a fourth clock is added to the widget.
 *
 * - Test steps 7-8: a second user who is a member of the same desk sees the saved configuration.
 *   Blocker: missing fixture. The `main` snapshot has admin as the only member of every desk, and the one other
 *   user (janedoe) is not a desk member and has no password recorded anywhere in the repo.
 */

const DEFAULT_ZONES = ['Europe/London', 'Asia/Tokyo', 'Europe/Moscow'];

function withTestValue(page: Page, locator: Locator, value: string): Locator {
    return locator.and(page.locator(`[data-test-value="${value}"]`));
}

async function expectWidgetZones(widget: Locator, zones: Array<string>): Promise<void> {
    const items = widget.getByTestId('world-clock-item');

    await expect(items).toHaveCount(zones.length);

    for (const [index, zone] of zones.entries()) {
        await expect(items.nth(index)).toHaveAttribute('data-test-value', zone);
    }
}

async function boxOf(locator: Locator): Promise<{x: number; y: number; width: number; height: number}> {
    const box = await locator.boundingBox();

    if (box == null) {
        throw new Error('element is not rendered');
    }

    return box;
}

test.describe('world clock widget settings', {
    annotation: [
        // World Clock Widget Settings
        {type: 'confluence', description: '1308524876 partial'},
    ],
}, () => {
    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace');

        await new Monitoring(page).selectDeskOrWorkspace('Sports');
        await new Dashboard(page).addWidget('world-clock');
    });

    test('configuration dialog offers both tabs, a close icon and a save button', async ({page}) => {
        const dashboard = new Dashboard(page);
        const widget = dashboard.getWidget('world-clock');
        const settingsButton = widget.getByRole('button', {name: 'Widget settings'});

        await expect(settingsButton).toBeVisible();

        const widgetBox = await boxOf(widget);
        const settingsBox = await boxOf(settingsButton);

        // "top right corner of the widget" from the QA case, asserted as geometry rather than a pixel baseline
        expect(settingsBox.x).toBeGreaterThan(widgetBox.x + widgetBox.width / 2);
        expect(settingsBox.y).toBeLessThan(widgetBox.y + widgetBox.height / 2);

        await dashboard.openWidgetConfiguration('world-clock');

        await expect(page.getByTestId('world-clock-config')).toBeVisible();
        await expect(page.getByTestId('wizard--Your clock')).toBeVisible();
        await expect(page.getByTestId('wizard--Available clocks')).toBeVisible();

        const headerBox = await boxOf(page.getByTestId('widget-config-header'));
        const bodyBox = await boxOf(page.getByTestId('widget-config-body'));
        const footerBox = await boxOf(page.getByTestId('widget-config-footer'));
        const closeBox = await boxOf(page.getByTestId('widget-config-close'));
        const saveBox = await boxOf(page.getByTestId('widget-config-save'));

        expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(bodyBox.y);
        expect(footerBox.y).toBeGreaterThanOrEqual(bodyBox.y + bodyBox.height);
        expect(closeBox.x).toBeGreaterThan(headerBox.x + headerBox.width / 2);
        expect(saveBox.x).toBeGreaterThan(footerBox.x + footerBox.width / 2);

        await dashboard.closeWidgetConfiguration();

        await expect(page.getByTestId('world-clock-config')).toBeHidden();
        await expect(widget).toBeVisible();
    });

    test('clock type reaches the widget only after saving', async ({page}) => {
        const dashboard = new Dashboard(page);
        const widget = dashboard.getWidget('world-clock');
        const analogButton = page.getByTestId('clock-type-analog');
        const digitalButton = page.getByTestId('clock-type-digital');

        await expect(widget.getByTestId('analog-clock')).toHaveCount(DEFAULT_ZONES.length);

        await dashboard.openWidgetConfiguration('world-clock');

        await expect(analogButton).toHaveClass(/toggle-button--active/);
        await expect(digitalButton).not.toHaveClass(/toggle-button--active/);

        await digitalButton.click();

        await expect(digitalButton).toHaveClass(/toggle-button--active/);
        await expect(analogButton).not.toHaveClass(/toggle-button--active/);

        await dashboard.closeWidgetConfiguration();

        await expect(widget.getByTestId('analog-clock')).toHaveCount(DEFAULT_ZONES.length);

        await dashboard.openWidgetConfiguration('world-clock');

        await expect(analogButton).toHaveClass(/toggle-button--active/);

        await digitalButton.click();
        await dashboard.saveWidgetConfiguration();

        await expect(widget.getByTestId('analog-clock')).toHaveCount(0);
        await expectWidgetZones(widget, DEFAULT_ZONES);

        await dashboard.openWidgetConfiguration('world-clock');

        await expect(digitalButton).toHaveClass(/toggle-button--active/);

        await dashboard.closeWidgetConfiguration();
    });

    test('your clock lists the widget zones and removal applies only after saving', async ({page}) => {
        const dashboard = new Dashboard(page);
        const widget = dashboard.getWidget('world-clock');

        await dashboard.openWidgetConfiguration('world-clock');

        const yourClocks = page.getByTestId('your-clocks').getByTestId('clock-item');

        await expect(yourClocks).toHaveCount(DEFAULT_ZONES.length);

        for (const [index, zone] of DEFAULT_ZONES.entries()) {
            await expect(yourClocks.nth(index)).toHaveAttribute('data-test-value', zone);
            await expect(withTestValue(page, yourClocks, zone).getByTestId('remove-clock')).toBeVisible();
        }

        await withTestValue(page, yourClocks, 'Asia/Tokyo').getByTestId('remove-clock').click();

        await expect(yourClocks).toHaveCount(2);
        await expect(withTestValue(page, yourClocks, 'Asia/Tokyo')).toHaveCount(0);
        await expectWidgetZones(widget, DEFAULT_ZONES);

        await dashboard.saveWidgetConfiguration();

        await expectWidgetZones(widget, ['Europe/London', 'Europe/Moscow']);
    });

    test('available clocks can be searched, cleared, scrolled and added', async ({page}) => {
        const dashboard = new Dashboard(page);
        const widget = dashboard.getWidget('world-clock');

        await dashboard.openWidgetConfiguration('world-clock');
        await page.getByTestId('wizard--Available clocks').click();

        const availableClocks = page.getByTestId('available-clocks').getByTestId('clock-item');
        const search = page.getByTestId('clock-search');
        const clear = page.getByTestId('clock-search-clear');

        await expect(availableClocks.first()).toBeVisible();

        const availableCount = await availableClocks.count();

        for (const zone of DEFAULT_ZONES) {
            await expect(withTestValue(page, availableClocks, zone)).toHaveCount(0);
        }

        const lastClock = availableClocks.last();

        await expect(lastClock).not.toBeInViewport();
        await lastClock.scrollIntoViewIfNeeded();
        await expect(lastClock).toBeInViewport();

        await expect(clear).toBeDisabled();

        await search.fill('prague');

        await expect(availableClocks).toHaveCount(1);
        await expect(withTestValue(page, availableClocks, 'Europe/Prague')).toBeVisible();
        await expect(clear).toBeEnabled();

        await clear.click();

        await expect(search).toHaveValue('');
        await expect(clear).toBeDisabled();
        await expect(availableClocks).toHaveCount(availableCount);

        await search.fill('prague');
        await withTestValue(page, availableClocks, 'Europe/Prague').click();

        await waitForToastMessage(page, 'success', 'World clock added: Europe/Prague');

        await expect(availableClocks).toHaveCount(0);

        await clear.click();

        await expect(availableClocks).toHaveCount(availableCount - 1);
        await expect(withTestValue(page, availableClocks, 'Europe/Prague')).toHaveCount(0);
        await expectWidgetZones(widget, DEFAULT_ZONES);

        await dashboard.saveWidgetConfiguration();

        await expectWidgetZones(widget, [...DEFAULT_ZONES, 'Europe/Prague']);
    });

    test('saved configuration survives leaving and returning to the dashboard', async ({page}) => {
        const dashboard = new Dashboard(page);
        const widget = dashboard.getWidget('world-clock');
        const expectedZones = ['Europe/London', 'Asia/Tokyo', 'Europe/Prague'];

        await dashboard.openWidgetConfiguration('world-clock');
        await page.getByTestId('clock-type-digital').click();
        await withTestValue(page, page.getByTestId('your-clocks').getByTestId('clock-item'), 'Europe/Moscow')
            .getByTestId('remove-clock')
            .click();
        await page.getByTestId('wizard--Available clocks').click();
        await page.getByTestId('clock-search').fill('prague');
        await withTestValue(page, page.getByTestId('available-clocks').getByTestId('clock-item'), 'Europe/Prague')
            .click();
        await dashboard.saveWidgetConfiguration();

        await expectWidgetZones(widget, expectedZones);
        await expect(widget.getByTestId('analog-clock')).toHaveCount(0);

        await page.goto('/#/search');

        await expect(page.getByTestId('dashboard')).toBeHidden();

        await page.goto('/#/workspace');
        await new Monitoring(page).selectDeskOrWorkspace('Sports');

        await expectWidgetZones(widget, expectedZones);
        await expect(widget.getByTestId('analog-clock')).toHaveCount(0);

        // the dashboard is stored server side, so a full reload proves it was persisted and not just kept in memory
        await page.reload();
        await new Monitoring(page).selectDeskOrWorkspace('Sports');

        await expectWidgetZones(widget, expectedZones);
        await expect(widget.getByTestId('analog-clock')).toHaveCount(0);
    });
});
