/* eslint-disable newline-per-chained-call */

import {element, browser, by} from 'protractor';

import {globalSearch} from './helpers/search';
import {nav, waitForSuperdesk, login} from './helpers/utils';
import {LoginModal} from './helpers/pages';

describe('saved_search', () => {
    beforeEach(() => {
        nav('/search').then(globalSearch.setListView());
    });

    it('can save a private search', () => {
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.openFilterPanel();
        globalSearch.toggleSearchTabs('filters');
        expect(globalSearch.getItems().count()).toBe(16);
        expect(globalSearch.getPriorityElements().count()).toBe(3);
        var priority = globalSearch.getPriorityElementByIndex(0);

        priority.click();
        browser.sleep(100);
        expect(globalSearch.getItems().count()).toBe(1);
        element(by.id('save_search_init')).click();
        var searchPanel = element(by.className('save-search-panel'));

        searchPanel.all(by.id('search_name')).sendKeys('A Search');
        searchPanel.all(by.id('search_description')).sendKeys('Description for search');
        searchPanel.all(by.id('search_save')).click();
        var savedSearch = element.all(by.repeater('search in userSavedSearches')).get(0);

        expect(savedSearch.element(by.css('.search-name')).getText()).toBe('A Search');
    });

    it('can save a global search and another user sees it', () => {
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.openFilterPanel();
        globalSearch.toggleSearchTabs('filters');
        expect(globalSearch.getItems().count()).toBe(16);
        expect(globalSearch.getPriorityElements().count()).toBe(3);
        var priority = globalSearch.getPriorityElementByIndex(0);

        priority.click();
        expect(globalSearch.getItems().count()).toBe(1);
        element(by.id('save_search_init')).click();
        var searchPanel = element(by.className('save-search-panel'));

        searchPanel.all(by.id('search_name')).sendKeys('A Global Search');
        searchPanel.all(by.id('search_description')).sendKeys('Description for search');
        searchPanel.all(by.id('search_global')).click();
        searchPanel.all(by.id('search_save')).click();
        var savedSearch = element.all(by.repeater('search in userSavedSearches')).get(0);

        expect(savedSearch.element(by.css('.search-name')).getText()).toBe('A Global Search [Global]');
        element(by.css('button.current-user')).click();

        // wait for sidebar animation to finish
        browser.wait(() => element(by.buttonText('SIGN OUT')).isDisplayed(), 200);

        element(by.buttonText('SIGN OUT')).click();

        var modal = new LoginModal();

        modal.login('admin1', 'admin');

        browser.get('/#/search').then(login('admin1')).then(waitForSuperdesk);
        globalSearch.openFilterPanel();
        browser.sleep(500);

        globalSearch.openSavedSearchTab();
        browser.sleep(200);
        savedSearch = element.all(by.repeater('search in globalSavedSearches')).get(0);
        expect(savedSearch.element(by.css('.search-name')).getText()).toBe('A Global Search by first name last name');
    });
});
