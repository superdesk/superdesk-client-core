import {test, expect} from '@playwright/test';
import {restoreDatabaseSnapshot, s} from './utils';
import {Monitoring} from './page-object-models/monitoring';

/**
 * Keyboard navigation on the monitoring list:
 *  - arrow keys move focus between items
 *  - space opens the context menu of the focused item
 *  - tab cycles bulk-select / 3-dot / context-menu options
 *  - escape closes the context menu and returns focus to the item
 *
 * All tests share a fixture: monitoring view loaded for Sports desk, with the
 * first three article items focusable.
 */
test.describe('keyboard navigation', () => {
    test.beforeEach(async ({page}) => {
        const monitoring = new Monitoring(page);

        await restoreDatabaseSnapshot();
        await page.goto('/#/workspace/monitoring');
        await monitoring.selectDeskOrWorkspace('Sports');

        await expect(page.locator(s('article-item')).first()).toBeVisible();
    });

    test('arrow keys move focus between articles', async ({page}) => {
        const items = page.locator(s('article-item'));
        const first = items.nth(0);
        const second = items.nth(1);
        const third = items.nth(2);

        await first.click();
        await expect(first).toBeFocused();

        // wait until item gets re-rendered as selected
        await expect(first.locator(s('multi-select-checkbox'))).toBeVisible();

        await page.keyboard.press('ArrowDown');
        await expect(second).toBeFocused();

        await page.keyboard.press('ArrowDown');
        await expect(third).toBeFocused();

        await page.keyboard.press('ArrowUp');
        await expect(second).toBeFocused();
    });

    test('Space opens the context menu when the article is focused', async ({page}) => {
        const first = page.locator(s('article-item')).first();

        await first.click();
        await expect(first).toBeFocused();
        await expect(first.locator(s('multi-select-checkbox'))).toBeVisible();

        await page.keyboard.press(' ');
        await expect(page.locator(s('context-menu'))).toBeFocused();
    });

    test('Tab through checkbox then 3-dot button, Space opens context menu', async ({page}) => {
        const first = page.locator(s('article-item')).first();

        await first.click();
        await expect(first).toBeFocused();
        await expect(first.locator(s('multi-select-checkbox'))).toBeVisible();

        await page.keyboard.press('Tab'); // bulk-select checkbox
        await page.keyboard.press('Tab'); // 3-dot context menu button

        await expect(first.locator(s('context-menu-button'))).toBeFocused();

        await page.keyboard.press(' ');
        await expect(page.locator(s('context-menu'))).toBeFocused();
    });

    test('Escape closes the context menu and restores focus to the article', async ({page}) => {
        const first = page.locator(s('article-item')).first();

        await first.click();
        await expect(first).toBeFocused();
        await expect(first.locator(s('multi-select-checkbox'))).toBeVisible();

        await page.keyboard.press(' ');
        await expect(page.locator(s('context-menu'))).toBeVisible();

        await page.keyboard.press('Escape');

        await expect(page.locator(s('context-menu'))).toHaveCount(0);
        await expect(first).toBeFocused();
    });
});
