

var dashboard = require('./helpers/dashboard'),
    altKey = require('./helpers/utils').altKey,
    ctrlAltKey = require('./helpers/utils').ctrlAltKey;

describe('workspace', () => {
    beforeEach(() => {
        dashboard.openDashboard();
    });

    it('can switch views by keyboard', () => {
        // wait for icons
        browser.wait(() => element(by.className('big-icon--view')).isDisplayed(), 2000);

        // Can switch to monitoring view by pressing alt + m
        altKey('m');
        expect(browser.getCurrentUrl()).toMatch('/workspace/monitoring');

        // Can switch to spiked view by pressing ctrl + alt + k
        ctrlAltKey('k');
        expect(browser.getCurrentUrl()).toMatch('/workspace/spike-monitoring');

        // Can switch to personal view by pressing alt + p
        altKey('p');
        expect(browser.getCurrentUrl()).toMatch('/workspace/personal');

        // Can switch to search view by pressing ctrl + alt + f
        ctrlAltKey('f');
        expect(browser.getCurrentUrl()).toMatch('/search');

        // Can get back to dashboard by pressing ctrl + alt + b
        ctrlAltKey('b');
        expect(browser.getCurrentUrl()).toMatch('/workspace');
    });
});
