import path from 'path';
import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../../utils';
import {getStorageStateFromFile} from '../../utils/storage-state';
import {TreeSelectDriver} from '../../utils/tree-select-driver';

test.use({
    storageState: getStorageStateFromFile(path.join(__dirname, './user-michael.json')),
    viewport: {width: 1280, height: 1000},
});

test('filtering in weekly view', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'availability-management'});
    await page.clock.setFixedTime(new Date('1970-02-03'));

    await page.goto('/#/availability-management');

    await page.locator(s('filter-type', 'item=Week')).click();

    await expect(page.locator(s('week-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Available');

    await expect(page.locator(s('week-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Unavailable');

    await expect(page.locator(s('week-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Partially available');

    await expect(page.locator(s('week-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Not set');

    await expect(page.locator(s('week-view'))).toHaveScreenshot();
});

test('not set records being shown when there are no other records in a week', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'availability-management'});
    await page.clock.setFixedTime(new Date('1970-02-08'));

    await page.goto('/#/availability-management');

    await page.locator(s('filter-type', 'item=Week')).click();

    await expect(page.locator(s('week-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Not set');

    await expect(page.locator(s('week-view'))).toHaveScreenshot();
});
