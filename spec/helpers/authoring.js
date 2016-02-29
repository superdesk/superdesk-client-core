
'use strict';

module.exports = new Authoring();

function Authoring() {

    this.lock = element(by.css('[ng-click="lock()"]'));
    this.publish_button = element(by.buttonText('publish'));
    this.correct_button = element(by.buttonText('correct'));
    this.kill_button = element(by.buttonText('kill'));
    this.close_button = element(by.buttonText('CLOSE'));
    this.ignore_button = element(by.buttonText('Ignore'));
    this.save_publish_button = element(by.buttonText('Save and publish'));
    this.save_button = element(by.buttonText('SAVE'));
    this.edit_button = element(by.id('Edit'));
    this.edit_correct_button = element(by.buttonText('Edit and Correct'));
    this.edit_kill_button = element(by.buttonText('Edit and Kill'));

    this.navbarMenuBtn = element(by.css('.dropdown-toggle.sd-create-btn'));
    this.newPlainArticleLink = element(by.id('create_text_article'));
    this.newEmptyPackageLink = element(by.id('create_package'));
    this.infoIconsBox = element(by.css('.info-icons'));

    this.sendToButton = element(by.id('send-to-btn'));
    this.sendAndContinueBtn = element(by.buttonText('send and continue'));
    this.sendBtn = element(by.buttonText('send'));

    this.multieditOption = element(by.css('.big-icon-multiedit'));
    this.multieditButton = element(by.id('multiedit'));

    this.setCategoryBtn = element(by.id('category-setting'))
        .element(by.tagName('button'));

    this.getCategoryListItems = element(by.id('category-setting'))
        .all(by.repeater('term in activeTree'));

    this.sendItemContainer = element(by.id('send-item-container'));
    this.linkToMasterButton = element(by.id('preview-master'));

    /**
     * Find all file type icons in the item's info icons box matching the
     * given file type.
     *
     * @param {string} itemType - the item type of interest, e.g. 'text',
     *   'composite', 'picture', etc.
     * @return {Object} a promise that is resolved with all DOM elements found
     */
    this.findItemTypeIcons = function (itemType) {
        var selector = '.filetype-icon-' + itemType;
        return this.infoIconsBox.all(by.css(selector));
    };

    /**
     * Send item to given desk
     *
     * @param {string} desk Desk name
     * @param {string} stage Stage name
     */
    this.sendTo = function(desk, stage) {
        this.sendToButton.click();
        this.sendToSidebarOpened(desk, stage);
    };

    this.confirmSendTo = function() {
        if (element(by.className('modal-content')).length) {
            element(by.className('modal-content')).all(by.css('[ng-click="ok()"]')).click();
        }
    };

    this.sendToSidebarOpened = function(desk, stage) {
        var sidebar = element.all(by.css('.slide-pane')).last(),
            dropdown = sidebar.element(by.css('.dropdown--dark .dropdown-toggle'));

        dropdown.waitReady();
        dropdown.click();
        sidebar.element(by.buttonText(desk)).click();
        if (stage !== undefined) {
            sidebar.element(by.buttonText(stage)).click();
        }
        this.sendBtn.click();
    };

    this.selectDeskforSendTo = function(desk) {
        var sidebar = element.all(by.css('.slide-pane')).last(),
            dropdown = sidebar.element(by.css('.dropdown--dark .dropdown-toggle'));

        dropdown.waitReady();
        dropdown.click();
        sidebar.element(by.buttonText(desk)).click();
    };

    this.markAction = function() {
        return element(by.className('svg-icon-add-to-list')).click();
    };

    this.createTextItem = function() {
        return element(by.css('[class="dropdown-toggle sd-create-btn"]')).click().then(function() {
            return element(by.id('create_text_article')).click();
        });
    };

    this.close = function() {
        return this.close_button.click();
    };

    this.ignore = function() {
        return this.ignore_button.click();
    };

    this.savePublish = function() {
        return this.save_publish_button.click();
    };

    this.publish = function(skipConfirm) {
        browser.wait(function() {
            return this.sendToButton.isDisplayed();
        }.bind(this), 1000);
        this.sendToButton.click();

        browser.wait(function() {
            return this.publish_button.isDisplayed();
        }.bind(this), 1000);

        this.publish_button.click();

        if (!skipConfirm) {
            var modal = element(by.className('modal-dialog'));
            modal.isPresent().then(function(click) {
                if (click) {
                    modal.element(by.className('btn-primary')).click();
                }
            });
        }
    };

    this.correct = function() {
        this.sendToButton.click();
        return this.correct_button.click();
    };

    this.save = function() {
        element(by.css('[ng-click="saveTopbar(item)"]')).click();
        return browser.wait(function() {
            return element(by.buttonText('SAVE')).getAttribute('disabled');
        });
    };

    this.edit = function() {
        return element(by.id('Edit')).click();
    };

    this.showSearch = function() {
        return element(by.id('Search')).click();
    };

    this.showMulticontent = function() {
        element(by.id('Aggregate')).click();
    };

    this.showVersions = function() {
        return element(by.id('Versioning')).click();
    };

    this.showComments = function() {
        return element(by.id('Comments')).click();
    };

    this.showHistory = function() {
        this.showVersions();
        return element(by.css('[ng-click="tab = \'history\'"]')).click();
    };

    this.showInfo = function() {
        return element(by.id('Info')).click();
    };

    this.toggleNotForPublication = function() {
        element(by.model('item.flags.marked_for_not_publication')).click();
    };

    this.showPackages = function() {
        return element(by.id('Packages')).click();
    };

    this.getGUID = function() {
        return element(by.id('guid'));
    };

    this.getPackages = function() {
        return element.all(by.repeater('pitem in contentItems'));
    };

    this.getPackage = function(index) {
        return this.getPackages().get(index);
    };

    this.getHistoryItems = function() {
        return element.all(by.repeater('version in versions'));
    };

    this.getHistoryItem = function(index) {
        return this.getHistoryItems().get(index);
    };

    this.getQueuedItemsSwitch = function(item) {
        return item.element(by.className('icon-plus-small'));
    };

    this.getQueuedItems = function() {
        return element.all(by.repeater('queuedItem in queuedItems'));
    };

    this.getSearchItem = function(item) {
        return element.all(by.repeater('pitem in contentItems')).get(item);
    };

    this.getSearchItemCount = function () {
        return element.all(by.repeater('pitem in contentItems')).count();
    };

    this.addToGroup = function(item, group) {
        var crtItem = this.getSearchItem(item);
        browser.actions().mouseMove(crtItem).perform();
        crtItem.element(by.css('[title="Add to package"]')).click();
        var groups = crtItem.all(by.repeater('t in groupList'));
        return groups.all(by.css('[option="' + group.toUpperCase() + '"]')).click();
    };

    this.addMultiToGroup = function(group) {
        return element.all(by.css('[class="icon-package-plus"]')).first()
            .waitReady()
            .then(function(elem) {
                return elem.click();
            }).then(function() {
                var groups = element(by.repeater('t in groupList'));
                return groups.all(by.css('[option="' + group.toUpperCase() + '"]'))
                    .click();
            });
    };

    this.getGroupedItems = function(group) {
        return element(by.css('[data-group="' + group.toLowerCase() + '"]'))
            .all(by.repeater('item in group.items'));
    };

    this.getGroupItems = function(group) {
        return element(by.id(group.toUpperCase())).all(by.repeater('item in group.items'));
    };

    this.getGroupItem = function(group, item) {
        return this.getGroupItems(group).get(item);
    };

    this.moveToGroup = function(srcGroup, scrItem, dstGroup, dstItem) {
        var src = this.getGroupItem(srcGroup, scrItem).element(by.className('package-item'));
        var dst = this.getGroupItem(dstGroup, dstItem).element(by.className('package-item'));
        return browser.actions()
            .mouseMove(src, {x: 5, y: 5})
            .mouseDown()
            .perform()
            .then(function() {
                browser.actions()
                    .mouseMove(dst, {x: 10, y: -3})
                    .mouseUp()
                    .perform();
            });
    };

    this.selectSearchItem = function(item) {
        var crtItem = this.getSearchItem(item);
        var icon = crtItem.all(by.tagName('i')).first();
        return icon.waitReady().then(function() {
            browser.actions()
                .mouseMove(icon)
                .perform();
        }).then(function() {
            crtItem.element(by.css('[ng-click="addToSelected(pitem)"]')).click();
        });
    };

    this.markForHighlights = function() {
        var toggle = element(by.id('authoring-extra-dropdown')).element(by.className('icon-dots-vertical'));

        browser.wait(function() {
            return toggle.isDisplayed();
        });

        toggle.click();
        browser.actions().mouseMove(element(by.css('.highlights-toggle .dropdown-toggle'))).perform();
    };

    this.toggleAutoSpellCheck = function() {
        var toggle = element(by.id('authoring-extra-dropdown')).element(by.className('icon-dots-vertical'));

        browser.wait(function() {
            return toggle.isDisplayed();
        });

        toggle.click();
        element(by.model('spellcheckMenu.isAuto')).click();
    };

    this.getSubnav = function() {
        return element(by.id('subnav'));
    };

    this.checkMarkedForHighlight = function(highlight, item) {
        expect(element(by.className('icon-star')).isDisplayed()).toBeTruthy();
        browser.actions().mouseMove(element(by.className('icon-star'))).perform();
        element.all(by.css('.dropdown-menu.open li')).then(function (items) {
            expect(items[1].getText()).toContain(highlight);
        });
    };

    var bodyHtml = element(by.model('item.body_html')).all(by.className('editor-type-html')).first();
    var headline = element(by.model('item.headline')).all(by.className('editor-type-html')).first();
    var abstract = element(by.model('item.abstract')).all(by.className('editor-type-html')).first();
    var bodyFooter = element(by.id('body_footer')).all(by.className('editor-type-html')).first();
    var bodyFooterPreview = element(by.id('body_footer_preview')).all(by.css('[ng-bind-html="html"]')).first();
    var packageSlugline = element.all(by.className('keyword')).last();

    this.writeText = function (text) {
        bodyHtml.sendKeys(text);
    };

    this.writeTextToHeadline = function (text) {
        headline.sendKeys(text);
    };

    this.writeTextToAbstract = function (text) {
        abstract.sendKeys(text);
    };

    this.writeTextToComment = function(text) {
        element(by.id('mentio-users')).sendKeys(text);
        element(by.id('comment-post')).click();
    };

    this.writeTextToPackageSlugline = function (text) {
        browser.wait(function() {
            return packageSlugline.isDisplayed();
        }, 100);
        packageSlugline.sendKeys(text);
    };

    this.getBodyText = function() {
        return bodyHtml.getText();
    };

    this.getHeadlineText = function() {
        return headline.getText();
    };

    this.getAbstractText = function() {
        return abstract.getText();
    };

    this.closeHeader = function() {
        element(by.className('icon-chevron-up-thin')).click();
    };

    this.changeNormalTheme = function (theme) {
        element(by.className('theme-select'))
                .element(by.className('dropdown-toggle')).click();

        element(by.className('normal-theme-list'))
                .all(by.className(theme)).first().click();
    };

    this.changeProofreadTheme = function (theme) {
        element(by.className('proofread-toggle')).click();
        element(by.className('theme-select'))
                .element(by.className('dropdown-toggle')).click();

        element(by.className('proofread-theme-list'))
                .all(by.className(theme)).first().click();
    };

    this.addHelpline = function (helplineLabel) {
        element(by.id('helplines')).element(by.css('option[label="' + helplineLabel + '"]')).click();
    };

    this.getHelplineSelectedOption = function (option) {
        return element(by.id('helplines')).all(by.tagName('option')).get(option).getAttribute('selected');
    };

    this.getBodyFooter = function () {
        return bodyFooter.getText();
    };
    this.getBodyFooterPreview = function () {
        return bodyFooterPreview.getText();
    };

    this.showTransmissionDetails = function (publishedHistoryItemIndex) {
        this.getHistoryItem(publishedHistoryItemIndex).element(
            by.css('[ng-click="showOrHideTransmissionDetails()"]')).click();
        browser.sleep(700);

        return element.all(by.repeater('queuedItem in queuedItems'));
    };

    this.openRelatedItem = function() {
        element(by.css('button[id="Related Item"]')).click();
        browser.sleep(1000);
    };

    this.searchRelatedItems = function(searchText) {
        var elm = element(by.model('itemListOptions.keyword'));
        elm.clear();
        elm.sendKeys(searchText);
        browser.sleep(2000);
    };

    this.getRelatedItems = function() {
        return element.all(by.repeater('item in processedItems'));
    };

    this.getRelatedItemBySlugline = function(item) {
        var relItems = element.all(by.repeater('item in processedItems')).get(item);
        return relItems.element(by.binding('item.slugline')).getText();
    };

    this.actionOpenRelatedItem = function(item) {
        element.all(by.css('[ng-click="actions.open.method(selected)"]')).get(1).click();
    };

    this.getHeaderSluglineText = function() {
        var headerDetails = element(by.className('authoring-header__detailed'));
        return headerDetails.all(by.model('item.slugline')).get(0).getAttribute('value');
    };

    this.getDuplicatedItemState = function(item) {
        var duplicatedItem = element.all(by.repeater('relatedItem in relatedItems._items')).get(item);
        return duplicatedItem.element(by.className('state-label')).getText();
    };

    this.getItemState = function() {
        return element(by.className('metadata')).element(by.className('state-label'));
    };

    this.isPublishedState = function() {
        return this.getItemState().getText()
            .then(function(state) {
                return (['published', 'corrected', 'killed'].indexOf(state.toLowerCase()) !== -1);
            });
    };

    this.getSubjectMetadataDropdownOpened = function() {
        var subject = element(by.className('authoring-header__detailed')).all(by.css('[data-field="subject"]'));
        return subject.all(by.className('dropdown-toggle')).click();
    };

    this.getCategoryMetadataDropdownOpened = function() {
        var category = element(by.className('authoring-header__detailed')).all(by.css('[data-field="anpa_category"]'));
        return category.all(by.className('dropdown-toggle')).click();
    };

    this.getNextLevelSelectedCategory = function() {
        var subject = element(by.className('authoring-header__detailed')).all(by.css('[data-field="subject"]'));
        return subject.all(by.className('levelup')).all(by.css('[ng-click="selectTerm(activeTerm)"]'));
    };

}
