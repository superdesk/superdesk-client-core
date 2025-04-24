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

    test('deletion of day record', async ({page}) => {
        await openAvailabilitySettings(page);

        const mar10 = page.locator(s('month=mar')).getByRole('button', {name: '10'});

        await expect(mar10).toHaveAttribute('data-test-status', 'available');

        // click to view
        await mar10.click();

        await page.locator(s('working-day-view')).getByRole('button', {name: 'Remove'}).click();

        await expect(mar10).not.toHaveAttribute('data-test-status', 'available');
    });

    test('setting availability to "available" for a single day', async ({page}) => {
        await openAvailabilitySettings(page);

        const feb15 = page.locator(s('month=feb')).getByRole('button', {name: '15'});

        await expect(feb15).toBeVisible();
        await expect(feb15).not.toHaveAttribute('data-test-status', 'available');

        // click to create
        await feb15.click();

        // choose status
        await page.locator(s('edit-workday', 'status', 'item=Available')).click();

        await new TreeSelectDriver(
            page,
            page.locator(s('edit-workday', 'tags')).first(),
        ).setValues(['Austria', 'Vienna'], ['North Macedonia']);

        await expect(page.locator(s('edit-workday'))).toHaveScreenshot();

        // save and close
        await page.getByRole('button', {name: 'Save'}).click();

        // should be visible, and marked as available
        await expect(feb15).toHaveAttribute('data-test-status', 'available');
    });

    test('setting availability to "partially available" for a single day', async ({page}) => {
        test.setTimeout(1000 * 60);

        await openAvailabilitySettings(page);

        const feb15 = page.locator(s('month=feb')).getByRole('button', {name: '15'});

        await expect(feb15).not.toHaveAttribute('data-test-status', 'partial');

        // enter creation mode
        await feb15.click();

        await page.locator(s('edit-workday', 'status', 'item=Partially available')).click();

        await page.locator(s('edit-workday')).getByLabel('Time from').first().click();
        await page.locator(s('edit-workday')).getByLabel('Time from').first().fill('10:00');
        await page.locator(s('edit-workday')).getByLabel('Time from').first().press('Tab');

        await page.locator(s('edit-workday')).getByLabel('Time to').first().click();
        await page.locator(s('edit-workday')).getByLabel('Time to').first().fill('11:00');

        await new TreeSelectDriver(
            page,
            page.locator(s('edit-workday', 'tags')).first(),
        ).setValues(['Bosnia and Herzegovina'], ['North Macedonia']);

        await page.locator(s('edit-workday')).getByRole('button', {name: 'Add'}).click();

        await page.locator(s('edit-workday')).getByLabel('Time from').nth(1).click();
        await page.locator(s('edit-workday')).getByLabel('Time from').nth(1).fill('11:30');
        await page.locator(s('edit-workday')).getByLabel('Time from').nth(1).press('Tab');

        await page.locator(s('edit-workday')).getByLabel('Time to').nth(1).fill('12:30');

        await new TreeSelectDriver(
            page,
            page.locator(s('edit-workday', 'tags')).nth(1),
        ).setValues('Austria');

        await expect(page.locator(s('edit-workday'))).toHaveScreenshot();

        await page.locator(s('edit-workday')).getByRole('button', {name: 'Save'}).click();

        await expect(feb15).toHaveAttribute('data-test-status', 'partial');

        await expect(page.locator(s('working-day-view'))).toContainText('Sunday, February 15, 1970');

        await expect(
            page.locator(s('working-day-view', 'working-hours-record')).nth(0).locator(s('time-range')),
        ).toContainText('10:00 - 11:00');

        await expect(
            page.locator(s('working-day-view', 'working-hours-record')).nth(0).locator(s('tags', 'tag')),
        ).toHaveText(['Bosnia and Herzegovina', 'North Macedonia']);

        await expect(page.locator(
            s('working-day-view', 'working-hours-record')).nth(1).locator(s('time-range')),
        ).toContainText('11:30 - 12:30');

        await expect(
            page.locator(s('working-day-view', 'working-hours-record')).nth(1).locator(s('tags', 'tag')),
        ).toHaveText(['Austria']);

        await expect(page.locator(s('working-day-view'))).toHaveScreenshot();
    });
});
