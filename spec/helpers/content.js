/* eslint-disable newline-per-chained-call */


var nav = require('./utils').nav;
var clickConfirm = require('./utils').clickConfirm;

module.exports = new Content();

function Content() {
    this.send = send;

    this.setListView = function(noNavigate) {
        if (noNavigate === undefined || !noNavigate) {
            nav('workspace/content');
        }

        var list = element(by.css('i.icon-th-list'));

        return list.isDisplayed()
            .then((isVisible) => {
                if (isVisible) {
                    list.click();
                }
            });
    };

    this.setGridView = function() {
        var grid = element(by.css('[tooltip="switch to grid view"]'));

        return grid.then((isVisible) => {
            if (isVisible) {
                grid.click();
            }
        });
    };

    this.getItems = function() {
        return element.all(by.className('media-box'));
    };

    this.getItem = function(item) {
        return this.getItems().filter(testHeadline).first();

        function testHeadline(elem, index) {
            if (typeof item === 'number') {
                // BC: get item by its index
                return index === item;
            }

            return elem.element(by.className('item-heading')).getText()
                .then((text) => text.toLowerCase().indexOf(item) >= 0);
        }
    };

    this.actionOnItem = function(action, item, useFullLinkText, confirm) {
        var menu = this.openItemMenu(item);

        if (useFullLinkText) {
            menu.element(by.linkText(action)).click();
        }

        menu.all(by.partialLinkText(action)).first().click();

        if (confirm) {
            clickConfirm();
        }
    };

    this.editItem = function(item) {
        return this.actionOnItem('Edit', item);
    };

    function waitFor(elem, time) {
        return browser.wait(() => elem.isDisplayed(), time || 800);
    }

    this.openItemMenu = function(item) {
        this.getItem(item).click();

        var preview = element(by.id('item-preview'));

        waitFor(preview);

        var toggle = preview.element(by.className('icon-dots-vertical'));

        waitFor(toggle);

        toggle.click();

        var menu = element(by.css('.dropdown__menu.open'));

        waitFor(menu);
        return menu;
    };

    this.previewItem = function(item) {
        this.getItem(item).click();

        var preview = element(by.id('item-preview'));

        waitFor(preview);
    };

    this.closePreview = function() {
        element(by.className('close-preview')).click();
    };

    this.checkMarkedForHighlight = function(highlight, item) {
        var crtItem = this.getItem(item);

        expect(crtItem.element(by.className('icon-star')).isDisplayed()).toBeTruthy();
        expect(crtItem.element(by.className('icon-star')).getAttribute('tooltip-html-unsafe'))
            .toContain(highlight);
    };

    var list = element(by.className('list-view'));

    this.getCount = function() {
        waitFor(list);
        return list.all(by.css('.media-box')).count();
    };

    this.getItemCount = function() {
        waitFor(list);
        return list.all(by.css('.media-box')).count();
    };

    /**
     * @alias this.getCount
     */
    this.count = this.getCount;

    this.selectItem = function(item) {
        var crtItem = this.getItem(item);
        var typeIcon = crtItem.element(by.className('type-icon'));

        expect(typeIcon.isDisplayed()).toBe(true);
        browser.actions()
            .mouseMove(typeIcon)
            .mouseMove(crtItem)
            .mouseMove(typeIcon)
            .perform();
        return typeIcon.element(by.className('selectbox')).click();
    };

    this.spikeItems = function() {
        element(by.css('[ng-click="action.spikeItems()"]')).click();
        clickConfirm();
    };

    this.unspikeItems = function() {
        element(by.css('[ng-click="action.unspikeItems()"]')).click();
        element(by.partialButtonText('send')).click();
    };

    this.selectSpikedList = function() {
        nav('workspace/spike-monitoring');
    };

    this.createPackageFromItems = function() {
        var elem = element(by.css('[class="multi-action-bar ng-scope"]'));

        elem.element(by.className('big-icon--create-package')).click();
        browser.sleep(500);
    };

    this.getWidgets = function() {
        return element(by.className('navigation-tabs')).all(by.repeater('widget in widgets'));
    };

    this.getItemType = function(itemType) {
        var itemTypeClass = 'filetype-icon-' + itemType;

        return element(by.className('authoring-header__general-info')).all(by.className(itemTypeClass)).first();
    };

    function send() {
        return element(by.css('[ng-click="send()"]')).click();
    }
}
