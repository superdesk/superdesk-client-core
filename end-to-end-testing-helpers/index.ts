import {element, by, ElementFinder, ElementArrayFinder, browser, Locator, promise} from 'protractor';
import {ECE} from './expected-conditions-extended';
import {executeContextMenuAction} from './articlesList';
import {navigateTo} from './workspace';

const WAIT_TIMEOUT = 200;

const getTestSelector = (testIds: Array<string> | null = null, text: string | null = null): Locator => {
    const selector = (testIds == null ? [] : testIds)
        .map((testId) => `[data-test-id="${testId}"]`)
        .join(' ');

    return text != null ? by.cssContainingText(selector, text) : by.css(selector);
};

export function el(
    testIds: Array<string> | null = null,
    byLocator: Locator | null = null, // example: by.cssContainingText('option', 'Text')
    parent: ElementFinder | null = null,
): ElementFinder {
    var locator;

    if (parent != null) {
        locator = parent.element(getTestSelector(testIds));
    } else {
        locator = element(getTestSelector(testIds));
    }

    const elem = byLocator == null ? locator : locator.element(byLocator);

    browser.wait(() => elem.isPresent(), WAIT_TIMEOUT);
    return elem;
}

export function els(
    testIds: Array<string> | null = null,
    byLocator: Locator | null = null, // example: by.cssContainingText('option', 'Text')
    parent: ElementFinder | null = null,
): ElementArrayFinder {
    var locator;

    if (parent != null) {
        locator = parent.all(getTestSelector(testIds));
    } else {
        locator = element.all(getTestSelector(testIds));
    }

    return byLocator == null ? locator : locator.all(byLocator);
}

export const s = getTestSelector;

export function hasElementCount(
    locator: ElementArrayFinder,
    expectedElementCount: number,
): () => promise.Promise<boolean> {
    return () => locator.count().then((count) => count === expectedElementCount);
}

export {ECE} from './expected-conditions-extended';

export function login(username?: string, password?: string) {
    browser.wait(ECE.visibilityOf(el(['login-page'])));
    el(['login-page', 'username']).sendKeys(username || browser.params.username);
    el(['login-page', 'password']).sendKeys(password || browser.params.password);
    el(['login-page', 'submit']).click();

    browser.wait(ECE.invisibilityOf(el(['login-page'])));
}

export function hover(elem: ElementFinder) {
    browser.actions().mouseMove(elem).perform();
}

export const articleList = {
    executeContextMenuAction,
};

export const workspace = {
    navigateTo,
};
