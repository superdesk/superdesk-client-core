import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s, login} from './utils';
import {Monitoring} from './page-object-models/monitoring';

test.describe('legal archive', () => {
    test('shows Legal Archive entry in the hamburger menu', async ({page}) => {
        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');

        await page.getByRole('button', {name: 'Toggle main menu'}).click();

        await expect(
            page.locator(s('main-menu', 'main-menu-item=Legal Archive')),
        ).toBeVisible();
    });
});

test.describe('legal archive (legacy snapshot)', () => {
    test.use({storageState: {cookies: [], origins: []}});

    test.beforeEach(async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'legacy'});
        await login(page);
    });

    test('lists items in Legal Archive', async ({page}) => {
        await page.goto('/#/legal_archive');

        for (const headline of [
            'item1 in legal archive',
            'item2 in legal archive',
            'item3 in legal archive',
            'package1 in legal archive',
        ]) {
            await expect(page.locator(s(`article-item=${headline}`))).toBeVisible();
        }

        await expect(page.locator(s('article-item'))).toHaveCount(4);
    });

    test('actions menu exposes only Open and Open in new Window', async ({page}) => {
        await page.goto('/#/legal_archive');

        const item = page.locator(s('article-item=item1 in legal archive'));

        await item.hover();
        await item.locator(s('context-menu-button')).click();

        const menu = page.locator(s('context-menu'));

        await expect(menu).toBeVisible();
        await expect(menu.getByRole('button', {name: 'Open', exact: true})).toBeVisible();
        await expect(menu.getByRole('button', {name: 'Open in new Window', exact: true})).toBeVisible();

        await expect(menu.getByRole('button', {name: 'Edit', exact: true})).toHaveCount(0);
        await expect(menu.getByRole('button', {name: 'Spike Item', exact: true})).toHaveCount(0);
        await expect(menu.getByRole('button', {name: 'Duplicate', exact: true})).toHaveCount(0);
    });

    test('preview can be closed from a Legal Archive item', async ({page}) => {
        await page.goto('/#/legal_archive');

        await page.locator(s('article-item=item1 in legal archive')).click();
        await expect(page.locator(s('item-preview'))).toBeVisible();

        await page.locator(s('item-preview', 'close-preview')).click();
        await expect(page.locator(s('item-preview'))).not.toBeVisible();
    });

    test('opens a text item read-only', async ({page}) => {
        const monitoring = new Monitoring(page);

        await page.goto('/#/legal_archive');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=item1 in legal archive')),
            'Open',
        );

        await expect(page.locator(s('item-type-icon=text'))).toBeVisible();

        await expect(page.locator(s('authoring-topbar', 'close'))).toBeVisible();
        await expect(page.locator(s('authoring-topbar', 'save'))).not.toBeVisible();
        await expect(page.locator(s('authoring-topbar', 'open-send-publish-pane'))).not.toBeVisible();
        await expect(page.locator(s('content-create'))).toHaveCount(0);
    });

    test('opens a package read-only', async ({page}) => {
        const monitoring = new Monitoring(page);

        await page.goto('/#/legal_archive');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=package1 in legal archive')),
            'Open',
        );

        await expect(page.locator(s('item-type-icon=composite'))).toBeVisible();
        await expect(page.locator(s('authoring-topbar', 'close'))).toBeVisible();
        await expect(page.locator(s('authoring-topbar', 'save'))).not.toBeVisible();
        await expect(page.locator(s('authoring-topbar', 'open-send-publish-pane'))).not.toBeVisible();
    });

    test('shows versions for a Legal Archive item', async ({page}) => {
        const monitoring = new Monitoring(page);

        await page.goto('/#/legal_archive');

        await monitoring.executeActionOnMonitoringItem(
            page.locator(s('article-item=item2 in legal archive')),
            'Open',
        );

        const versioningTab = page.locator(s('authoring-widget=Versions/History'));

        await versioningTab.click();

        await expect(page.locator(s('article-version'))).toHaveCount(3);
    });
});
