import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';

test('can switch views by keyboard', async ({page}) => {
    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace');

    await expect(page.locator(s('dashboard'))).toBeVisible();

    await page.keyboard.press('Alt+m');
    await expect(page).toHaveURL(/.*\/#\/workspace\/monitoring/);

    await page.keyboard.press('Control+Alt+k');
    await expect(page).toHaveURL(/.*\/#\/workspace\/spike-monitoring/);

    await page.keyboard.press('Alt+p');
    await expect(page).toHaveURL(/.*\/#\/workspace\/personal/);

    await page.keyboard.press('Control+Alt+f');
    await expect(page).toHaveURL(/.*\/#\/search/);

    await page.keyboard.press('Control+Alt+b');
    await expect(page).toHaveURL(/.*\/#\/workspace$/);
});
