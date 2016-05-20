
'use strict';

var openUrl = require('./helpers/utils').open,
    workspace = require('./helpers/pages').workspace,
    content = require('./helpers/pages').content,
    globalSearch = require('./helpers/search'),
    authoring = require('./helpers/authoring'),
    monitoring = require('./helpers/monitoring');

describe('search', function() {

    beforeEach(function() {
        openUrl('/#/search').then(globalSearch.setListView());
    });

    it('can search by search field', function() {
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.searchInput.click();
        globalSearch.searchInput.clear();
        globalSearch.searchInput.sendKeys('item3');
        var focused = browser.driver.switchTo().activeElement().getAttribute('id');
        expect(globalSearch.searchInput.getAttribute('id')).toEqual(focused);
        element(by.id('search-button')).click();
        expect(globalSearch.getItems().count()).toBe(3);
    });

    xit('can search by search within field', function() {
        globalSearch.openFilterPanel();
        expect(globalSearch.getItems().count()).toBe(14);

        var searchTextbox = element(by.id('search_within'));
        searchTextbox.clear();
        searchTextbox.sendKeys('item3');
        element(by.id('search_within_button')).click();
        expect(globalSearch.getItems().count()).toBe(3);
        expect(element.all(by.repeater('parameter in tags.selectedKeywords')).count()).toBe(1);
    });

    xit('can search by search within field with parenthesis and clear by tag', function() {
        globalSearch.openFilterPanel();
        expect(globalSearch.getItems().count()).toBe(14);

        var searchTextbox = element(by.id('search_within'));
        searchTextbox.clear();
        searchTextbox.sendKeys('(item3)');
        element(by.id('search_within_button')).click();
        expect(globalSearch.getItems().count()).toBe(3);
        expect(element.all(by.repeater('parameter in tags.selectedKeywords')).count()).toBe(1);
        element(by.css('.icon-close-small')).click();
        expect(globalSearch.getItems().count()).toBe(14);
    });

    xit('can search by subject codes field', function () {
        workspace.switchToDesk('SPORTS DESK').then(content.setListView);
        expect(element.all(by.repeater('items._items')).count()).toBe(2);

        var filterPanelButton = element(by.css('.filter-trigger'));
        var subject = element.all(by.css('.dropdown-nested')).first();
        var subjectToggle = subject.element(by.css('.dropdown-toggle'));

        filterPanelButton.click();
        element.all(by.css('[ng-click="toggleModule()"]')).first().click();
        subjectToggle.click();
        subject.all(by.css('.nested-toggle')).first().click();
        subject.all(by.repeater('term in activeTree')).first().click();

        expect(element.all(by.repeater('t in item[field]')).count()).toBe(1);
        expect(element.all(by.repeater('parameter in tags.selectedParameters')).count()).toBe(1);
        expect(element.all(by.repeater('item in items._items')).count()).toBe(0);
    });

    xit('can navigate/filter subject field and search by selected subject term', function () {
        expect(globalSearch.getItems().count()).toBe(14);

        globalSearch.openFilterPanel();
        globalSearch.openToggleBox('Parameters');

        globalSearch.toggleSubjectMetadata(); // opens subject drop-down
        browser.sleep(100);

        browser.actions().sendKeys('archa').perform();
        expect(globalSearch.getSubjectFilteredTerm(0)).toBe('archaeology');

        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        browser.actions().sendKeys(protractor.Key.ENTER).perform(); // selects subject term

        // expect selected term in filter pane
        expect(globalSearch.getSelectedSubjectsInFilter().count()).toBe(1);
        // expect selected term in tag list, at top of search list
        expect(globalSearch.getSelectedTags().count()).toBe(1);

        // expect some search result returned
        expect(globalSearch.getItems().count()).toBeGreaterThan(0);

        // now preview first item on search list and expect item contains selected subject
        globalSearch.itemClick(0);
        monitoring.tabAction('metadata');
        expect(globalSearch.getItemSubjectContains()).toContain('archaeology');
    });

    it('can search by priority field', function () {
        globalSearch.openFilterPanel();
        expect(globalSearch.getItems().count()).toBe(14);
        expect(globalSearch.getPriorityElements().count()).toBe(3);
        var priority = globalSearch.getPriorityElementByIndex(0);
        priority.click();
        expect(globalSearch.getItems().count()).toBe(1);
    });

    it('can search by byline field', function () {
        globalSearch.openFilterPanel();
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.openParameters();
        var bylineTextbox = element(by.id('search-byline'));
        bylineTextbox.clear();
        bylineTextbox.sendKeys('Billy The Fish');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
    });

    it('can search by slugline', function () {
        globalSearch.openFilterPanel();
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.openParameters();
        var bylineTextbox = element(by.id('search-slugline'));
        bylineTextbox.clear();
        bylineTextbox.sendKeys('one/two');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
    });

    it('can search by slugline with parenthesis and clear by tag', function () {
        globalSearch.openFilterPanel();
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.openParameters();
        var bylineTextbox = element(by.id('search-slugline'));
        bylineTextbox.clear();
        bylineTextbox.sendKeys('(one/two)');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        expect(element.all(by.repeater('parameter in tags.selectedParameters')).count()).toBe(1);
        element(by.css('.icon-close-small.icon-white')).click();
        expect(globalSearch.getItems().count()).toBe(14);
    });

    it('can search by original creator', function () {
        globalSearch.openFilterPanel();
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.openParameters();
        globalSearch.selectCreator('search-creator', 'first name last name');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(10);
    });

    it('can search by genre field', function () {
        globalSearch.openFilterPanel();
        expect(globalSearch.getItems().count()).toBe(14);
        expect(globalSearch.getGenreElements().count()).toBe(2);
        var genre = globalSearch.getGenreElementByIndex(0);
        genre.click();
        expect(globalSearch.getItems().count()).toBe(9);
    });

    it('search by from desk field', function() {
        monitoring.openMonitoring();
        monitoring.switchToDesk('SPORTS DESK').then(authoring.createTextItem());
        authoring.writeTextToHeadline('From-Sports-To-Politics');
        authoring.writeText('This is Body');
        authoring.writeTextToAbstract('This is Abstract');
        authoring.save();
        authoring.sendTo('Politic Desk');
        authoring.confirmSendTo();
        monitoring.switchToDesk('POLITIC DESK');
        expect(monitoring.getTextItem(1, 0)).toBe('From-Sports-To-Politics');

        globalSearch.openGlobalSearch();
        globalSearch.setListView();
        expect(globalSearch.getItems().count()).toBe(15);
        globalSearch.openFilterPanel();
        globalSearch.openParameters();

        globalSearch.selectDesk('from-desk', 'Sports Desk');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        expect(globalSearch.getHeadlineElement(0).getText()).toBe('From-Sports-To-Politics');

        globalSearch.selectDesk('to-desk', 'Politic Desk');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        expect(globalSearch.getHeadlineElement(0).getText()).toBe('From-Sports-To-Politics');

        globalSearch.selectDesk('from-desk', '');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        expect(globalSearch.getHeadlineElement(0).getText()).toBe('From-Sports-To-Politics');

        globalSearch.selectDesk('to-desk', '');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(15);
    });

    it('can dynamically update items in related tab when item duplicated', function() {
        expect(globalSearch.getItems().count()).toBe(14);

        globalSearch.actionOnItem('Duplicate', 0);
        globalSearch.itemClick(0);
        monitoring.tabAction('related');
        expect(globalSearch.getRelatedItems().count()).toBe(1);

        globalSearch.actionOnItem('Duplicate', 0);
        globalSearch.itemClick(0);
        monitoring.tabAction('related');
        expect(globalSearch.getRelatedItems().count()).toBe(2);
    });

    it('can disable when no repo is selected and enable if at lease one repo is selected', function () {
        globalSearch.openFilterPanel();
        globalSearch.openParameters();

        globalSearch.ingestRepo.click();
        globalSearch.archiveRepo.click();
        globalSearch.publishedRepo.click();
        globalSearch.archivedRepo.click();

        expect(globalSearch.goButton.isEnabled()).toBe(false);

        globalSearch.ingestRepo.click();
        expect(globalSearch.goButton.isEnabled()).toBe(true);
    });

    it('can avoid opening item\'s preview on an item action', function() {
        expect(globalSearch.getItems().count()).toBe(14);

        var previewPane = element(by.id('item-preview'));
        expect(previewPane.isPresent()).toBe(false);

        globalSearch.actionOnItem('Edit', 2);
        expect(previewPane.isPresent()).toBe(false);    // avoids opening preview
    });

    it('can avoid retaining item\'s preview on an item action', function() {
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.itemClick(2);

        var previewPane = element(by.id('item-preview'));
        expect(previewPane.isPresent()).toBe(true);

        globalSearch.actionOnItem('Edit', 2);
        expect(previewPane.isPresent()).toBe(false);    // avoids retaining already opened preview
    });

    xit('can avoid opening item\'s preview (stops event propagation) on keyboard operations from text editor',
        function() {
        expect(globalSearch.getItems().count()).toBe(14);

        var previewPane = element(by.id('item-preview'));
        expect(previewPane.isPresent()).toBe(false);

        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        expect(previewPane.isPresent()).toBe(true); // DOWN arrow key selects an item and opens preview pane

        // now proceed to perform keyboard operation on text editor
        globalSearch.actionOnItem('Edit', 2);
        expect(authoring.getBodyText()).toBe('item5 text');

        authoring.focusBodyHtmlElement();

        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.actions().sendKeys('additional text').perform();
        expect(previewPane.isPresent()).toBe(false);    // ENTER key avoided for opening preview

        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        expect(authoring.getBodyText()).toContain('additional text');
        expect(previewPane.isPresent()).toBe(false);    // DOWN arrow key avoided for opening preview

        browser.actions().sendKeys(protractor.Key.UP).perform();
        expect(previewPane.isPresent()).toBe(false);    // UP arrow key avoided for opening preview

        // it should not effect global keyboard shortcuts (e.g: 'ctrl+d', 'ctrl+shift+d')
        // now test 'ctrl+shift+d' shortcut that triggers spell checker when not set to automatic
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeTruthy();
        authoring.toggleAutoSpellCheck();
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeFalsy();

        authoring.focusBodyHtmlElement();
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.actions().sendKeys('Testhilite').perform();
        expect(authoring.getBodyText()).toContain('Testhilite');
        expect(authoring.getBodyInnerHtml()).not.toContain('sderror sdhilite');

        // trigger spell checker via keyboard operation
        browser.actions().sendKeys(protractor.Key.chord(protractor.Key.CONTROL, protractor.Key.SHIFT, 'd')).perform();
        expect(authoring.getBodyText()).toContain('Testhilite');
        expect(authoring.getBodyInnerHtml()).toContain('sderror sdhilite');

        // now test 'ctrl+0' shortcut that triggers story search dialog box
        browser.actions().sendKeys(protractor.Key.chord(protractor.Key.CONTROL, '0')).perform();
        browser.sleep(200);
        var storyNameEl = element(by.model('meta.unique_name'));
        expect(storyNameEl.isDisplayed()).toBe(true);
    });

    it('can display embargo item when set', function() {
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.actionOnItem('Edit', 4);
        authoring.sendToButton.click();
        authoring.setEmbargo();
        authoring.sendToButton.click();
        authoring.save();
        authoring.close();
        expect(globalSearch.getItem(0).element(by.className('state_embargo')).isDisplayed()).toBe(true);
        expect(globalSearch.getItem(0).element(by.className('state_embargo')).getText()).toEqual('EMBARGO');
    });
});
