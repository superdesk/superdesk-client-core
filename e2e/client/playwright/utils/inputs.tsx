import {Locator} from '@playwright/test';

/**
 * calling playwright's .clear method once doesn't always work for editor3 inputs
 */
export async function clearInput(textInputLocator: Locator): Promise<void> {
    for (let i = 0; i < 10; i++) {
        await textInputLocator.clear();

        const currentValue = (await textInputLocator.innerText()).trim();

        if (currentValue === '') {
            return;
        }
    }
}