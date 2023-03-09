import {element, browser, by} from 'protractor';

import {waitForSuperdesk, click, waitFor} from './helpers/utils';
import {LoginModal, currentUserButton, signOutButton} from './helpers/pages';

describe('login', () => {
    const modal = new LoginModal();
    const currentUserUsername = element(by.className('current-user__username'));

    it('form renders modal on load', () => {
        expect(modal.btn.isDisplayed()).toBe(true);
    });

    it('user can log in', () => {
        modal.login('admin', 'admin');
        waitForSuperdesk();
        expect(modal.btn.isDisplayed()).toBe(false);
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/workspace');
        click(currentUserButton);
        waitFor(currentUserUsername);
        expect(currentUserUsername.getText()).toBe('admin');
    });

    it('user can log out', () => {
        modal.login('admin', 'admin');
        waitForSuperdesk();
        click(currentUserButton);
        click(signOutButton);

        browser.wait(() => element(by.id('login-btn')).isPresent(), 5000);
    });

    it('unknown user can\'t log in', () => {
        modal.login('foo', 'bar');
        expect(modal.btn.isDisplayed()).toBe(true);
        expect(browser.getCurrentUrl()).not.toBe(browser.baseUrl + '/#/workspace');
        expect(modal.error.isDisplayed()).toBe(true);
    });
});
