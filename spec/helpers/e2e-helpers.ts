import {element, by, ElementFinder, ElementArrayFinder} from 'protractor';

const getTestSelector = (testIds: Array<string> = null): string =>
    (testIds == null ? [] : testIds)
        .map((testId) => `[data-test-id="${testId}"]`)
        .join(' ');

export function el(
    testIds: Array<string> = null,
    byLocator = null, // example: by.cssContainingText('option', 'Text')
    parent = null,
): ElementFinder {
    var locator;

    if (parent != null) {
        locator = parent.element(by.css(getTestSelector(testIds)));
    } else {
        locator = element(by.css(getTestSelector(testIds)));
    }

    return byLocator == null ? locator : locator.element(byLocator);
}

export function els(
    testIds: Array<string> = null,
    byLocator = null, // example: by.cssContainingText('option', 'Text')
    parent = null,
): ElementArrayFinder {
    var locator;

    if (parent != null) {
        locator = parent.all(by.css(getTestSelector(testIds)));
    } else {
        locator = element.all(by.css(getTestSelector(testIds)));
    }

    return byLocator == null ? locator : locator.all(byLocator);
}

export const s = getTestSelector;

export function hasElementCount(locator, expectedElementCount) {
    return () => locator.count().then((count) => count === expectedElementCount);
}
