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

export function getEditor3FormattingOptions(field: Locator): Promise<Array<string>> {
    return field.locator(s('toolbar', 'formatting-option'))
        .all()
        .then((elements) => Promise.all(
            elements.map((element) => element.getAttribute('data-test-value')),
        ));
}