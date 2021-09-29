import {element, browser, by} from 'protractor';

import {waitForSuperdesk} from './helpers/utils';
import {LoginModal} from './helpers/pages';

describe('login', () => {
    var modal;

    beforeEach(() => {
        modal = new LoginModal();
    });

    it('form renders modal on load', () => {
        expect(modal.btn.isDisplayed()).toBe(true);
    });

    it('user can log in', () => {
        modal.login('admin', 'admin');
        waitForSuperdesk();
        expect(modal.btn.isDisplayed()).toBe(false);
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/workspace');
        element(by.css('button.current-user')).click();
        expect(
            element(by.css('.user-info .displayname'))
                .waitReady()
                .then((elem) => elem.getText()),
        ).toBe('admin');
    });

    it('user can log out', () => {
        modal.login('admin', 'admin');
        waitForSuperdesk();
        element(by.css('button.current-user')).click();

        // wait for sidebar animation to finish
        browser.wait(() => element(by.buttonText('SIGN OUT')).isDisplayed(), 200);

        element(by.buttonText('SIGN OUT')).click();

        browser.wait(() => element(by.id('login-btn')).isPresent(), 5000);
    });

    it('unknown user can\'t log in', () => {
        modal.login('foo', 'bar');
        expect(modal.btn.isDisplayed()).toBe(true);
        expect(browser.getCurrentUrl()).not.toBe(browser.baseUrl + '/#/workspace');
        expect(modal.error.isDisplayed()).toBe(true);
    });
});
