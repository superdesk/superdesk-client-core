import {Page, Locator} from '@playwright/test';

/**
 * .clear method from playwright doesn't work in a stable manner for editor3 inputs
 */
export async function clearInput(page: Page, textInputLocator: Locator): Promise<void> {
    await textInputLocator.focus();
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
}