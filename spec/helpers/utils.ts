import {login as LoginModal} from './pages';
import {browser, protractor, element, by, ElementFinder} from 'protractor';

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
export function open(url) {
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

            console.info(
                (prefix ? prefix + ' ' : '') +
                'log: ' + require('util').inspect(logs, {dept: 3}),
            );
        });
}

export function waitForSuperdesk() {
    return browser.driver.wait(() =>
        browser.driver.executeScript('return window.superdeskIsReady || false'),
    5000,
    '"window.superdeskIsReady" is not here');
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

    browser.actions().sendKeys(Key.chord(Key.CONTROL, key))
        .perform();
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

/**
 * Asserts that a toast message of a particular type has appeared with its
 * message containing the given string.
 *
 * @param {string} type - type of the toast notificiation ("info", "success" or
 *   "error")
 * @param {string} msg - a string expected to be present in the toast message
 */
export function assertToastMsg(type, msg) {
    browser.sleep(500);
    expect(
        element.all(by.cssContainingText(`.notification-holder .alert-${type}`, msg))
            .first()
            .isDisplayed(),
    ).toBe(true);
    browser.sleep(500);
}

/**
 * Wait for element to be displayed
 *
 * @param {Element} elem
 * @param {number} time
 * @return {Promise}
 */
export function wait(elem, time?) {
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
    browser.executeScript('arguments[0].scrollIntoView();', elem);
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

        stream.write(new Buffer(png, 'base64'));
        stream.end();
    });
}

export function acceptConfirm() {
    element(by.className('modal__footer'))
        .element(by.className('btn--primary'))
        .click();

    // wait for modal to disappear
    browser.wait(protractor.ExpectedConditions.invisibilityOf(
        element(by.className('modal__backdrop')),
    ), 2000);
}
