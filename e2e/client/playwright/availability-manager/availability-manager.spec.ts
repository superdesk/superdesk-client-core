import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from '../utils';

test.describe('availability manager', async () => {
    // PR-TODO: when server is updated, test tags
    test('setting availability to "available" for a single day', async ({page}) => {
        await page.clock.setFixedTime(new Date('1970-02-15'));

        const feb15 = page.locator(s('month=feb')).getByRole('button', {name: '15'});

        await restoreDatabaseSnapshot({snapshotName: 'availability-manager'});
        await page.goto('/#/profile');

        await page.locator(s('page-sections')).getByRole('button', {name: 'Availability'}).click();

        await expect(page.locator(s('availability-settings'))).toHaveScreenshot();

        // should be visible, but not marked as available
        await expect(feb15).toBeVisible();
        await expect(feb15).not.toHaveAttribute('data-test-status', 'Available');

        // click to edit
        await feb15.click();

        // choose status
        await page.locator(s('edit-workday', 'status', 'item=Available')).click();

        await expect(page.locator(s('edit-workday'))).toHaveScreenshot();

        // save
        await page.getByRole('button', {name: 'Save'}).click();

        // should be visible, and marked as available
        await expect(feb15).toHaveAttribute('data-test-status', 'available');
    });
});
