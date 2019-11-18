/* eslint-disable newline-per-chained-call */

import {element, by, browser} from 'protractor';
import {nav, waitFor, scrollToView, scrollRelative} from './utils';
import {el, ECE} from 'end-to-end-testing-helpers';

class GlobalSearch {
    ingestRepo: any;
    archiveRepo: any;
    publishedRepo: any;
    archivedRepo: any;
    goButton: any;
    searchInput: any;
    subject: any;
    marked: any;
    openGlobalSearch: () => void;
    setListView: any;
    setGridView: any;
    getItems: any;
    getItem: (index: any) => any;
    itemClick: (index: any) => void;
    getTextItem: (index: any) => any;
    openItemMenu: any;
    getRelatedItems: any;
    actionOnItem: (action: any, index: any, useFullLinkText?: any) => void;
    actionOnSubmenuItem: (action: any, submenu: any, index: any, linkTypeBtn?: any) => void;
    openToggleBox: (title: any) => void;
    toggleSearchTabs: (title: any) => void;
    toggleSubjectMetadata: () => void;
    toggleMarkedDesks: () => void;
    getSubjectFilteredTerm: (index: any) => any;
    getMarkedDesksFilteredTerm: (index: any) => any;
    getItemSubjectContains: any;
    getSelectedSubjectsInFilter: any;
    getSelectedTags: any;
    checkMarkedForHighlight: (highlight: any, item: any) => void;
    checkMarkedForDesk: (deskName: any, item: any) => void;
    showCustomSearch: () => void;
    toggleByType: (type: any) => void;
    openFilterPanel: () => void;
    openSavedSearchTab: () => void;
    openRawSearchTab: () => void;
    clickClearFilters: () => void;
    openParameters: () => void;
    selectDesk: (selectId: any, deskName: any) => void;
    selectMarkedDesk: (index: any) => void;
    selectCreator: (selectId: any, userName: any) => void;
    selectProvider: (selectId: any, provider: any) => void;
    getHeadlineElement: (index: any) => any;
    getPriorityElements: any;
    getGenreElements: any;
    getPriorityElementByIndex: (index: any) => any;
    getGenreElementByIndex: (index: any) => any;
    getArchivedContent: () => void;
    getDeskElements: any;
    getDeskElementByIndex: (index: any) => any;
    excludeDeskFacet: (index: any) => void;
    getExcludedFacetTags: any;
    getExcludedFacetTagByIndex: (index: any) => any;
    deleteExcludedFacetTagByIndex: (index: any) => void;

    constructor() {
        this.ingestRepo = element(by.id('ingest-collection'));
        this.archiveRepo = element(by.id('archive-collection'));
        this.publishedRepo = element(by.id('published-collection'));
        this.archivedRepo = element(by.id('archived-collection'));
        this.goButton = element(by.buttonText('Search'));
        this.searchInput = element(by.id('search-input'));
        this.subject = element.all(by.css('.dropdown-terms')).first();
        this.marked = element(by.id('marked-desks')).all(by.css('.dropdown-terms')).first();

        /**
         * Open dashboard for current selected desk/custom workspace.
         */
        this.openGlobalSearch = function() {
            nav('/search');
        };

        /**
         * Set the list view for global search list
         *
         * @return {promise}
         */
        this.setListView = function() {
            var list = element(by.css('i.icon-list-view'));

            return list.isDisplayed()
                .then((isVisible) => {
                    if (isVisible) {
                        list.click();
                        browser.sleep(1000);
                    }
                });
        };

        /**
         * Set the grid view for global search list
         *
         * @return {promise}
         */
        this.setGridView = function() {
            var grid = element(by.css('[tooltip="switch to grid view"]'));

            return grid.then((isVisible) => {
                if (isVisible) {
                    grid.click();
                    browser.sleep(1000);
                }
            });
        };

        /**
         * Get the list of items from global search
         *
         * @return {promise} list of elements
         */
        this.getItems = function() {
            return element.all(by.css('.media-box'));
        };

        /**
         * Get the item at 'index' from global
         * search list
         *
         * @param {number} index
         * @return {promise} element
         */
        this.getItem = function(index) {
            return this.getItems().get(index);
        };

        this.itemClick = function(index) {
            var itemElem = this.getItem(index);

            itemElem.click();

            browser.wait(() => itemElem.getAttribute('class').then((classes) => classes.includes('active')), 500);
            browser.sleep(350); // there is timeout on click
        };

        /**
         * Get the search element text at 'index' row
         *
         * @param {number} index
         * @return {string}
         */
        this.getTextItem = function(index) {
            return this.getItem(index).element(by.className('item-heading')).getText();
        };

        /**
         * Open the contextual menu for the 'index'
         * element from global search list
         *
         * @param {integer} index
         * @return {promise} menu element
         */
        this.openItemMenu = function(index) {
            var itemElem = this.getItem(index);

            browser.actions()
                .mouseMove(itemElem, {x: -50, y: -50}) // first move out
                .mouseMove(itemElem) // now it can mouseover for sure
                .perform();

            browser.sleep(100);
            const btn = itemElem.element(by.className('icn-btn'));

            browser.wait(ECE.elementToBeClickable(btn), 1000);
            btn.click();

            const menu = element(by.css('.dropdown__menu.open'));

            waitFor(menu, 3000);
            return menu;
        };

        /**
         * Get the list of relatedItems from related tab
         *
         * @return {promise} list of elements
         */
        this.getRelatedItems = function() {
            return element.all(by.repeater('relatedItem in relatedItems._items'));
        };

        /**
         * Perform the 'action' operation of the
         * 'index' element of the global search list
         *
         * @param {string} action
         * @param {number} index
         */
        this.actionOnItem = function(action, index, useFullLinkText) {
            var menu = this.openItemMenu(index);

            if (useFullLinkText) {
                menu.element(by.linkText(action)).waitReady()
                    .then((elem) => {
                        elem.click();
                    });
                return;
            }

            menu.element(by.partialLinkText(action)).waitReady()
                .then((elem) => {
                    elem.click();
                });
        };

        /**
         * Perform the 'action' operation in submenu items
         *
         * @param {string} action
         * @param {string} submenu
         * @param {number} index
         */
        this.actionOnSubmenuItem = function(action, submenu, index, linkTypeBtn) {
            var menu = this.openItemMenu(index);
            var header = menu.element(by.partialLinkText(action));
            var btn = linkTypeBtn ?
                menu.element(by.partialLinkText(submenu)) :
                menu.element(by.partialButtonText(submenu));

            browser.actions()
                .mouseMove(header, {x: -50, y: -50})
                .mouseMove(header)
                .perform();
            waitFor(btn, 1000);
            btn.click();
        };

        /**
         * Perform the toggle operation on toggle-box of
         * given 'title'
         *
         * @param {string} title
         */
        this.openToggleBox = function(title) {
            element(by.css('[data-title="' + title + '"]'))
                .all(by.css('[ng-click="toggleModule()"]')).first().click();
        };

        /**
         * Switch between Parameters and Filters tabs
         * given 'title'
         *
         * @param {string} title: parameters or filters
         */
        this.toggleSearchTabs = function(title) {
            if (title === 'parameters') {
                element(by.id('parameters-tab')).click();
            } else {
                element(by.id('filters-tab')).click();
                // wait until the aggregations are loaded
                browser.sleep(300);
            }
        };

        /**
         * Opens Subject metadata dropdown
         */
        this.toggleSubjectMetadata = function() {
            this.subject.element(by.css('.dropdown__toggle')).click();
        };

        /**
         * Opens Marked Desks dropdown
         */
        this.toggleMarkedDesks = function() {
            this.marked.element(by.css('.dropdown__toggle')).click();
        };

        /**
         * Gets the term on given 'index' from the
         * filtered metadata subject list
         *
         * @param {number} index
         * @return {string}
         */
        this.getSubjectFilteredTerm = function(index) {
            return this.subject.all(by.repeater('t in $vs_collection track by t[uniqueField]')).get(index).getText();
        };

        /**
         * Gets the term on given 'index' from the
         * filtered Marked desks list
         *
         * @param {number} index
         * @return {string}
         */
        this.getMarkedDesksFilteredTerm = function(index) {
            return this.marked.all(by.repeater('t in $vs_collection track by t[uniqueField]')).get(index).getText();
        };

        /**
         * Get Item's subjects from metadata tab in preview pane
         *
         * @return {string}
         */
        this.getItemSubjectContains = function() {
            return element.all(by.css('[ng-if="item.subject && item.subject.length > 0"]')).first().getText();
        };

        /**
         * Get list of selected subjects found in filter pane
         *
         * @return {promise} list of elements
         */
        this.getSelectedSubjectsInFilter = function() {
            return element.all(by.repeater('t in selectedItems'));
        };

        /**
         * Get list of selected parameter tags appears on list after applied search
         *
         * @return {promise} list of elements
         */
        this.getSelectedTags = function() {
            return element.all(by.repeater('parameter in tags.selectedParameters'));
        };

        /**
         * Check if on search view an item is marked for highlight
         *
         * @param {string} highlight
         * @param {number} item
         */
        this.checkMarkedForHighlight = function(highlight, item) {
            var crtItem = this.getItem(item);

            expect(crtItem.element(by.className('icon-star')).isDisplayed()).toBeTruthy();
            expect(crtItem.element(by.className('icon-star')).getAttribute('tooltip-html-unsafe'))
                .toContain(highlight);
        };

        /**
         * Check if on search view an item is marked for desk
         *
         * @param {string} deskName
         * @param {number} item
         */
        this.checkMarkedForDesk = function(deskName, item) {
            var crtItem = this.getItem(item);

            expect(crtItem.element(by.className('icon-bell')).isDisplayed()).toBeTruthy();
        };

        /**
         * Show custom search right panel
         */
        this.showCustomSearch = function() {
            browser.sleep(500);
            element(by.className('filter-trigger'))
                .element(by.className('icon-filter-large')).click();
            browser.sleep(500);
        };

        /**
         * Toggle search by item type combobox
         *
         * @param {string} type
         */
        this.toggleByType = function(type) {
            browser.actions().mouseMove(element(by.className('filetype-icon-' + type))).perform();
            element(by.id('filetype-icon-' + type)).click();
        };

        /**
         * Open the filter panel
         */
        this.openFilterPanel = function() {
            element(by.css('.filter-trigger')).click();
            browser.sleep(200); // animation
        };

        /**
         * Open the saved search tab
         */
        this.openSavedSearchTab = function() {
            element(by.id('saved_searches_tab')).click();
        };

        /**
         * Open the raw search tab
         */
        this.openRawSearchTab = function() {
            element(by.id('raw_search_tab')).click();
        };

        /**
         * Click the Clear Filters button
         */
        this.clickClearFilters = function() {
            element(by.id('clear_filters')).click();
        };

        /**
         * Open the search Parameters from
         */
        this.openParameters = function() {
            this.toggleSearchTabs('parameters');
        };

        /**
         * Open the search Parameters from
         * @param {string} selectId - Id of the <select> element
         * @param {string} deskName - Name of the desk.
         */
        this.selectDesk = function(selectId, deskName) {
            element(by.id(selectId)).element(by.css('option[label="' + deskName + '"]')).click();
        };

        /**
         * Open the search Parameters marked desk field
         * @param {int} selectId - Index of the desk
         */
        this.selectMarkedDesk = function(index) {
            const advancedSearchPanel = el(['advanced-search-panel']);
            var markedDesks = element(by.id('marked-desks'));

            const toggleButton = markedDesks.element(by.className('dropdown-toggle'));

            scrollToView(toggleButton);
            scrollRelative(advancedSearchPanel, 'up', 60); // account for sticky tabs

            toggleButton.click();
            markedDesks.all(by.repeater('term in $vs_collection track by term[uniqueField]')).get(index).click();
        };

        /**
         * Select the user passed user display name from the passed <select> element
         * @param {string} selectId - Id of the <select> element
         * @param {string} userName - Name of the desk.
         */
        this.selectCreator = function(selectId, userName) {
            element(by.id(selectId)).element(by.css('option[label="' + userName + '"]')).click();
        };

        /**
         * Select the provider passed provider name from the passed <select> element
         * @param {string} selectId - Id of the <select> element
         * @param {string} provider - Name ingest provider.
         */
        this.selectProvider = function(selectId, provider) {
            element(by.id(selectId)).element(by.css('option[label="' + provider + '"]')).click();
        };

        /**
         * Get the Element Heading by index
         * @param {number} index
         * @return {promise} headline element
         */
        this.getHeadlineElement = function(index) {
            return this.getItem(index).element(by.className('item-heading'));
        };

        /**
         * Get the Priority Elements
         * @return {promise} Priority elements
         */
        this.getPriorityElements = function() {
            return element.all(by.repeater('(key,value) in aggregations.priority'));
        };

        /**
         * Get the Genre Elements
         * @return {promise} Genre elements
         */
        this.getGenreElements = function() {
            return element.all(by.repeater('(key,value) in aggregations.genre'));
        };

        /**
         * Get the Priority Element by Index
         * @param {number} index
         * @return {promise} Priority element
         */
        this.getPriorityElementByIndex = function(index) {
            return this.getPriorityElements().get(index);
        };

        /**
         * Get the Genre Element by Index
         * @param {number} index
         * @return {promise} Genre element
         */
        this.getGenreElementByIndex = function(index) {
            return this.getGenreElements().get(index);
        };

        /**
         * Get the Archived Content
         */
        this.getArchivedContent = function() {
            this.openFilterPanel();
            this.ingestRepo.click();
            this.archiveRepo.click();
            this.publishedRepo.click();
        };

        /**
         * Get the Desk Elements
         * @return {promise} Desk elements
         */
        this.getDeskElements = function() {
            return element.all(by.repeater('(key,value) in aggregations.desk'));
        };

        /**
         * Get the Desk Element by index
         * @param {number} index
         * @return {promise} Desk Element
         */
        this.getDeskElementByIndex = function(index) {
            return this.getDeskElements().get(index);
        };

        /**
         * Click Remove button of the Desk Element
         * @param {number} index
         */
        this.excludeDeskFacet = function(index) {
            var deskFacet = this.getDeskElementByIndex(index);

            browser.actions()
                .mouseMove(deskFacet)
                .perform();
            deskFacet.element(by.className('filter-box__negate-filter')).click();
        };

        /**
         * Get list of excluded facet tags
         *
         * @return {promise} list of elements
         */
        this.getExcludedFacetTags = function() {
            return element.all(by.repeater('(type,keys) in tags.removedFacets'));
        };

        /**
         * Get list of excluded facet tags
         * @param {number} index
         * @return {promise} element
         */
        this.getExcludedFacetTagByIndex = function(index) {
            return this.getExcludedFacetTags().get(index);
        };

        /**
         * Delete the excluded facet tag by index
         * @param {number} index
         */
        this.deleteExcludedFacetTagByIndex = function(index) {
            this.getExcludedFacetTagByIndex(index).element(by.tagName('button')).click();
        };
    }
}

export const globalSearch = new GlobalSearch();
