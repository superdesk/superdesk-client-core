import {test, expect} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s} from './utils';

test('selecting multiple monitoring items enables bulk actions and opens multiedit', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await expect(page.locator(s('article-item=test sports story'))).toBeVisible();
    await expect(page.locator(s('article-item=story 2'))).toBeVisible();

    await page.locator(s('article-item=test sports story', 'item-type-and-multi-select')).hover();
    await page.locator(s('article-item=test sports story', 'multi-select-checkbox')).click();

    await expect(page.locator(s('multi-action-bar'))).toContainText('1 Item selected');

    await page.locator(s('article-item=story 2', 'item-type-and-multi-select')).hover();
    await page.locator(s('article-item=story 2', 'multi-select-checkbox')).click();

    await expect(page.locator(s('multi-action-bar'))).toContainText('2 Items selected');

    await page.locator(s('multi-action-bar', 'multi-actions-inline', 'Multi-edit')).click();

    await expect(page).toHaveURL(/multiedit$/);
    await expect(page.locator(s('multiedit-screen', 'multiedit-article'))).toHaveCount(2);
});

test('opening an item by unique name via Ctrl+0', async ({page}) => {
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await page.keyboard.press('Control+0');
    await expect(page.locator(s('item-globalsearch'))).toBeVisible();

    await page.locator(s('item-globalsearch', 'unique-name-input')).fill('#1');
    await page.locator(s('item-globalsearch', 'search-by-name')).click();

    await expect(page.locator(s('authoring'))).toBeVisible();
    await expect(page.locator(s('authoring', 'item-type-icon=text'))).toBeVisible();

    await page.locator(s('authoring-topbar', 'close')).click();
});
