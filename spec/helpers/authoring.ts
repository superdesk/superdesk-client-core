/* eslint-disable newline-per-chained-call */

import {element, by, browser, protractor} from "protractor";
import {waitHidden, wait} from "./utils";

class Authoring {
    lock: any;
    publish_button: any;
    correct_button: any;
    kill_button: any;
    close_button: any;
    cancel_button: any;
    add_content_button: any;
    ignore_button: any;
    save_publish_button: any;
    save_button: any;
    edit_button: any;
    update_button: any;
    edit_correct_button: any;
    edit_kill_button: any;
    edit_takedown_button: any;
    navbarMenuBtn: any;
    newPlainArticleLink: any;
    newEmptyPackageLink: any;
    infoIconsBox: any;
    sendToButton: any;
    sendAndContinueBtn: any;
    sendAndPublishBtn: any;
    sendBtn: any;
    moreActionsButton: any;
    multieditButton: any;
    compareVersionsMenuItem: any;
    setCategoryBtn: any;
    getCategoryListItems: any;
    sendItemContainer: any;
    linkToMasterButton: any;
    marked_for_legal: any;
    sms: any;
    anpa_category: any;
    subject: any;
    missing_link: any;
    publish_panel: any;
    send_panel: any;
    fetch_panel: any;
    headline: any;
    send_kill_button: any;
    send_correction_button: any;
    send_takedown_button: any;
    findItemTypeIcons: (itemType: any) => any;
    sendTo: (desk: any, stage: any, skipConfirm: any) => void;
    sendToAndContinue: (desk: any, stage: any, skipConfirm: any) => void;
    setEmbargo: () => void;
    confirmSendTo: () => void;
    sendToSidebarOpened: (desk: any, stage: any, _continue: any) => void;
    duplicateTo: (desk: any, stage: any, open: any) => void;
    selectDeskforSendTo: (desk: any) => void;
    markAction: () => any;
    createTextItem: () => any;
    createTextItemFromTemplate: (name: any) => void;
    close: () => any;
    cancel: () => any;
    addEmbed: (embedCode: any, context: any) => void;
    getBlock: (position: any) => any;
    blockContains: (position: any, expectedValue: any) => void;
    cutBlock: (position: any) => any;
    ignore: () => any;
    savePublish: () => any;
    publish: (skipConfirm: any) => void;
    sendAndpublish: (desk: any, skipConfirm: any) => void;
    closeSendAndPublish: () => any;
    publishFrom: (desk: any) => void;
    schedule: (skipConfirm: any) => void;
    correct: () => any;
    save: () => any;
    edit: () => any;
    showSearch: () => any;
    showMulticontent: () => void;
    showVersions: () => any;
    showComments: () => any;
    showHistory: () => any;
    showInfo: () => any;
    minimize: () => any;
    maximize: (name: any) => void;
    toggleNotForPublication: () => void;
    toggleLegal: () => void;
    toggleSms: () => any;
    setKeywords: (keyword: any) => void;
    getKeywords: () => any;
    getPubStatus: () => any;
    showPackages: () => any;
    getGUID: () => any;
    getPackages: () => any;
    getPackage: (index: any) => any;
    getHistoryItems: () => any;
    getVersions: () => any;
    getHistoryItem: (index: any) => any;
    getQueuedItemsSwitch: (item: any) => any;
    getQueuedItems: () => any;
    getSearchItem: (item: any) => any;
    getSearchItemCount: () => any;
    addToGroup: (item: any, group: any) => any;
    addMultiToGroup: (group: any) => any;
    getGroupedItems: (group: any) => any;
    getGroupItems: (group: any) => any;
    removeGroupItem: (group: any, index: any) => void;
    getGroupItem: (group: any, item: any) => any;
    moveToGroup: (srcGroup: any, scrItem: any, dstGroup: any, dstItem: any) => any;
    selectSearchItem: (item: any) => any;
    markForHighlights: () => void;
    markForDesks: () => void;
    toggleAutoSpellCheck: () => void;
    openLiveSuggest: () => void;
    getSuggestedItems: () => any;
    getSubnav: () => any;
    checkMarkedForHighlight: (highlight: any, item: any) => void;
    writeText: (text: any) => void;
    writeTextToHeadline: (text: any) => void;
    writeTextToAbstract: (text: any) => void;
    writeTextToByline: (text: any) => void;
    getBylineText: () => any;
    writeTextToComment: (text: any) => void;
    writeTextToPackageSlugline: (text: any) => void;
    getSignoffText: () => any;
    writeSignoffText: (text: any) => void;
    getEditorWordCount: () => any;
    getBodyText: () => any;
    getBodyInnerHtml: () => any;
    focusBodyHtmlElement: () => void;
    cleanBodyHtmlElement: () => void;
    backspaceBodyHtml: (count: any) => void;
    getHeadlineText: () => any;
    getAbstractText: () => any;
    getAbstractFieldCount: () => any;
    closeHeader: () => void;
    changeNormalTheme: (theme: any) => void;
    changeProofreadTheme: (theme: any) => void;
    addHelpline: (helplineLabel: any) => void;
    getHelplineSelectedOption: (option: any) => any;
    getBodyFooter: () => any;
    getBodyFooterPreview: () => any;
    showTransmissionDetails: (publishedHistoryItemIndex: any) => any;
    openRelatedItem: () => void;
    openMacros: () => void;
    callMacros: (macroName: any) => void;
    searchRelatedItems: (searchText: any) => void;
    getRelatedItems: () => any;
    openRelatedItemConfiguration: () => void;
    setRelatedItemConfigurationSlugline: (matchValue: any) => void;
    setRelatedItemConfigurationLastUpdate: (lastUpdate: any) => void;
    saveRelatedItemConfiguration: () => void;
    getRelatedItemSlugline: (item: any) => any;
    actionOpenRelatedItem: (item: any) => void;
    actionRelatedItem: (item: any, actionId: any) => void;
    getHeaderSluglineText: () => any;
    setHeaderSluglineText: (text: any) => any;
    setHeaderEdNoteText: (text: any) => any;
    getHeaderEdNoteText: (text: any) => any;
    getDuplicatedItemState: (item: any) => any;
    getItemState: () => any;
    isPublishedState: () => any;
    getSubjectMetadataDropdownOpened: () => any;
    getSelectedSubjects: () => any;
    getCategoryMetadataDropdownOpened: () => any;
    getSelectedCategories: () => any;
    getANPATakeKeyValue: () => any;
    setlocation: (term: any) => void;
    getSelectedLocation: (term: any) => any;
    getNextLevelSelectedCategory: () => any;
    getItemSource: () => any;
    getGenreDropdown: () => any;
    getPackageItems: (group: any) => any;
    openCompareVersionsScreen: () => void;
    getCompareVersionsBoards: () => any;
    closeCompareVersionsScreen: () => void;
    getBoard: (index: any) => any;
    getBoardArticle: (index: any) => any;
    getArticleHeadlineOfBoard: (index: any) => any;
    getHtmlArticleHeadlineOfBoard: (index: any) => any;
    openCompareVersionsInnerDropdown: (index: any) => void;
    getInnerDropdownItemVersions: (index: any) => any;
    openItemVersionInBoard: (board: any, index: any) => void;

    construtor() {
        this.lock = element(by.css('[ng-click="lock()"]'));
        this.publish_button = element(by.buttonText('publish'));
        this.correct_button = element(by.buttonText('correct'));
        this.kill_button = element(by.buttonText('kill'));
        this.close_button = element(by.buttonText('Close'));
        this.cancel_button = element(by.buttonText('Cancel'));
        this.add_content_button = by.className('add-content__plus-btn');
        this.ignore_button = element(by.buttonText('Ignore'));
        this.save_publish_button = element(by.buttonText('Save and publish'));
        this.save_button = element(by.buttonText('Save'));
        this.edit_button = element(by.id('Edit'));
        this.update_button = element(by.buttonText('Update'));
        this.edit_correct_button = element(by.buttonText('Correct'));
        this.edit_kill_button = element(by.buttonText('Kill'));
        this.edit_takedown_button = element(by.buttonText('Takedown'));

        this.navbarMenuBtn = element(by.css('.dropdown__toggle.sd-create-btn'));
        this.newPlainArticleLink = element(by.id('create_text_article'));
        this.newEmptyPackageLink = element(by.id('create_package'));
        this.infoIconsBox = element(by.css('.info-icons'));

        this.sendToButton = element(by.id('send-to-btn'));
        this.sendAndContinueBtn = element(by.buttonText('send and continue'));
        this.sendAndPublishBtn = element(by.buttonText('publish from'));
        this.sendBtn = element(by.buttonText('send'));

        this.moreActionsButton = element(by.id('more-actions'));

        this.multieditButton = element(by.id('multiedit'));
        this.compareVersionsMenuItem = element(by.id('compare-versions'));

        this.setCategoryBtn = element(by.id('category-setting'))
            .element(by.tagName('button'));

        this.getCategoryListItems = element(by.id('category-setting'))
            .all(by.repeater('term in $vs_collection track by term[uniqueField]'));

        this.sendItemContainer = element(by.id('send-item-container'));
        this.linkToMasterButton = element(by.id('preview-master'));
        this.marked_for_legal = element(by.model('item.flags.marked_for_legal'));
        this.sms = element(by.model('item.flags.marked_for_sms'));
        this.anpa_category = element(by.className('authoring-header__detailed'))
            .all(by.css('[data-field="anpa_category"]'));
        this.subject = element(by.className('authoring-header__detailed')).all(by.css('[data-field="subject"]'));
        this.missing_link = element(by.className('missing-link'));
        this.publish_panel = element(by.css('#panel-publish:not(.ng-hide)'));
        this.send_panel = element(by.css('#panel-send:not(.ng-hide)'));
        this.fetch_panel = element(by.css('#panel-fetch:not(.ng-hide)'));
        this.headline = element(by.model('item.headline')).all(by.className('editor-type-html')).first();

        this.send_kill_button = element(by.id('send-kill-btn'));
        this.send_correction_button = element(by.id('send-correction-btn'));
        this.send_takedown_button = element(by.id('send-takedown-btn'));

        /**
         * Find all file type icons in the item's info icons box matching the
         * given file type.
         *
         * @param {string} itemType - the item type of interest, e.g. 'text',
         *   'composite', 'picture', etc.
         * @return {Object} a promise that is resolved with all DOM elements found
         */
        this.findItemTypeIcons = function(itemType) {
            var selector = '.filetype-icon-' + itemType;

            return this.infoIconsBox.all(by.css(selector));
        };

        /**
         * Send item to given desk
         *
         * @param {string} desk Desk name
         * @param {string} stage Stage name
         * @param {boolean} skipConfirm
         */
        this.sendTo = function(desk, stage, skipConfirm) {
            this.sendToButton.click();
            this.sendToSidebarOpened(desk, stage);
            if (skipConfirm) {
                this.confirmSendTo();
            }
        };

        this.sendToAndContinue = function(desk, stage, skipConfirm) {
            this.sendToButton.click();
            this.sendToSidebarOpened(desk, stage, true);
            if (skipConfirm) {
                this.confirmSendTo();
            }
        };

        /**
         * function to set embargo date and time inside sendTo panel
         */
        this.setEmbargo = function() {
            var embargoDate = '09/09/' + ((new Date()).getFullYear() + 1);
            var embargoTime = '04:00';

            element(by.model('item.embargo_date')).element(by.tagName('input')).sendKeys(embargoDate);
            element(by.model('item.embargo_time')).element(by.tagName('input')).sendKeys(embargoTime);
        };

        this.confirmSendTo = function() {
            element.all(by.className('modal__content')).count().then((closeModal) => {
                if (closeModal) {
                    element(by.className('modal__content')).all(by.css('[ng-click="ok()"]')).click();
                }
            });
        };

        this.sendToSidebarOpened = function(desk, stage, _continue) {
            this.send_panel.click();
            var sidebar = element.all(by.css('.side-panel')).last(),
                dropdown = sidebar.element(by.css('.dropdown--dark .dropdown__toggle'));

            dropdown.waitReady();
            dropdown.click();
            sidebar.element(by.buttonText(desk)).click();
            if (stage) {
                sidebar.element(by.buttonText(stage)).click();
            }
            if (_continue) {
                this.sendAndContinueBtn.click();
            } else {
                this.sendBtn.click();
            }
        };

        this.duplicateTo = (desk, stage, open) => {
            let duplicateButton = element(by.id('duplicate-btn'));
            let duplicateAndOpenButton = element(by.id('duplicate-open-btn'));

            var sidebar = element.all(by.css('.side-panel')).last(),
                dropdown = sidebar.element(by.css('.dropdown--dark .dropdown__toggle'));

            dropdown.waitReady();
            dropdown.click();
            sidebar.element(by.buttonText(desk)).click();
            if (stage) {
                sidebar.element(by.buttonText(stage)).click();
            }
            if (open) {
                duplicateAndOpenButton.click();
            } else {
                duplicateButton.click();
            }
        };

        this.selectDeskforSendTo = function(desk) {
            var sidebar = element.all(by.css('.side-panel')).last(),
                dropdown = element(by.css('.dropdown--dark .dropdown__toggle'));

            dropdown.waitReady();
            dropdown.click();
            sidebar.element(by.buttonText(desk)).click();
        };

        this.markAction = function() {
            return element(by.className('svg-icon-add-to-list')).click();
        };

        this.createTextItem = function() {
            return element(by.className('sd-create-btn'))
                .click()
                .then(() => element(by.id('create_text_article')).click());
        };

        /**
         * Create an item using template
         *
         * @param {String} name
         */
        this.createTextItemFromTemplate = (name) => {
            element(by.className('sd-create-btn')).click();
            element(by.id('more_templates')).click();
            let templates = element.all(by.repeater('template in templates track by template._id'));

            templates.all(by.css('[ng-click="select({template: template})"]'))
                .filter((elem) => elem.getText().then((text) => text.toUpperCase().indexOf(name.toUpperCase()) > -1))
                .click();
        };

        this.close = function() {
            return this.close_button.click();
        };

        this.cancel = function() {
            this.cancel_button.click();
            return waitHidden(this.cancel_button);
        };

        this.addEmbed = function(embedCode, context) {
            let ctx = context;

            if (!context) {
                ctx = element(by.tagName('body'));
            }
            browser.wait(() => ctx.element(this.add_content_button).isDisplayed(), 1000);
            ctx.element(this.add_content_button).click();
            browser.wait(() => element(by.id('closeAuthoringBtn')).isDisplayed(), 2000);
            ctx.element(by.css('[ng-click="vm.triggerAction(\'addEmbed\')"]')).click();
            ctx.element(by.css('.add-embed__input input')).sendKeys(embedCode || 'embed code');
            ctx.element(by.css('[ng-click="vm.createBlockFromEmbed()"]')).click();
        };

        this.getBlock = function(position) {
            return element(by.model('item.body_html')).all(
                by.css('.block__container'),
            ).get(position);
        };

        this.blockContains = function blockContains(position, expectedValue) {
            const block = this.getBlock(position);
            const editor = block.all(by.className('editor-type-html')).first();

            editor.isPresent().then((isText) => {
                if (isText) {
                    return editor.getText();
                }

                return block.element(by.css('.preview--embed')).getText();
            }).then((value) => {
                expect(value).toBe(expectedValue);
            });
        };

        this.cutBlock = function(position) {
            return this.getBlock(position).element(by.css('.block__cut')).click();
        };

        this.ignore = function() {
            return this.ignore_button.click();
        };

        this.savePublish = function() {
            return this.save_publish_button.click();
        };

        this.publish = function(skipConfirm) {
            browser.wait(() => this.sendToButton.isPresent(), 1000);
            this.sendToButton.click();

            browser.wait(() => this.publish_panel.isPresent(), 3000);

            this.publish_panel.click();

            browser.wait(() => this.publish_button.isPresent(), 3000);

            this.publish_panel.click();
            this.publish_button.click();

            if (!skipConfirm) {
                var modal = element(by.className('modal__dialog'));

                modal.isPresent().then((click) => {
                    if (click) {
                        modal.element(by.className('btn--primary')).click();
                    }
                });
            }
        };

        this.sendAndpublish = function(desk, skipConfirm) {
            browser.wait(() => this.sendToButton.isPresent(), 1000);
            this.sendToButton.click();

            this.publish_panel.click();

            browser.wait(() => this.publish_button.isPresent(), 1000);

            this.publish_panel.click();
            this.selectDeskforSendTo(desk);
            this.sendAndPublishBtn.click();

            if (!skipConfirm) {
                var modal = element(by.className('modal__dialog'));

                modal.isPresent().then((click) => {
                    if (click) {
                        modal.element(by.className('btn--primary')).click();
                    }
                });
            }
        };

        this.closeSendAndPublish = function() {
            var sidebar = element.all(by.css('.side-panel')).last();

            return sidebar.element(by.css('[ng-click="close()"]')).click();
        };

        this.publishFrom = function(desk) {
            this.publish_panel.click();

            browser.sleep(1000);

            browser.wait(() => this.publish_panel.isPresent(), 2000);
            this.selectDeskforSendTo(desk);
            this.sendAndPublishBtn.click();
        };

        this.schedule = function(skipConfirm) {
            browser.wait(() => this.sendToButton.isPresent(), 1000);
            this.sendToButton.click();

            var scheduleDate = '09/09/' + ((new Date()).getFullYear() + 1);
            var scheduleTime = '04:00';

            element(by.model('item.publish_schedule_date')).element(by.tagName('input')).sendKeys(scheduleDate);
            element(by.model('item.publish_schedule_time')).element(by.tagName('input')).sendKeys(scheduleTime);

            this.publish_panel.click();

            browser.wait(() => this.publish_button.isPresent(), 1000);

            this.publish_button.click();

            if (!skipConfirm) {
                var modal = element(by.className('modal__dialog'));

                modal.isPresent().then((click) => {
                    if (click) {
                        modal.element(by.className('btn--primary')).click();
                    }
                });
            }
        };

        this.correct = function() {
            this.sendToButton.click();
            return this.correct_button.click();
        };

        this.save = function() {
            browser.wait(() => this.save_button.isEnabled(), 2000);
            this.save_button.click();
            return browser.wait(() => this.save_button.getAttribute('disabled'));
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
            return element(by.id('versioning')).click();
        };

        this.showComments = function() {
            return element(by.id('comments')).click();
        };

        this.showHistory = function() {
            this.showVersions();
            return element(by.id('authoring-container')).element(by.css('[ng-click="tab = \'history\'"]')).click();
        };

        this.showInfo = function() {
            return element(by.id('metadata')).click();
        };

        this.minimize = () => element(by.css('[ng-click="minimize()"]')).click();

        this.maximize = (name) => {
            let href = `#/authoring/${name}`;

            element(by.css('[ng-href="' + href + '"]')).click();
        };

        this.toggleNotForPublication = function() {
            element(by.model('item.flags.marked_for_not_publication')).click();
        };

        this.toggleLegal = function() {
            this.marked_for_legal.click();
        };

        this.toggleSms = () => this.sms.click();

        this.setKeywords = function(keyword) {
            var keywords = element(by.css('[data-field="keywords"]')).all(by.model('term'));

            keywords.sendKeys(keyword);
            browser.actions().sendKeys(protractor.Key.ENTER).perform();
        };

        this.getKeywords = function() {
            return element(by.css('[data-field="keywords"]'))
                .all(by.repeater('t in item[field] track by t'))
                .first().getText();
        };

        this.getPubStatus = function() {
            return element(by.css('[ng-if="item.pubstatus"]')).all(by.className('data')).first().getText();
        };

        this.showPackages = function() {
            return element(by.id('packages')).click();
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
            return element.all(by.repeater('historyItem in historyItems'));
        };

        this.getVersions = function() {
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

        this.getSearchItemCount = function() {
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
                .then((elem) => elem.click()).then(() => {
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

        this.removeGroupItem = function(group, index) {
            var groupItem = this.getGroupItems(group).get(index);

            groupItem.all(by.css('[ng-click="remove(group.id, item.residRef)"]')).get(index).click();
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
                .then(() => {
                    browser.actions()
                        .mouseMove(dst, {x: 10, y: 1})
                        .mouseUp()
                        .perform();
                });
        };

        this.selectSearchItem = function(item) {
            var crtItem = this.getSearchItem(item);
            var icon = crtItem.all(by.tagName('i')).first();

            return icon.waitReady().then(() => {
                browser.actions()
                    .mouseMove(icon)
                    .perform();
            }).then(() => {
                crtItem.element(by.css('[ng-click="addToSelected(pitem)"]')).click();
            });
        };

        function openAuthoringDropdown() {
            var toggle = element(by.id('authoring-extra-dropdown')).element(by.className('icon-dots-vertical'));

            browser.wait(() => toggle.isDisplayed());
            toggle.click();
        }

        this.markForHighlights = function() {
            openAuthoringDropdown();
            browser.actions().mouseMove(element(by.css('.highlights-toggle .dropdown__toggle'))).perform();
        };

        this.markForDesks = function() {
            openAuthoringDropdown();
            browser.actions().mouseMove(element(by.css('.marks-toggle .dropdown__toggle'))).perform();
        };

        this.toggleAutoSpellCheck = function() {
            openAuthoringDropdown();
            element(by.model('spellcheckMenu.isAuto')).click();
        };

        this.openLiveSuggest = function() {
            openAuthoringDropdown();
            element(by.css('.live-suggest-menu-item')).click();
        };

        this.getSuggestedItems = function() {
            return element.all(by.css('sd-suggest ul[sd-list-view] > li.list-item-view'));
        };

        this.getSubnav = function() {
            return element(by.id('subnav'));
        };

        this.checkMarkedForHighlight = function(highlight, item) {
            expect(element(by.className('icon-star')).isDisplayed()).toBeTruthy();
            browser.actions().click(element(by.className('icon-star'))).perform();
            element.all(by.css('.dropdown__menu.open li')).then((items) => {
                expect(items[1].getText()).toContain(highlight);
            });
        };

        var bodyHtml = element(by.model('item.body_html')).all(by.className('editor-type-html')).first();
        var abstract = element(by.model('item.abstract')).all(by.className('editor-type-html')).first();
        var bodyFooter = element(by.id('body_footer')).all(by.className('editor-type-html')).first();
        var bodyFooterPreview = element(by.id('body_footer_preview')).all(by.css('[ng-bind-html="html"]')).first();
        var packageSlugline = element.all(by.className('keyword')).last();
        var byline = element(by.model('item.byline')).all(by.className('editor-type-html')).first();

        this.writeText = function(text) {
            bodyHtml.sendKeys(text);
        };

        this.writeTextToHeadline = function(text) {
            this.headline.sendKeys(text);
        };

        this.writeTextToAbstract = function(text) {
            abstract.sendKeys(text);
        };

        this.writeTextToByline = function(text) {
            byline.sendKeys(text);
        };

        this.getBylineText = function() {
            return byline.getText();
        };

        this.writeTextToComment = function(text) {
            element(by.id('mentio-users')).sendKeys(text);
            element(by.id('comment-post')).click();
        };

        this.writeTextToPackageSlugline = function(text) {
            browser.wait(() => packageSlugline.isDisplayed(), 100);
            packageSlugline.sendKeys(text);
        };

        this.getSignoffText = function() {
            return element(by.id('sign-off')).getText();
        };

        this.writeSignoffText = function(text) {
            var signoffEditable = element(by.id('sign_off'));
            var signoffUnlock = element(by.id('sign-off-unlock'));

            // unlock sign-off
            signoffUnlock.click();
            signoffEditable.clear();
            signoffEditable.sendKeys(text);
            // lock sign-off
            signoffUnlock.click();
        };

        this.getEditorWordCount = () => element.all(by.className('char-count words')).last().getText();

        this.getBodyText = function() {
            return bodyHtml.getText();
        };

        this.getBodyInnerHtml = function() {
            return browser.executeScript('return arguments[0].innerHTML;',
                element(by.model('item.body_html')).all(by.className('editor-type-html')).last());
        };

        this.focusBodyHtmlElement = function() {
            bodyHtml.click();
        };

        this.cleanBodyHtmlElement = function() {
            bodyHtml.clear();
            this.backspaceBodyHtml();
        };

        this.backspaceBodyHtml = function(count) {
            var sequence = '';

            for (var i = 0; i < (count || 1); i++) {
                sequence += protractor.Key.BACK_SPACE;
            }

            bodyHtml.sendKeys(sequence);
        };

        this.getHeadlineText = function() {
            return this.headline.getText();
        };

        this.getAbstractText = function() {
            return abstract.getText();
        };

        this.getAbstractFieldCount = function() {
            return element.all(by.model('item.abstract')).count();
        };

        this.closeHeader = function() {
            element(by.className('icon-chevron-up-thin')).click();
        };

        this.changeNormalTheme = function(theme) {
            element(by.css('[sd-theme-select]')).click();

            element(by.className('sd-column-box__main-column--left'))
                .element(by.className(theme)).click();

            element(by.css('[ng-click="saveTheme()"]')).click();
        };

        this.changeProofreadTheme = function(theme) {
            element(by.className('proofread-toggle')).click();
            element(by.css('[sd-theme-select]')).click();

            element(by.className('sd-column-box__main-column--right'))
                .element(by.className(theme)).click();

            element(by.css('[ng-click="saveTheme()"]')).click();
        };

        this.addHelpline = function(helplineLabel) {
            element(by.id('helplines')).element(by.css('option[label="' + helplineLabel + '"]')).click();
        };

        this.getHelplineSelectedOption = function(option) {
            return element(by.id('helplines')).all(by.tagName('option')).get(option).getAttribute('selected');
        };

        this.getBodyFooter = function() {
            return bodyFooter.getText();
        };
        this.getBodyFooterPreview = function() {
            return bodyFooterPreview.getText();
        };

        this.showTransmissionDetails = function(publishedHistoryItemIndex) {
            this.getHistoryItem(publishedHistoryItemIndex).element(
                by.css('[ng-click="showOrHideTransmissionDetails()"]')).click();
            browser.sleep(700);

            return element.all(by.repeater('queuedItem in queuedItems'));
        };

        this.openRelatedItem = function() {
            element(by.css('a[id="related-item"]')).click();
            wait(element(by.className('widget-related-item')), 1000);
        };

        this.openMacros = function() {
            element(by.css('a[id="macros"]')).click();
            wait(element.all(by.repeater('macro in macros')), 1000);
        };

        this.callMacros = function(macroName) {
            const macros = element.all(by.repeater('macro in macros'));
            const macroBtn = macros.filter(
                (elem) => elem.getText().then((text) => text.toLowerCase() === macroName.toLowerCase()),
            ).first();

            if (macroBtn) {
                macroBtn.click();
            }
        };

        this.searchRelatedItems = function(searchText) {
            const btn = element(by.id('search-related-items'));

            if (searchText) {
                const input = element(by.model('itemListOptions.keyword'));

                input.clear();
                input.sendKeys(searchText);
                browser.wait(() => btn.isEnabled(), 2000);
            }

            btn.click();
        };

        this.getRelatedItems = function() {
            return element.all(by.repeater('item in processedItems'));
        };

        this.openRelatedItemConfiguration = function() {
            element(by.className('related-item'))
                .element(by.className('widget-settings'))
                .element(by.className('single-btn')).click();
        };

        this.setRelatedItemConfigurationSlugline = function(matchValue) {
            element(by.model('configuration.sluglineMatch'))
                .element(by.css('option[value="' + matchValue + '"]')).click();
        };

        this.setRelatedItemConfigurationLastUpdate = function(lastUpdate) {
            element(by.model('configuration.modificationDateAfter'))
                .element(by.css('option[value="' + lastUpdate + '"]')).click();
        };

        this.saveRelatedItemConfiguration = function() {
            element(by.className('modal__footer'))
                .element(by.buttonText('Save')).click();
        };

        this.getRelatedItemSlugline = function(item) {
            const relItems = element.all(by.repeater('item in processedItems'));

            browser.wait(() => relItems.count(), 5000);
            return relItems.get(item).element(by.binding('item.slugline')).getText();
        };

        this.actionOpenRelatedItem = function(item) {
            let relItem = element.all(by.repeater('item in processedItems')).get(item);

            relItem.element(by.className('icon-dots-vertical')).click();
            let menu = element(by.css('.dropdown__menu.open'));

            menu.element(by.partialLinkText('Open')).click();
        };

        this.actionRelatedItem = function(item, actionId) {
            var relItem = element.all(by.repeater('item in processedItems')).get(item);

            relItem.element(by.className('icon-dots-vertical')).click();
            relItem.element(by.css('[id="' + actionId + '"]')).click();
        };

        this.getHeaderSluglineText = function() {
            var headerDetails = element(by.className('authoring-header__detailed'));

            return headerDetails.all(by.model('item.slugline')).get(0).getAttribute('value');
        };

        this.setHeaderSluglineText = function(text) {
            var headerDetails = element(by.className('authoring-header__detailed'));

            return headerDetails.all(by.model('item.slugline')).sendKeys(text);
        };

        this.setHeaderEdNoteText = function(text) {
            var headerDetails = element(by.className('authoring-header__detailed'));

            return headerDetails.all(by.model('item.ednote')).sendKeys(text);
        };

        this.getHeaderEdNoteText = function(text) {
            var headerDetails = element(by.className('authoring-header__detailed'));

            return headerDetails.all(by.model('item.ednote')).get(0).getAttribute('value');
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
                .then((state) => ['published', 'corrected', 'killed', 'recalled'].indexOf(state.toLowerCase()) !== -1);
        };

        this.getSubjectMetadataDropdownOpened = function() {
            return this.subject.all(by.className('dropdown__toggle')).click();
        };

        this.getSelectedSubjects = function() {
            return this.subject.all(by.repeater('t in selectedItems'));
        };

        this.getCategoryMetadataDropdownOpened = function() {
            return this.anpa_category.all(by.className('dropdown__toggle')).click();
        };

        this.getSelectedCategories = function() {
            return this.anpa_category.all(by.repeater('t in selectedItems'));
        };

        this.getANPATakeKeyValue = function() {
            var takeKey = element(by.className('authoring-header__detailed')).all(by.id('anpa_take_key'));

            return takeKey.get(0).getAttribute('value');
        };

        // set first filtered item as per inital term provided
        this.setlocation = function(term) {
            var location = element.all(by.css('[data-field="located"]')).all(by.model('term'));

            location.sendKeys(term);
            browser.actions().sendKeys(protractor.Key.DOWN).perform();
            browser.actions().sendKeys(protractor.Key.ENTER).perform();
        };

        this.getSelectedLocation = function(term) {
            var location = element.all(by.css('[data-field="located"]')).all(by.model('term'));

            return location.first().getAttribute('value');
        };

        this.getNextLevelSelectedCategory = function() {
            return this.subject.all(by.className('levelup')).all(
                by.css('[ng-click="allowEntireCat && selectTerm(activeTerm, $event)"]'));
        };

        this.getItemSource = function() {
            return element(by.className('authoring-header__general-info')).all(by.id('item-source')).first().getText();
        };

        this.getGenreDropdown = function() {
            var genre = element(by.className('authoring-header__detailed')).all(by.css('[data-field="genre"]'));

            return genre.all(by.className('dropdown__toggle'));
        };

        this.getPackageItems = function(group) {
            var _list = element(by.css('[data-title="' + group + '"]')).all(by.tagName('UL')).all(by.tagName('LI'));

            return _list;
        };

        this.openCompareVersionsScreen = function() {
            this.moreActionsButton.click();
            this.compareVersionsMenuItem.click();
        };

        this.getCompareVersionsBoards = function() {
            return element(by.className('boards-list')).all(by.repeater('board in boards'));
        };

        this.closeCompareVersionsScreen = function() {
            element.all(by.css('[ng-click="closeScreen()"]')).click();
        };

        this.getBoard = function(index) {
            return this.getCompareVersionsBoards().get(index);
        };

        this.getBoardArticle = function(index) {
            return this.getBoard(index).all(by.css('[data-article="board.article"]'));
        };

        this.getArticleHeadlineOfBoard = function(index) {
            return this.getBoardArticle(index).all(by.className('headline')).first().getText();
        };

        this.getHtmlArticleHeadlineOfBoard = function(index) {
            return browser.executeScript('return arguments[0].innerHTML;',
                this.getBoardArticle(index).all(by.className('headline')).first());
        };

        this.openCompareVersionsInnerDropdown = function(index) {
            this.getBoard(index).all(by.css('[class="navbtn dropdown"]')).click();
        };

        this.getInnerDropdownItemVersions = function(index) {
            return this.getBoard(index)
                .all(by.css('[sd-compare-versions-inner-dropdown]'))
                .all(by.repeater('item in items'));
        };

        this.openItemVersionInBoard = function(board, index) {
            this.openCompareVersionsInnerDropdown(board);
            this.getInnerDropdownItemVersions(board).get(index).click();
        };
    }
}

export const authoring = new Authoring();
export default authoring;
