/* eslint-disable newline-per-chained-call */


var openUrl = require('./utils').open,
    nav = require('./utils').nav,
    waitFor = require('./utils').wait;

module.exports = new Monitoring();

function Monitoring() {
    this.config = element(by.className('aggregate-settings'));
    this.label = element(by.model('widget.configuration.label'));

    this.openMonitoring = function(useNav) {
        if (useNav) {
            return nav('/workspace/monitoring');
        }
        return openUrl('/#/workspace/monitoring');
    };

    this.showMonitoring = function() {
        element(by.className('big-icon-view')).click();
    };

    this.showSpiked = function() {
        element(by.className('big-icon-spiked')).click();
    };

    /**
     * Open personal monitoring view
     */
    this.showPersonal = function() {
        element(by.className('big-icon-personal')).click();
    };

    /**
     * Open global search view
     */
    this.showSearch = function() {
        element(by.className('big-icon-global-search')).click();
    };

    /**
     * On monitoring view create a new item
     *
     * @param {string} action - the create item action can be: create_text_article,
     * create_preformatted_article and create_package
     */
    this.createItemAction = function(action) {
        element(by.className('icon-plus-large')).click();
        element(by.id(action)).click();
        browser.sleep(500);
    };

    this.getGroup = function(group) {
        return this.getGroups().get(group);
    };

    this.getGroups = function() {
        return element.all(by.repeater('group in aggregate.groups'));
    };

    /**
     * Get Item from a group
     *
     * when using object for an item you can set type of an item and it will return first
     * item of that type from group
     *
     * @param {Number} group
     * @param {Number|Object} item
     * @return {WebElement}
     */
    this.getItem = function(group, item) {
        var all = this.getGroupItems(group);

        browser.wait(() => all.count(), 7500);

        if (item.type) {
            return all.filter((elem) =>
                elem.all(by.className('filetype-icon-' + item.type)).count()).get(item.index || 0);
        }

        return all.get(item);
    };

    this.getGroupItems = function(group) {
        return this.getGroup(group).all(by.className('media-box'));
    };

    this.actionOnDeskSingleView = function() {
        var elem = element.all(by.className('stage-header__name'));
        var header = elem.all(by.css('[ng-click="viewSingleGroup(group, \'desk\')"]')).first();

        header.click();
    };

    this.getDeskSingleViewTitle = function() {
        return element.all(by.css('[ng-if="monitoring.singleGroup.singleViewType === \'desk\'"]')).get(0).getText();
    };

    this.actionOnStageSingleView = function() {
        var elem = element.all(by.className('stage-header__name'));
        var subheader = elem.all(by.css('[ng-click="viewSingleGroup(group, \'stage\')"]')).first();

        subheader.click();
    };

    this.getStageSingleViewTitle = function() {
        return element.all(by.css('[ng-if="monitoring.singleGroup.singleViewType === \'stage\'"]')).get(0).getText();
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
        return this.getAllItems();
    };

    this.getAllItems = function() {
        return element.all(by.className('media-box'));
    };

    this.getMonitoringWordCount = (itemId) => element(by.id(itemId)).all(by.className('word-count')).first().getText();

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
        return this.getItem(group, item).element(by.className('keyword')).getText();
    };

    this.searchAction = function(search) {
        element(by.css('.flat-searchbar')).click();
        element(by.model('query')).sendKeys(search);
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
    };

    /**
     * Perform filter by filterType that can be
     * all, audio, video, text, picture, composite, takesPackage and highlightsPackage
     *
     * @param {string} fileType
     */
    this.filterAction = function(fileType) {
        if (fileType === 'highlightsPackage') {
            element(by.className('filetype-icon-highlight-pack')).click();
        } else if (fileType === 'takesPackage') {
            element(by.className('filetype-icon-takes-pack')).click();
        } else if (fileType === 'all') {
            element(by.className('toggle-button__text--all')).click();
        } else {
            element(by.className('filetype-icon-' + fileType)).click();
        }
    };

    this.previewAction = function(group, item) {
        this.getItem(group, item).click();
        var preview = element(by.id('item-preview'));

        waitFor(preview);
    };

    this.closePreview = function() {
        element(by.className('close-preview')).click();
    };

    this.getPreviewTitle = function() {
        var headline = element(by.css('.content-container')).element(by.css('.preview-headline'));

        return headline.getText();
    };

    this.setOrder = function(field, switchDir) {
        element(by.id('order_button')).click();
        element(by.id('order_selector')).element(by.partialLinkText(field)).click();
        if (switchDir !== undefined && switchDir) {
            element(by.css('[ng-click="toggleDir()"]')).click();
        }
    };

    this.openAction = function(group, item) {
        browser.actions().doubleClick(
            this.getItem(group, item)
        ).perform();
    };

    this.tabAction = function(tab) {
        element.all(by.css('[ng-click="vm.current_tab = \'' + tab + '\'"]')).click();
    };

    this.openRelatedItem = function(index) {
        var relatedItem = element.all(by.repeater('relatedItem in relatedItems._items')).get(index);

        relatedItem.all(by.className('related-item')).get(index).click();
    };

    /**
     * Perform the 'action' operation on the
     * 'item' element from 'group'
     *
     * @param {string} action
     * @param {number} group
     * @param {number} item
     */
    this.actionOnItem = function(action, group, item, useFullLinkText) {
        var menu = this.openItemMenu(group, item);

        if (useFullLinkText) {
            menu.element(by.linkText(action)).click();
            return;
        }

        menu.element(by.partialLinkText(action)).click();
    };

    this.getMenuActionElement = function(action, group, item) {
        var menu = this.openItemMenu(group, item);

        return menu.element(by.partialLinkText(action));
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
        var header = menu.element(by.partialLinkText(action));
        var btn = menu.element(by.partialButtonText(submenu));

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
        var itemTypeIcon = item.element(by.css('.type-icon'));

        browser.actions().mouseMove(itemTypeIcon, {x: -100, y: -100}).mouseMove(itemTypeIcon).perform();
        var checkbox = item.element(by.className('sd-checkbox'));

        waitFor(checkbox, 500);
        return checkbox.click();
    };

    this.spikeMultipleItems = function() {
        return element(by.css('[ng-click="action.spikeItems()"]')).click();
    };

    this.unspikeMultipleItems = function() {
        element(by.css('[ng-click="action.unspikeItems()"]')).click();
        return element(by.partialButtonText('send')).click();
    };

    this.unspikeItem = function(item, desk, stage) {
        var itemElem = this.getSpikedItem(item);

        browser.actions().mouseMove(itemElem).perform();
        itemElem.element(by.className('icon-dots-vertical')).click();

        var menu = element(by.css('.dropdown__menu.open'));

        menu.element(by.partialLinkText('Unspike')).click();

        var sidebar = element.all(by.css('.slide-pane')).last();

        if (stage) {
            sidebar.element(by.buttonText(stage)).click();
        }

        return element(by.partialButtonText('send')).click();
    };

    this.openItemMenu = function(group, item) {
        var itemElem = this.getItem(group, item);

        browser.actions()
            .mouseMove(itemElem, {x: -50, y: -50}) // first move out
            .mouseMove(itemElem) // now it can mouseover for sure
            .perform();
        var dotsElem = itemElem.element(by.className('icon-dots-vertical'));

        waitFor(dotsElem, 1000);
        dotsElem.click();
        return element(by.css('.dropdown__menu.open'));
    };

    this.showMonitoringSettings = function() {
        element(by.css('.icon-settings')).click();
        browser.wait(() => element.all(by.css('.aggregate-widget-config')).isDisplayed());
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
        browser.wait(() => btn.isPresent().then((isPresent) => !isPresent), 600);
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
        this.getDesk(desk).element(by.model('editGroups[desk._id + \':output\'].selected')).click();
    };

    this.toggleScheduledDeskOutput = function(desk) {
        this.getDesk(desk).element(by.model('editGroups[desk._id + \':scheduled\'].selected')).click();
    };

    this.togglePersonal = function() {
        element(by.css('[ng-click="setPersonalInfo()"]')).click();
    };

    this.switchGlobalSearchOn = function() {
        element(by.model('showGlobalSavedSearches')).click();
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

    this.hasClass = function(element, cls) {
        return element.getAttribute('class').then((classes) => classes.split(' ').indexOf(cls) !== -1);
    };

    this.showHideList = function() {
        element(by.css('[href="#/workspace/monitoring"]')).click();
    };

    this.openCreateMenu = function() {
        element(by.className('sd-create-btn')).click();
        browser.sleep(100);
    };

    this.openSendMenu = function() {
        browser.sleep(500);
        element(by.className('svg-icon-sendto')).click();
        browser.sleep(100);
    };

    this.publish = function() {
        element(by.css('[ng-click="_publish()"]')).click();
    };

    this.getPublishButtonText = () => element(by.css('[ng-click="publish()"]')).getText();

    this.startUpload = function() {
        element(by.id('start-upload-btn')).click();
    };

    this.uploadModal = element(by.className('upload-media'));

    this.openFetchAsOptions = function(group, item) {
        this.actionOnItem('Fetch To', group, item);
    };

    this.clickOnFetchButton = function() {
        return element(by.css('[ng-click="send()"]')).click();
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
        return element(by.css('[ng-click="send(true)"]')).click();
    };

    /**
     * Create a package and include selected items
     */
    this.createPackageFromItems = function() {
        element(by.css('[ng-click="action.createPackage()"]')).click();
    };

    this.addToCurrentMultipleItems = function() {
        var elem = element(by.className('multi-action-bar'));

        elem.element(by.css('[ng-click="action.addToPackage()"]')).click();
    };

    /**
     * Check if on monitoring view an item from group is marked for highlight
     * @param {string} highlight
     * @param {number} group
     * @param {number} item
     */
    this.checkMarkedForHighlight = function(highlight, group, item) {
        var crtItem = this.getItem(group, item);

        crtItem.element(by.className('icon-star')).click();
        var highlightList = element(by.className('highlights-list-menu'));

        waitFor(highlightList);
        expect(highlightList.getText()).toContain(highlight);
    };

    /**
     * Check if on monitoring view an item from group is marked for desk
     * @param {string} desk
     * @param {number} group
     * @param {number} item
     */
    this.checkMarkedForDesk = function(desk, group, item) {
        var crtItem = this.getItem(group, item);

        crtItem.element(by.className('icon-bell')).click();
        var deskList = element(by.className('highlights-list-menu'));

        waitFor(deskList);
        expect(deskList.getText()).toContain(desk);
    };


    /**
     * Check if on monitoring view an item from group is marked for highlight
     * @param {string} highlight
     * @param {number} group
     * @param {number} item
     */
    this.checkMarkedForMultiHighlight = function(highlight, group, item) {
        var crtItem = this.getItem(group, item);
        var star = crtItem.element(by.className('icon-multi-star'));

        expect(star.isPresent()).toBe(true);
        star.click();
        var highlightList = element(by.className('highlights-list-menu'));

        waitFor(highlightList);
        expect(highlightList.getText()).toContain(highlight);
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
        highlightList.all(by.className('btn--mini')).first().click();
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
        deskList.all(by.className('btn--mini')).first().click();
    };


    /**
     * Open a workspace of given name, can be both desk or custom
     *
     * @param {string} desk Desk or workspace name.
     */
    this.selectDesk = function(desk) {
        var dropdownBtn = element(by.id('selected-desk')),
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
        return expect(this.getItem(group, item).element(by.className('sd-checkbox')).getAttribute('class'))
            .toContain('checked');
    };

    this.expectIsNotChecked = function(group, item) {
        return expect(this.getItem(group, item).element(by.className('sd-checkbox')).isPresent()).toBeFalsy();
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

    /**
     * Returns the desk dropdown in send to panel
     *
     */
    this.getSendToDropdown = () => {
        var sidebar = element.all(by.css('.slide-pane')).last(),
            dropdown = sidebar.element(by.css('.dropdown--dark .dropdown__toggle')),
            dropdownSelected = dropdown.element(by.css('[ng-show="selectedDesk"]'));

        return dropdownSelected;
    };
}
