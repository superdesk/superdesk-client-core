import {test, expect, Locator, Page} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

async function multiSelect(item: Locator): Promise<void> {
    await item.locator(s('item-type-and-multi-select')).hover();
    const checkbox = item.locator(s('multi-select-checkbox'));

    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
}

async function clickBulkAction(page: Page, action: string): Promise<void> {
    const inline = page.locator(s('multi-action-bar', 'multi-actions-inline', action));
    const compactToggle = page.locator(s('multi-action-bar', 'multi-actions-dropdown', 'dropdown-toggle'));

    await expect(inline.or(compactToggle)).toBeVisible({timeout: 30000});

    if (await inline.count() > 0) {
        await inline.click();
    } else {
        await compactToggle.click();
        await page.locator(s('multi-action-bar', 'multi-actions-dropdown', action)).click();
    }
}

function packageGroupItems(page: Page, groupId: string): Locator {
    return page.locator(s('authoring', `package-group=${groupId}`, 'package-items'));
}

test.describe('package', () => {
    // FLAKY: even with Monitoring.executeSubmenuAction's mouse-move-out-then-in
    // pattern the inner dropdown submenu doesn't open reliably under Playwright.
    // The previous Protractor helper drove the same flow without issues using
    // browser.actions().mouseMove(), suggesting a Playwright-specific event
    // synthesis gap; left skipped until a deeper fix lands.
    test.skip('increment package version', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=Package Highlight 1')),
            'Edit',
        );
        await expect(page.locator(s('authoring'))).toBeVisible();

        await monitoring.executeSubmenuAction(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
            'Add to current',
            'MAIN',
            {innerByTestId: 'add-to-package-group=MAIN'},
        );

        await page.locator(s('authoring-topbar', 'save')).click();
        await expect(
            page.locator(s('authoring-topbar', 'save')).locator(s('loading-indicator')),
        ).not.toBeVisible();

        await page.locator(s('navigation-tabs', 'authoring-widget=Versions/History')).click();
        await expect(
            page.locator(s('authoring-widget-panel=Versions/History', 'article-version')),
        ).toHaveCount(2);
    });

    // Same submenu-flake as `increment package version` above.
    test.skip('add to current package removed after adding an item', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=Package Highlight 1')),
            'Edit',
        );
        await expect(page.locator(s('authoring'))).toBeVisible();

        const targetItem = page.locator(
            s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
        );

        await monitoring.executeSubmenuAction(
            targetItem,
            'Add to current',
            'MAIN',
            {innerByTestId: 'add-to-package-group=MAIN'},
        );

        await targetItem.hover();
        await targetItem.locator(s('context-menu-button')).click();

        await expect(page.locator(s('context-menu'))).toBeVisible();
        await expect(
            page.locator(s('context-menu')).getByRole('button', {name: 'Add to current'}),
        ).toHaveCount(0);
    });

    test('create package from multiple items via bulk action', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await multiSelect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        );
        await multiSelect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        );

        await clickBulkAction(page, 'Create Package');

        await expect(page.locator(s('authoring'))).toBeVisible();
        await expect(packageGroupItems(page, 'main')).toHaveCount(2);
    });

    test('create package by combining an item with the currently open item', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await page
            .locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2'))
            .dblclick();
        await expect(page.locator(s('authoring'))).toBeVisible();

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
            'Combine with current',
        );

        await expect(packageGroupItems(page, 'main')).toHaveCount(2);
    });

    test('add multiple items to the currently open package via bulk action', async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=Package Highlight 1')),
            'Edit',
        );
        await expect(page.locator(s('authoring'))).toBeVisible();

        await multiSelect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=test sports story')),
        );
        await multiSelect(
            page.locator(s('monitoring-group=Sports / Working Stage', 'article-item=story 2')),
        );

        await clickBulkAction(page, 'Add to Current Package');

        await expect(packageGroupItems(page, 'main')).toHaveCount(3);
        await expect(page.locator(s('authoring', 'package-items=test sports story'))).toBeVisible();
        await expect(page.locator(s('authoring', 'package-items=story 2'))).toBeVisible();
    });

    test('create package from a published item via global search', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/search?repo=published');

        const publishedItem = page.locator(s('article-item=Story 5'));

        await expect(publishedItem).toBeVisible();

        await publishedItem.hover();
        await publishedItem.locator(s('context-menu-button')).click();
        await page.locator(s('context-menu'))
            .getByRole('button', {name: 'Create package', exact: true})
            .click();

        await expect(page.locator(s('authoring'))).toBeVisible();
        await expect(packageGroupItems(page, 'main')).toHaveCount(1);
        await expect(page.locator(s('authoring', 'package-items=Story 5'))).toBeVisible();
    });
});
