/* eslint-disable newline-per-chained-call */

import {
    element, by, browser, protractor, ElementFinder, promise as wdpromise, ExpectedConditions as EC,
} from 'protractor';
import {nav, click, waitFor, acceptConfirm, scrollToView} from './utils';
import {s, ECE, el, els, articleList, hover} from '@superdesk/end-to-end-testing-helpers';
import {multiAction} from './actions';

export const MONITORING_DEBOUNCE_MAX_WAIT = 10000;

class Monitoring {
    ignoreSaveChangesDialog() {
        element(by.className('p-dialog-footer')).element(by.buttonText('Ignore')).click();
    }

    expectSaveChangesDialog() {
        browser.wait(ECE.textToBePresentInElement(element(by.className('p-dialog-header')), 'Save changes?'), 3000);
    }

    config: ElementFinder;
    label: ElementFinder;
    openMonitoring: () => void;
    showMonitoring: () => void;
    showSpiked: () => void;
    showPersonal: () => void;
    showSearch: () => void;
    createItem: (template: string) => void;
    createFromDeskTemplate: () => any;
    getGroup: (group: number) => any;
    getGroups: () => any;
    getItem: (group: any, item: any) => any;
    getGroupItems: (group: any) => any;
    actionOnDeskSingleView: () => void;
    getDeskSingleViewTitle: any;
    actionOnStageSingleView: () => void;
    getStageSingleViewTitle: any;
    getSingleViewItemCount: any;
    actionMonitoringHome: any;
    getMonitoringHomeTitle: any;
    getSpikedItems: () => any;
    getAllItems: any;
    getMonitoringWordCount: (itemId: string) => wdpromise.Promise<number>;
    expectWordCount: (itemId: string, expectedCount: number) => void;
    getPersonalItem: (index: any) => any;
    getPersonalItemText: (index: any) => any;
    getSpikedItem: (item: any) => any;
    getSpikedTextItem: (index: any) => any;
    getTextItem: (group: any, item: any) => any;
    getTextItemBySlugline: (group: any, item: any) => any;
    searchAction: (search: any) => void;
    filterAction: (fileType: any) => void;
    compactActionDropdown: () => ElementFinder;
    previewAction: (group: any, item: any) => void;
    closePreview: () => void;
    getPreviewTitle: any;
    getPreviewBody: () => ElementFinder;
    setOrder: (field: any, switchDir: any) => void;
    openAction: (group: any, item: any) => void;
    tabAction: (tab: any) => void;
    openRelatedItem: (index: any) => void;
    actionOnItem: (action: any, group: any, item: any, useFullButtonText?: any, confirm?: any) => void;
    getMenuActionElement: (action: any, group: any, item: any) => any;
    actionOnItemSubmenu: (action: any, submenu: any, group: any, item: any) => void;
    editItem: (group: any, item: any) => void;
    selectItem: (group: any, item: any) => any;
    selectSpikedItem: (item: any) => any;
    selectGivenItem: (item: any) => any;
    spikeMultipleItems: () => void;
    unspikeMultipleItems: any;
    unspikeItem: (item, stage?: string) => void;
    openItemMenu: (group: any, item: any) => ElementFinder;
    showMonitoringSettings: () => void;
    setLabel: (label: any) => void;
    nextStages: () => void;
    nextSearches: () => void;
    previousSearches: () => void;
    nextReorder: () => void;
    previousReorder: () => void;
    previousMax: () => void;
    cancelSettings: () => void;
    saveSettings: () => void;
    getDesk: (index: any) => any;
    getStage: (desk: any, stage: any) => any;
    getGlobalSearch: (index: any) => any;
    getPrivateSearch: (index: any) => any;
    getGlobalSearchText: (search: any) => any;
    getPrivateSearchText: (search: any) => any;
    toggleDesk: (desk: any) => void;
    toggleStage: (desk: any, stage: any) => void;
    toggleDeskOutput: (desk: any) => void;
    toggleScheduledDeskOutput: (desk: any) => void;
    togglePersonal: () => void;
    toggleGlobalSearch: (search: any) => void;
    togglePrivateSearch: (search: any) => void;
    toggleAllSearches: () => void;
    toggleGlobalSearches: () => void;
    getOrderItem: (item: any) => ElementFinder;
    getOrderItemText: (item: any) => any;
    moveOrderItem: (start: any, end: any) => any;
    getMaxItem: (item: any) => ElementFinder;
    setMaxItems: (item: any, value: any) => void;
    hasClass: (_element: any, cls: any) => any;
    showHideList: () => void;
    openCreateMenu: () => void;
    openSendMenu: () => void;
    publish: () => void;
    getPublishButtonText: any;
    uploadModal: ElementFinder;
    openFetchAsOptions: (group: any, item: any) => void;
    clickOnFetchButton: any;
    clickOnCancelButton: any;
    getMultiSelectCount: any;
    fetchAs: (group: any, item: any) => any;
    fetchAndOpen: any;
    createPackageFromItems: () => void;
    checkMarkedForHighlight: (highlight: any, group: any, item: any) => void;
    closeHighlightsPopup: () => void;
    checkMarkedForDesk: (desk: any, group: any, item: any) => void;
    closeMarkedForDeskPopup: () => void;
    removeFromFirstHighlight: (group: any, item: any) => void;
    removeFromFirstDesk: (group: any, item: any) => void;
    selectDesk: (desk: any) => void;
    switchToDesk: any;
    turnOffWorkingStage: (deskIndex: any, canCloseSettingsModal: any) => void;
    expectIsChecked: (group: any, item: any) => any;
    expectIsNotChecked: (group: any, item: any) => any;
    turnOffDeskWorkingStage: (deskIndex: any, canCloseSettingsModal?: any) => void;
    openSearchBox: () => void;
    searchInput: ElementFinder;
    getCorrectionItems: (group: any) => any;
    getTakeItems: (group: any) => any;
    getPackageItem: (index: any) => ElementFinder;
    getPackageItemActionDropdown: (index: any) => ElementFinder;
    getPackageItemLabelEntry: () => ElementFinder;
    getPackageItemLabelOption: (index: any) => ElementFinder;
    getPackageItemLabel: (index: any) => ElementFinder;
    isGroupEmpty: (group: any) => boolean;

    constructor() {
        this.config = element(by.className('aggregate-settings'));
        this.label = element(by.model('widget.configuration.label'));

        this.openMonitoring = function() {
            nav('/workspace/monitoring');
            browser.wait(ECE.visibilityOf(el(['monitoring-view'])), 2000);
        };

        this.showMonitoring = function() {
            el(['workspace-navigation'], by.css('[aria-label="Monitoring"]')).click();
        };

        this.showSpiked = function() {
            el(['workspace-navigation'], by.css('[aria-label="Spiked Items"]')).click();
        };

        /**
         * Open personal monitoring view
         */
        this.showPersonal = function() {
            el(['workspace-navigation'], by.css('[aria-label="Personal space"]')).click();
        };

        /**
         * Open global search view
         */
        this.showSearch = function() {
            el(['workspace-navigation'], by.css('[aria-label="Search"]')).click();
        };

        /**
         * Create new item using desk template
         */
        this.createFromDeskTemplate = () => {
            el(['content-create']).click();
            el(['content-create-dropdown', 'default-desk-template']).click();
        };

        this.getGroup = function(group: number) {
            return this.getGroups().get(group);
        };

        this.getGroups = function() {
            const groups = element.all(by.repeater('group in aggregate.groups'));

            browser.sleep(3000); // due to debouncing, loading does not start immediately
            browser.wait(ECE.hasElementCount(els(['item-list--loading']), 0), 3000);

            return groups;
        };

        /**
         * Get Item from a group
         *
         * when using object for an item you can set type of an item and it will return first
         * item of that type from group
         *
         * @param {Number} group
         * @param {Number|Object|String} item
         * @return {WebElement}
         */
        this.getItem = function(group, item) {
            var all = this.getGroupItems(group);

            if (item.type) {
                return all.filter((elem) =>
                    elem.all(by.className('filetype-icon-' + item.type)).count()).get(item.index || 0);
            } else if (Number.isInteger(item)) {
                return all.get(item);
            } else { // use slugline filter
                return all.filter((elem) =>
                    elem.element(s(['field--slugline'])).isPresent(),
                ).filter((elem) =>
                    elem.element(s(['field--slugline'])).getText()
                        .then((text) => text.toLowerCase().includes(item.toLowerCase())),
                ).first();
            }
        };

        this.getGroupItems = function(group) {
            return this.getGroup(group).all(by.className('media-box'));
        };

        this.isGroupEmpty = function(group) {
            return this.getGroupItems(group).count().then((count) => count === 0);
        };

        this.actionOnDeskSingleView = function() {
            var elem = element.all(by.className('stage-header__name'));
            var header = elem.all(by.css('[ng-click="viewSingleGroup(group, \'desk\')"]')).first();

            header.click();
        };

        this.getDeskSingleViewTitle = function() {
            return element.all(by.css('[ng-if="monitoring.singleGroup.singleViewType === \'desk\'"]')).get(0)
                .getText()
                .then((text) => text.replace(/\n/g, ' '));
        };

        this.actionOnStageSingleView = function() {
            var elem = element.all(by.className('stage-header__name'));
            var subheader = elem.all(by.css('[ng-click="viewSingleGroup(group, \'stage\')"]')).first();

            subheader.click();
        };

        this.getStageSingleViewTitle = function() {
            return element(by.className('subnav__stage-group')).element(by.className('dropdown__toggle')).getText();
        };

        this.getSingleViewItemCount = function() {
            return element.all(by.className('media-box')).count();
        };

        this.actionMonitoringHome = function() {
            return element.all(by.css('[ng-click="monitoring.viewMonitoringHome()"]')).click();
        };

        this.getMonitoringHomeTitle = function() {
            return element(by.css('[ng-if="!monitoring.singleGroup && type === \'monitoring\'"]'))
                .element(by.className('dropdown__toggle')).getText();
        };

        this.getSpikedItems = function() {
            const wrapper = el(['articles-list']);

            browser.wait(ECE.visibilityOf(wrapper), 2000);

            browser.wait(ECE.stalenessOf(el(['loading'], null, wrapper)), 2000);

            const items = els(['article-item'], null, wrapper);

            return items;
        };

        this.getAllItems = function() {
            return element.all(by.className('media-box'));
        };

        this.getMonitoringWordCount = (itemId: string) => {
            /**
             * List view element might update between `browser.wait` and `getText` calls.
             * If `.getText` was called on `countElem`, it might fail due to `countElem`
             * referencing to an element that is no longer attached in the DOM(due to list view update).
             * Because of this, the element is re-queried using the same selector before calling `.getText`.
             */
            const getCountElement = () => element(by.id(itemId)).element(by.className('word-count'));

            const countElem = getCountElement();

            browser.wait(ECE.presenceOf(countElem), MONITORING_DEBOUNCE_MAX_WAIT);

            return getCountElement().getText().then((value) => value ? parseInt(value, 10) : 0);
        };

        this.expectWordCount = (itemId, expectedCount) => {
            browser.wait(() => this.getMonitoringWordCount(itemId)
                .then((count) => count === expectedCount), MONITORING_DEBOUNCE_MAX_WAIT);
        };

        /**
         * Get the personal element at 'index' row
         *
         * @param {number} index
         * @return {object}
         */
        this.getPersonalItem = function(index) {
            return this.getAllItems().get(index);
        };

        /**
         * Get the personal element text at 'index' row
         *
         * @param {number} index
         * @return {string}
         */
        this.getPersonalItemText = function(index) {
            browser.wait(ECE.visibilityOf(this.getPersonalItem(index)), MONITORING_DEBOUNCE_MAX_WAIT);
            return this.getPersonalItem(index).element(by.className('item-heading')).getText();
        };

        this.getSpikedItem = function(item) {
            return this.getSpikedItems().get(item);
        };

        this.getSpikedTextItem = function(index) {
            return this.getSpikedItem(index).element(by.className('item-heading')).getText();
        };

        this.getTextItem = function(group, item) {
            return this.getItem(group, item).element(by.className('item-heading')).getText();
        };

        this.getTextItemBySlugline = function(group, item) {
            const _element = this.getItem(group, item).element(s(['field--slugline']));

            browser.wait(ECE.visibilityOf(_element), 2000);

            return _element.getText();
        };

        this.searchAction = function(search) {
            element(by.model('query')).sendKeys(search);
            browser.actions().sendKeys(protractor.Key.ENTER).perform();
        };

        /**
         * Perform filter by filterType that can be
         * all, audio, video, text, picture, composite and highlightsPackage
         *
         * @param {string} fileType
         */
        this.filterAction = function(fileType) {
            const elem = fileType === 'all'
                ? element(by.className('toggle-button__text--all'))
                : element(by.className('filetype-icon-' + fileType));

            browser.wait(ECE.visibilityOf(elem), 2000);
            elem.click();
        };

        this.compactActionDropdown = function() {
            return element(by.className('dropdown--compact-state'));
        };

        this.previewAction = function(groupIndex, itemIndex) {
            const item = this.getItem(groupIndex, itemIndex);

            browser.wait(ECE.elementToBeClickable(item), 2000);
            item.click();
            var preview = element(by.id('item-preview'));

            waitFor(preview, 5000);
        };

        this.closePreview = function() {
            element(by.className('close-preview')).click();
        };

        this.getPreviewTitle = function() {
            var headline = element(by.css('.content-container')).element(by.css('.preview-headline'));

            browser.wait(ECE.visibilityOf(headline), 1000);

            return headline.getText();
        };

        this.getPreviewBody = () => element(by.id('item-preview')).element(by.className('body-text'));

        this.setOrder = function(field, switchDir) {
            element(by.id('order_button')).click();
            element(by.id('order_selector')).element(by.partialLinkText(field)).click();
            if (switchDir !== undefined && switchDir) {
                element(by.css('[ng-click="toggleDir()"]')).click();
            }
        };

        this.openAction = function(group, item) {
            browser.actions().doubleClick(
                this.getItem(group, item),
            ).perform();
        };

        this.tabAction = function(tab) {
            const btn = element(by.css('[ng-click="vm.current_tab = \'' + tab + '\'"]'));

            browser.wait(ECE.elementToBeClickable(btn), 2000);

            btn.click();
        };

        this.openRelatedItem = function(index) {
            const relatedItemsContainer = el(['related-items-view']);

            browser.wait(ECE.visibilityOf(relatedItemsContainer), 2000);
            els(['article-item'], null, relatedItemsContainer).get(index).click();
            browser.wait(ECE.presenceOf(el(['authoring'])), 2000);
        };

        /**
         * Perform the 'action' operation on the
         * 'item' element from 'group'
         *
         * @param {string} action
         * @param {number} group
         * @param {number} item
         * @param {boolean} useFullButtonText
         * @param {boolean} confirm Accept confirmation dialog.
         */
        this.actionOnItem = function(action, group, item, useFullButtonText, confirm) {
            var menu = this.openItemMenu(group, item);

            browser.wait(() => menu.isPresent(), 3000);

            if (useFullButtonText) {
                menu.element(by.buttonText(action)).click();
            } else {
                menu.all(by.partialButtonText(action)).first().click();
            }

            if (confirm) {
                acceptConfirm();
            }
        };

        this.editItem = (group, item) => {
            this.actionOnItem('Edit', group, item);
            browser.sleep(2000); // wait for authoring to be loaded
        };

        this.getMenuActionElement = function(action, group, item) {
            var menu = this.openItemMenu(group, item);

            return menu.all(by.partialButtonText(action)).first();
        };

        /**
         * Perform 'submenu' operation on the 'action' menu from
         * 'item' element from 'group'
         *
         * @param {string} action
         * @param {string} submenu
         * @param {number} group
         * @param {number} item
         */
        this.actionOnItemSubmenu = function(action, submenu, group, item) {
            var menu = this.openItemMenu(group, item);
            var header = menu.element(by.partialButtonText(action));
            var btn = menu.all(by.partialButtonText(submenu)).first();

            browser.actions()
                .mouseMove(header, {x: -50, y: -50})
                .mouseMove(header)
                .perform();
            waitFor(btn, 1000);
            btn.click();
        };

        this.selectItem = function(group, item) {
            return this.selectGivenItem(this.getItem(group, item));
        };

        this.selectSpikedItem = function(item) {
            return this.selectGivenItem(this.getSpikedItem(item));
        };

        this.selectGivenItem = function(item) {
            var itemTypeAndMultiSelect = el(['item-type-and-multi-select'], null, item);

            scrollToView(itemTypeAndMultiSelect);

            browser.actions()
                .mouseMove(itemTypeAndMultiSelect, {x: -100, y: -100})
                .mouseMove(itemTypeAndMultiSelect)
                .perform();

            var checkbox = el(['multi-select-checkbox'], null, item);

            browser.wait(ECE.visibilityOf(checkbox), 1000);

            return checkbox.click();
        };

        this.spikeMultipleItems = function() {
            multiAction('Spike');
            acceptConfirm();
        };

        this.unspikeMultipleItems = function() {
            multiAction('Unspike');
            el(['interactive-actions-panel', 'unspike']).click();
        };

        this.unspikeItem = function(item, stage?: string) {
            articleList.executeContextMenuAction(this.getSpikedItem(item), 'Unspike Item');

            if (stage) {
                el(
                    ['interactive-actions-panel', 'stage-select'],
                    by.cssContainingText('[data-test-id="item"]', stage),
                ).click();
            }

            el(['interactive-actions-panel', 'unspike']).click();
        };

        this.openItemMenu = function(group, item) {
            var itemElem = this.getItem(group, item);

            scrollToView(itemElem);
            hover(itemElem);

            el(['context-menu-button'], null, itemElem).click();

            return el(['context-menu']);
        };

        this.showMonitoringSettings = function() {
            el(['monitoring-settings-button']).click();
            browser.wait(() => element.all(by.css('.aggregate-widget-config')).isDisplayed(), 2000);
            element.all(by.css('[ng-click="goTo(step)"]')).first().click();
        };

        /**
         * Set the label for the current monitoring view widget
         *
         * @param {string} label
         */
        this.setLabel = function(label) {
            this.label.clear();
            this.label.sendKeys(label);
        };

        this.nextStages = function() {
            element(by.id('nextBtn')).click();
            browser.sleep(500);
        };

        this.nextSearches = function() {
            element(by.id('nextBtn')).click();
            browser.sleep(500);
        };

        this.previousSearches = function() {
            element(by.id('previousBtn')).click();
            browser.sleep(500);
        };

        this.nextReorder = function() {
            element(by.id('nextBtn')).click();
            browser.sleep(500);
        };

        this.previousReorder = function() {
            element(by.id('previousBtn')).click();
            browser.sleep(500);
        };

        this.previousMax = function() {
            element(by.id('previousBtn')).click();
            browser.sleep(500);
        };

        this.cancelSettings = function() {
            element(by.css('[ng-click="cancel()"]')).click();
        };

        this.saveSettings = function() {
            var btn = element(by.css('[ng-click="save()"]'));

            btn.click();

            // wait for modal to be removed
            browser.wait(ECE.invisibilityOf(el(['desk--monitoring-settings'])), 2000);
        };

        /**
         * Get the desk at the 'index' row
         *
         *  @param {index} index
         *  @return {promise}
         */
        this.getDesk = function(index) {
            return this.config.all(by.repeater('desk in desks')).get(index);
        };

        this.getStage = function(desk, stage) {
            return this.getDesk(desk).all(by.repeater('stage in deskStages[desk._id]')).get(stage);
        };

        /**
         * Get the search at the 'index' row
         *
         *  @param {index} index
         *  @return {promise}
         */
        this.getGlobalSearch = function(index) {
            return this.config.all(by.repeater('search in globalSavedSearches')).get(index);
        };

        this.getPrivateSearch = function(index) {
            return this.config.all(by.repeater('search in privateSavedSearches')).get(index);
        };

        this.getGlobalSearchText = function(search) {
            return this.getGlobalSearch(search).element(by.css('.desk-title')).getText();
        };

        this.getPrivateSearchText = function(search) {
            return this.getPrivateSearch(search).element(by.css('.desk-title')).getText();
        };

        this.toggleDesk = function(desk) {
            this.getDesk(desk).element(by.model('editGroups[desk._id].selected')).click();
        };

        this.toggleStage = function(desk, stage) {
            this.getStage(desk, stage).element(by.css('[ng-click="setStageInfo(stage._id)"]')).click();
        };

        this.toggleDeskOutput = function(desk) {
            this.getDesk(desk).all(by.model('editGroups[desk._id + output.id].selected')).get(1).click();
        };

        this.toggleScheduledDeskOutput = function(desk) {
            this.getDesk(desk).all(by.model('editGroups[desk._id + output.id].selected')).get(0).click();
        };

        this.togglePersonal = function() {
            element(by.css('[ng-click="setPersonalInfo()"]')).click();
        };

        this.toggleGlobalSearch = function(search) {
            this.getGlobalSearch(search).element(by.css('[ng-click="setSearchInfo(search._id)"]')).click();
        };

        this.togglePrivateSearch = function(search) {
            this.getPrivateSearch(search).element(by.css('[ng-click="setSearchInfo(search._id)"]')).click();
        };

        this.toggleAllSearches = function() {
            element(by.css('[ng-click="initSavedSearches(showAllSavedSearches)"]')).click();
        };

        this.toggleGlobalSearches = function() {
            element(by.model('showGlobalSavedSearches')).click();
        };

        this.getOrderItem = function(item) {
            return element.all(by.repeater('item in getValues()')).get(item);
        };

        this.getOrderItemText = function(item) {
            return this.getOrderItem(item).element(by.css('.group-title')).getText();
        };

        this.moveOrderItem = function(start, end) {
            var src = this.getOrderItem(start);
            var dst = this.getOrderItem(end);

            return src.waitReady().then(() => {
                browser.actions()
                    .mouseMove(src)
                    .mouseDown()
                    .perform()
                    .then(() => {
                        dst.waitReady().then(() => {
                            browser.actions()
                                .mouseMove(dst)
                                .mouseUp()
                                .perform();
                        });
                    });
            });
        };

        this.getMaxItem = function(item) {
            return element.all(by.repeater('max in getValues()')).get(item);
        };

        this.setMaxItems = function(item, value) {
            var maxItemsInput = this.getMaxItem(item).element(by.id('maxItems'));

            maxItemsInput.clear();
            maxItemsInput.sendKeys(value);
        };

        this.hasClass = function(_element, cls) {
            return _element.getAttribute('class').then((classes) => classes.split(' ').indexOf(cls) !== -1);
        };

        this.showHideList = function() {
            element(by.css('[href="#/workspace/monitoring"]')).click();
        };

        this.openCreateMenu = function() {
            element(by.css('[data-test-id="content-create"]')).click();
            browser.sleep(100);
        };

        this.openSendMenu = function() {
            browser.sleep(500);
            multiAction('Send to');
            browser.sleep(100);
        };

        this.publish = function() {
            element(by.css('[ng-click="_publish()"]')).click();
        };

        this.getPublishButtonText = () => element(by.css('[ng-click="publish()"]')).getText();

        this.uploadModal = element(by.className('upload-media'));

        this.openFetchAsOptions = function(group, item) {
            this.actionOnItem('Fetch To', group, item);
        };

        this.clickOnFetchButton = function() {
            el(['interactive-actions-panel', 'fetch']).click();
        };

        // Cancel button resets the multi selection
        this.clickOnCancelButton = function() {
            return element(by.css('[ng-click="multi.reset()"]')).click();
        };

        this.getMultiSelectCount = function() {
            return element(by.id('multi-select-count')).getText();
        };

        this.fetchAs = function(group, item) {
            this.openFetchAsOptions(group, item);
            return this.clickOnFetchButton();
        };

        this.fetchAndOpen = function(group, item) {
            this.actionOnItem('Fetch To', group, item);
            el(['interactive-actions-panel', 'fetch-and-open']).click();
        };

        /**
         * Create a package and include selected items
         */
        this.createPackageFromItems = function() {
            multiAction('Create Package');
        };

        /**
         * Check if on monitoring view an item from group is marked for highlight
         * @param {string} highlight
         * @param {number} group
         * @param {number} item
         */
        this.checkMarkedForHighlight = function(highlight, group, item) {
            const crtItem = this.getItem(group, item);
            const highlightsPreviewTriggerButton = crtItem.element(by.className('highlights-box'))
                .element(by.className('dropdown__toggle'));

            // first click doesn't do it, not sure why
            click(highlightsPreviewTriggerButton);
            click(highlightsPreviewTriggerButton, 'Can\'t click on highlights button');

            const highlightList = el(['highlights-list']);

            browser.wait(EC.visibilityOf(highlightList), 2000, 'Highlights popup is not visible');

            expect(highlightList.getText()).toContain(highlight);

            this.closeHighlightsPopup();
        };

        /**
         * Close mark for highlights popup
         */
        this.closeHighlightsPopup = () => {
            const closeBtn = element(by.className('highlights-list-menu')).element(by.className('icon-close-small'));

            click(closeBtn, 'Can\'t click on close in highlights popup');
        };

        /**
         * Check if on monitoring view an item from group is marked for desk
         * @param {string} desk
         * @param {number} group
         * @param {number} item
         */
        this.checkMarkedForDesk = function(desk, group, item) {
            var crtItem = this.getItem(group, item);

            const bellIcon = crtItem.element(by.className('icon-bell'));

            browser.wait(ECE.visibilityOf(bellIcon), 2000);

            bellIcon.click();
            var deskList = element(by.className('highlights-list-menu'));

            waitFor(deskList);
            expect(deskList.getText()).toContain(desk);
        };

        /**
         * Close marked for desk popup
         */
        this.closeMarkedForDeskPopup = () => {
            element(by.className('highlights-list-menu'))
                .element(by.className('icon-close-small'))
                .click();
        };

        /**
         * Remove from the first highlight in the list
         * @param {number} group
         * @param {number} item
         */
        this.removeFromFirstHighlight = function(group, item) {
            var crtItem = this.getItem(group, item);

            crtItem.element(by.className('icon-multi-star')).click();
            var highlightList = element(by.className('highlights-list-menu'));

            waitFor(highlightList);
            highlightList.all(by.className('btn--small')).first().click();
        };

        /**
         * Remove from the first desk in the list
         * @param {number} group
         * @param {number} item
         */
        this.removeFromFirstDesk = function(group, item) {
            var crtItem = this.getItem(group, item);

            crtItem.element(by.className('icon-bell')).click();
            var deskList = element(by.className('highlights-list-menu'));

            waitFor(deskList);
            deskList.all(by.className('btn--small')).first().click();
        };

        /**
         * Open a workspace of given name, can be both desk or custom
         *
         * @param {string} desk Desk or workspace name.
         */
        this.selectDesk = function(desk) {
            var dropdownBtn = el(['monitoring--selected-desk']),
                dropdownMenu = element(by.id('select-desk-menu'));

            // open dropdown
            dropdownBtn.click();

            function textFilter(elem) {
                return elem.element(by.tagName('button')).getText()
                    .then((text) => text.toUpperCase().indexOf(desk.toUpperCase()) >= 0);
            }

            function clickFiltered(filtered) {
                if (filtered.length) {
                    return filtered[0].click();
                }
            }

            // try to open desk
            dropdownMenu.all(by.repeater('desk in desks'))
                .filter(textFilter)
                .then(clickFiltered);

            // then try to open custom workspace
            dropdownMenu.all(by.repeater('workspace in wsList'))
                .filter(textFilter)
                .then(clickFiltered);

            // close dropdown if opened
            dropdownMenu.isDisplayed().then((shouldClose) => {
                if (shouldClose) {
                    dropdownBtn.click();
                }
            });
        };

        /**
         * Open a workspace of given name, can be both desk or custom and then navigate
         * to content view
         *
         * @param {string} desk Desk or workspace name.
         * @return {Promise}
         */
        this.switchToDesk = function(desk) {
            this.selectDesk(desk);

            this.openMonitoring();

            return browser.wait(() => element(by.className('list-view')).isPresent(), 500);
        };

        this.turnOffWorkingStage = function(deskIndex, canCloseSettingsModal) {
            this.showMonitoringSettings();
            this.toggleStage(deskIndex, 0);

            if (typeof canCloseSettingsModal !== 'boolean') {
                this.nextStages();
                this.nextSearches();
                this.nextReorder();
                this.saveSettings();
            }
        };

        this.expectIsChecked = function(group, item) {
            return expect(
                el(['multi-select-checkbox'], null, this.getItem(group, item))
                    .getAttribute('aria-checked'),
            ).toBe('true');
        };

        this.expectIsNotChecked = function(group, item) {
            const checkboxEl = el(['multi-select-checkbox'], null, this.getItem(group, item));

            return checkboxEl.isPresent().then((present) => {
                if (present) {
                    expect(checkboxEl.getAttribute('aria-checked')).toBe('false');
                } else {
                    expect(present).toBe(false);
                }
            });
        };

        this.turnOffDeskWorkingStage = function(deskIndex, canCloseSettingsModal) {
            this.toggleStage(deskIndex, 0);
            if (typeof canCloseSettingsModal !== 'boolean') {
                this.nextStages();
                this.nextSearches();
                this.nextReorder();
                this.saveSettings();
            }
        };

        this.openSearchBox = function() {
            element.all(by.css('[ng-click="aggregate.monitoringSearch = !aggregate.monitoringSearch"]')).click();
        };

        this.searchInput = element(by.id('search-input'));

        this.getCorrectionItems = function(group) {
            return this.getGroupItems(5).all(by.css('[title="correction sequence"]'));
        };

        this.getTakeItems = function(group) {
            return this.getGroupItems(group).all(by.className('takekey'));
        };

        this.getPackageItem = function(index) {
            var elemIndex = index ? index : 0;

            return element.all(by.className('package-item__item-text-group')).get(elemIndex);
        };

        this.getPackageItemActionDropdown = function(index) {
            var elemIndex = index ? index : 0;

            return element.all(by.className('more-activity-toggle')).get(elemIndex);
        };

        this.getPackageItemLabelEntry = function() {
            return element(by.partialLinkText('Set label in current package'));
        };

        this.getPackageItemLabelOption = function(index) {
            return element.all(by.repeater('label in labels')).get(index);
        };

        this.getPackageItemLabel = function(index) {
            return element.all(by.id('package-item-label')).get(index);
        };

        this.createItem = (buttonText: string) => {
            const plusButton = el(['content-create']);
            const itemButton = el(['content-create-dropdown']).element(by.buttonText(buttonText));

            browser.wait(ECE.elementToBeClickable(plusButton), 1000);
            plusButton.click();

            browser.wait(ECE.elementToBeClickable(itemButton), 1000);
            itemButton.click();
        };
    }
}

export const monitoring = new Monitoring();
