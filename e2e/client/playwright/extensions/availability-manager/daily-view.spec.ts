import path from 'path';
import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../../utils';
import {getStorageStateFromFile} from '../../utils/storage-state';
import {TreeSelectDriver} from '../../utils/tree-select-driver';

test.use({storageState: getStorageStateFromFile(path.join(__dirname, './user-michael.json'))});

test('filtering in daily view', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'availability-management'});
    await page.clock.setFixedTime(new Date('1970-02-03'));

    await page.goto('/#/availability-management');

    await expect(page.locator(s('day-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Available');

    await expect(page.locator(s('day-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Unavailable');

    await expect(page.locator(s('day-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Partially available');

    await expect(page.locator(s('day-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Not set');

    await expect(page.locator(s('day-view'))).toHaveScreenshot();
});

test('not set records being shown when there are no other records in a day', async ({page}) => {
    await restoreDatabaseSnapshot({snapshotName: 'availability-management'});
    await page.clock.setFixedTime(new Date('1970-02-08'));

    await page.goto('/#/availability-management');

    await expect(page.locator(s('day-view'))).toHaveScreenshot();

    await new TreeSelectDriver(
        page,
        page.locator(s('filters', 'status')),
    ).setValues('Not set');

    await expect(page.locator(s('day-view'))).toHaveScreenshot();
});
