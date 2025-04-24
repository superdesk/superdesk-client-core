import {test, expect, Page} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../utils';
import {TreeSelectDriver} from '../utils/tree-select-driver';

async function openAvailabilitySettings(page: Page) {
    await page.clock.setFixedTime(new Date('1970-02-15'));

    await restoreDatabaseSnapshot({snapshotName: 'availability-manager'});
    await page.goto('/#/profile');
    await page.locator(s('page-sections')).getByRole('button', {name: 'Availability'}).click();
}

test.describe('availability manager settings', async () => {
    test('main view', async ({page}) => {
        await openAvailabilitySettings(page);

        await expect(page.locator(s('availability-settings'))).toHaveScreenshot();
    });

    test('day preview', async ({page}) => {
        await openAvailabilitySettings(page);

        page.locator(s('month=mar')).getByRole('button', {name: '10'}).click();

        await expect(page.locator(s('working-day-view', 'tags', 'tag'))).toHaveText(['Austria']);
        await expect(page.locator(s('working-day-view'))).toContainText('Tuesday, March 10, 1970');
        await expect(page.locator(s('working-day-view'))).toHaveScreenshot();
    });

    test('setting availability to "available" for a single day', async ({page}) => {
        await openAvailabilitySettings(page);

        const feb15 = page.locator(s('month=feb')).getByRole('button', {name: '15'});

        await expect(feb15).toBeVisible();
        await expect(feb15).not.toHaveAttribute('data-test-status', 'Available');

        // click to edit
        await feb15.click();

        // choose status
        await page.locator(s('edit-workday', 'status', 'item=Available')).click();

        await new TreeSelectDriver(
            page,
            page.locator(s('edit-workday', 'tags')),
        ).setValues(['Austria', 'Vienna'], ['North Macedonia']);

        await expect(page.locator(s('edit-workday'))).toHaveScreenshot();

        // save and close
        await page.getByRole('button', {name: 'Save'}).click();

        // should be visible, and marked as available
        await expect(feb15).toHaveAttribute('data-test-status', 'available');
    });
});
