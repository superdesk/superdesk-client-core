import {LoginModal} from './pages';
import {
    browser, protractor, element, by, ElementFinder, ElementArrayFinder, ExpectedConditions as EC,
} from 'protractor';
import {s} from '@superdesk/end-to-end-testing-helpers';

// construct url from uri and base url
export function constructUrl(base, uri) {
    return base.replace(/\/$/, '') + uri;
}

// authenticate if needed
export function login(username?, password?) {
    let usr = username || 'admin';
    let pwd = password || 'admin';
    var modal = new LoginModal();

    return modal.btn.isDisplayed()
        .then((needLogin) => {
            if (needLogin) {
                return modal.login(usr, pwd);
            }
        });
}

// open url
export function changeUrl(url) {
    return browser.get(url).then(waitForSuperdesk);
}

// open url and authenticate
export function openUrl(url) {
    return browser.get(url)
        .then(login)
        .then(waitForSuperdesk);
}

export function printLogs(prefix) {
    return browser.manage()
        .logs()
        .get('browser')
        .then((browserLog) => {
            var logs = browserLog.filter((log) => log.level.value >= 1000);

            for (const log of logs) {
                console.error(`BROWSER CONSOLE ERROR: ${log.message}`);
            }
        });
}

export function waitForSuperdesk() {
    return browser.driver.wait(
        () => browser.driver.executeScript('return window.superdeskIsReady || false'),
        5000,
        '"window.superdeskIsReady" is not here',
    ).then((res) => {
        browser.executeScript('window.superdesk_e2e_tests_running = true;');

        return res;
    });
}

export function refresh() {
    browser.refresh().then(() => waitForSuperdesk());
}

/**
 * Navigate to given location.
 *
 * Unlinke openUrl it doesn't reload the page, only changes #hash in url
 *
 * @param {string} location Location where to navigate without # (eg. users, workspace/content)
 * @return {Promise}
 */
export function nav(location) {
    return login().then(() => browser.setLocation(location));
}

/**
 * Nav shortcut for beforeEach, use like `beforeEach(route('/workspace'));`
 *
 * @param {string} location
 * @return {function}
 */
export function route(location) {
    return function() {
        nav(location);
    };
}

/**
 * Finds and returns the n-th <option> element of the given dropdown list
 *
 * @param {ElementFinder} dropdown - the <select> element to pick the option from
 * @param {number} n - the option's position in the dropdown's list of options,
 *   must be an integer (NOTE: list positions start with 1!)
 *
 * @return {ElementFinder} the option element itself (NOTE: might not exist)
 */
export function getListOption(dropdown, n) {
    var cssSelector = 'option:nth-child(' + n + ')';

    return dropdown.$(cssSelector);
}

/**
 * Performs CTRL + key action
 *
 * @param {char} key
 */
export function ctrlKey(key) {
    var Key = protractor.Key;

    browser.actions()
        .sendKeys(Key.chord(Key.CONTROL, key))
        .perform();

    browser.sleep(1000);
}

/**
 * Performs COMMAND + key action
 *
 * @param {char} key
 */
export function commandKey(key) {
    var Key = protractor.Key;

    browser.actions().sendKeys(Key.chord(Key.COMMAND, key))
        .perform();
}

/**
 * Performs CTRL + SHIFT + key action
 *
 * @param {char} key
 */
export function ctrlShiftKey(key) {
    var Key = protractor.Key;

    browser.actions().sendKeys(Key.chord(Key.CONTROL, Key.SHIFT, key))
        .perform();
}

/**
 * Performs SHIFT + key action
 */
export function shiftKey(key: string) {
    var Key = protractor.Key;

    browser.actions().sendKeys(Key.chord(Key.SHIFT, key))
        .perform();
}

/**
 * Performs CTRL + ALT + key action
 *
 * @param {char} key
 */
export function ctrlAltKey(key) {
    var Key = protractor.Key;

    browser.actions().sendKeys(Key.chord(Key.CONTROL, Key.ALT, key))
        .perform();
}

/**
 * Performs ALT + key action
 *
 * @param {char} key
 */
export function altKey(key) {
    var Key = protractor.Key;

    browser.actions().sendKeys(Key.chord(Key.ALT, key))
        .perform();
}

export function assertToastMsg(type: 'info' | 'success' | 'error', msg: string) {
    const elem = element(s([`notification--${type}`], msg));

    elem.isPresent().then((present) => {
        // Only click if the toast is still present.
        if (present) {
            elem.click();
        }
    });
}

// Don't expect message to appear
export function assertToastMsgNotDisplayed(type, msg) {
    expect(element.all(by.cssContainingText(`[data-test-id="notification--${type}"]`, msg)).isPresent()).toBe(false);
}

export function waitForToastMsgDisappear(type, msg) {
    browser.wait(protractor.ExpectedConditions.invisibilityOf(
        element(by.cssContainingText(`[data-test-id="notification--${type}"]`, msg)),
    ), 3000);
}

/**
 * Wait for element to be displayed
 *
 * @param {Element} elem
 * @param {number} time
 * @return {Promise}
 */
export function waitFor(elem: ElementFinder | ElementArrayFinder, time?: number) {
    browser.wait(() => elem.isPresent(), time || 500);
    return browser.wait(() => elem.isDisplayed(), time || 500);
}

/**
 * Move mouse over given elem
 *
 * @param {Element} elem
 */
export function hover(elem) {
    browser.actions().mouseMove(elem, {x: 3, y: 3})
        .perform();
}

/**
 * Wait for an element to be hidden from display, or removed from the DOM
 * @param {Element} elem - The element you wish to wait for to be hidden
 * @param {number} time - The ms timeout period, defaults to 1000
 * @return {Promise}
 */
export function waitHidden(elem, time?) {
    return browser.wait(() => elem.isPresent()
        .then((isPresent) =>
            !isPresent ? true : elem.isDisplayed()
                .then((isDisplayed) => !isDisplayed),
        ), time || 1000);
}

export function scrollToView(elem: ElementFinder) {
    browser.executeScript('arguments[0].scrollIntoViewIfNeeded();', elem);
}

export function scrollRelative(elem: ElementFinder, direction: 'up'| 'down', pixelsToScroll: number) {
    browser.executeScript(`arguments[0].scrollTop ${direction === 'up' ? '-=' : '+='} ${pixelsToScroll};`, elem);
}

/**
 * Take and save screenshot if SCREENSHOTS_DIR env variable is set
 *
 * @param {string} name
 */
export function screenshot(name) {
    let path = require('path'),
        fs = require('fs'),
        dir = process.env.SCREENSHOTS_DIR;

    if (!dir) {
        return;
    }
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    browser.takeScreenshot().then((png) => {
        let file = path.join(dir, name + '.png'),
            stream = fs.createWriteStream(file);

        stream.write(Buffer.from(png, 'base64'));
        stream.end();
    });
}

export function acceptConfirm() {
    element(by.className('p-dialog-footer'))
        .element(by.className('btn--primary'))
        .click();

    // wait for modal to disappear
    browser.wait(protractor.ExpectedConditions.invisibilityOf(
        element(by.className('p-component-overlay')),
    ), 2000);
}

export function click(elem: ElementFinder, message?: string) {
    browser.wait(EC.elementToBeClickable(elem), 2000, message);
    return elem.click();
}
