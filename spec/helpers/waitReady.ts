/**
 * Actively wait for an element present and displayed up to specTimeoutMs
 * ignoring useless webdriver errors like StaleElementError.
 *
 * Usage:
 * Add `require('./waitReady.js');` in your onPrepare block or file.
 *
 * @example
 * expect($('.some-html-class').waitReady()).toBeTruthy();
 */


var ElementFinder = $('').constructor;

ElementFinder.prototype.waitReady = function(optStr) {
    var self = this;
    var specTimeoutMs = browser.allScriptsTimeout * 2;
    var driverWaitIterations = 0;
    var lastWebdriverError;

    function _throwError() {
        throw new Error('Expected "' + self.locator().toString() +
            '" to be present and visible. ' +
            'After ' + driverWaitIterations + ' driverWaitIterations. ' +
            'Last webdriver error: ' + lastWebdriverError);
    }

    function _isPresentError(err) {
        /* globals error: true */
        lastWebdriverError = typeof error !== 'undefined' && error !== null ? err.toString() : err;
        return false;
    }

    return browser.driver.wait(() => {
        driverWaitIterations++;
        if (optStr === 'withRefresh') {
            // Refresh page after more than some retries
            if (driverWaitIterations > 7) {
                _refreshPage();
            }
        }
        return self.isPresent().then((present) => {
            if (present) {
                return self.isDisplayed().then((visible) => {
                    lastWebdriverError = 'visible:' + visible;
                    return visible;
                }, _isPresentError);
            }

            lastWebdriverError = 'present:' + present;
            return false;
        }, _isPresentError);
    }, specTimeoutMs).then((waitResult) => {
        if (!waitResult) {
            _throwError();
        }
        return self;
    }, (err) => {
        _isPresentError(err);
        _throwError();
        return false;
    });
};

// Helpers
function _refreshPage() {
    // Swallow useless refresh page webdriver errors
    browser.navigate().refresh();
}
