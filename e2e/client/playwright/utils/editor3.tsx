import {Locator} from '@playwright/test';
import {s} from '.';

export function getEditor3Paragraphs(field: Locator): Promise<Array<string>> {
    return field.locator('.DraftEditor-root')
        .first() // there might be multiple roots when working with nested blocks e.g. multi-line-quote
        .locator('[data-contents="true"]')
        .first() // there might be multiple [data-contents] when working with nested blocks e.g. multi-line-quote
        .locator('> *')
        .allInnerTexts()
        .then((items) => items.filter((text) => text.trim().length > 0));
}

export async function getEditor3FormattingOptions(field: Locator): Promise<Array<string>> {
    const locators = await field.locator(s('toolbar', 'formatting-option')).all();

    const result: Array<string> = [];

    for (const locator of locators) {
        const val = await locator.getAttribute('data-test-value');

        if (val != null) {
            result.push(val);
        }
    }

    return result;
}

export async function setEditor3FieldValue(locator: Locator, value: string) {
    for (let i = 0; i < 10; i++) {
        await locator.clear();
        await locator.fill(value);

        const currentInputValue = await locator.innerText();

        if (currentInputValue === value) return;
    }

    throw new Error(`Failed to fill input with "${value}" after 10 attempts.`);
}
