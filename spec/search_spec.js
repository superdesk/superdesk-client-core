
'use strict';

var openUrl = require('./helpers/utils').open,
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
        globalSearch.openFilterPanel();
        globalSearch.clickClearFilters();

        //can navigate/filter subject field and search by selected subject term
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.toggleSearchTabs('parameters');
        globalSearch.toggleSubjectMetadata(); // opens subject drop-down
        browser.sleep(100);
        browser.actions().sendKeys('archa').perform();
        expect(globalSearch.getSubjectFilteredTerm(0)).toBe('archaeology');
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        browser.actions().sendKeys(protractor.Key.ENTER).perform(); // selects subject term
        browser.sleep(200);
        globalSearch.goButton.click();
        // expect selected term in filter pane
        expect(globalSearch.getSelectedSubjectsInFilter().count()).toBe(1);
        // expect selected term in tag list, at top of search list
        expect(globalSearch.getSelectedTags().count()).toBe(1);
        // expect some search result returned
        expect(globalSearch.getItems().count()).toBeGreaterThan(0);
        globalSearch.clickClearFilters();

        //can search by priority field
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.toggleSearchTabs('filters');
        expect(globalSearch.getPriorityElements().count()).toBe(3);
        var priority = globalSearch.getPriorityElementByIndex(0);
        priority.click();
        expect(globalSearch.getItems().count()).toBe(1);
        globalSearch.clickClearFilters();

        //can search by byline field
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.openParameters();
        var bylineTextbox = element(by.id('search-byline'));
        bylineTextbox.clear();
        bylineTextbox.sendKeys('Billy The Fish');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        globalSearch.clickClearFilters();

        //can search by slugline
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.openParameters();
        bylineTextbox = element(by.id('search-slugline'));
        bylineTextbox.clear();
        bylineTextbox.sendKeys('one/two');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        globalSearch.clickClearFilters();

        //can search by slugline with parenthesis and clear by tag
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.openParameters();
        bylineTextbox = element(by.id('search-slugline'));
        bylineTextbox.clear();
        bylineTextbox.sendKeys('(one/two)');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        expect(element.all(by.repeater('parameter in tags.selectedParameters')).count()).toBe(1);
        element(by.css('.icon-close-small.icon-white')).click();
        expect(globalSearch.getItems().count()).toBe(14);

        //can search by original creator
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.openParameters();
        globalSearch.selectCreator('search-creator', 'first name last name');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(10);
        globalSearch.clickClearFilters();

        //can search by genre field
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.toggleSearchTabs('filters');
        expect(globalSearch.getGenreElements().count()).toBe(2);
        var genre = globalSearch.getGenreElementByIndex(0);
        genre.click();
        expect(globalSearch.getItems().count()).toBe(10);
        globalSearch.clickClearFilters();

        //initialize for search by from desk field and company
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

        //search by from desk field
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

        //can dynamically update items in related tab when item duplicated
        expect(globalSearch.getItems().count()).toBe(15);
        globalSearch.actionOnItem('Duplicate', 0);
        globalSearch.itemClick(0);
        monitoring.tabAction('related');
        expect(globalSearch.getRelatedItems().count()).toBe(1);
        globalSearch.actionOnItem('Duplicate', 0);
        globalSearch.itemClick(0);
        monitoring.tabAction('related');
        expect(globalSearch.getRelatedItems().count()).toBe(2);

        //can search with different repos
        globalSearch.openParameters();
        globalSearch.ingestRepo.click();
        browser.sleep(200);
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.archiveRepo.click();
        browser.sleep(200);
        expect(globalSearch.getItems().count()).toBe(3);
        globalSearch.archivedRepo.click();
        browser.sleep(200);
        expect(globalSearch.getItems().count()).toBe(0);
    });

    it('can action on items', function() {
        //DOWN arrow key selects an item and opens preview pane
        expect(globalSearch.getItems().count()).toBe(14);
        var previewPane = element(by.id('item-preview'));
        expect(previewPane.isPresent()).toBe(false);
        globalSearch.itemClick(2);
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        expect(previewPane.isPresent()).toBe(true);
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
        authoring.save();
        authoring.close();
        // now test 'ctrl+0' shortcut that triggers story search dialog box
        browser.actions().sendKeys(protractor.Key.chord(protractor.Key.CONTROL, '0')).perform();
        browser.sleep(200);
        var storyNameEl = element(by.model('meta.unique_name'));
        expect(storyNameEl.isPresent()).toBe(true);
        storyNameEl.click();
        browser.actions().sendKeys('item1-in-archived').perform();
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.sleep(200);
        expect(authoring.getHeaderSluglineText()).toBe('item1 slugline');
        authoring.close();

        //can avoid opening item\'s preview on an item action
        expect(globalSearch.getItems().count()).toBe(14);
        previewPane = element(by.id('item-preview'));
        expect(previewPane.isPresent()).toBe(false);
        globalSearch.actionOnItem('Edit', 2);
        expect(previewPane.isPresent()).toBe(false);    // avoids opening preview
        authoring.save();
        authoring.close();

        //can avoid retaining item\'s preview on an item action
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.itemClick(2);
        previewPane = element(by.id('item-preview'));
        expect(previewPane.isPresent()).toBe(true);
        globalSearch.actionOnItem('Edit', 3);
        expect(previewPane.isPresent()).toBe(false);    // avoids retaining already opened preview
        authoring.save();
        authoring.close();

        //can display embargo item when set
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.actionOnItem('Edit', 4);
        authoring.sendToButton.click();
        authoring.setEmbargo();
        authoring.save();
        authoring.close();
        expect(globalSearch.getItem(0).element(by.className('state_embargo')).isDisplayed()).toBe(true);
        expect(globalSearch.getItem(0).element(by.className('state_embargo')).getText()).toEqual('EMBARGO');

        //can search scheduled
        expect(globalSearch.getItems().count()).toBe(14);
        globalSearch.actionOnItem('Edit', 4);
        authoring.schedule(false);
        globalSearch.openFilterPanel();
        globalSearch.openParameters();
        globalSearch.toggleSearchTabs('filters');
        var scheduleDay = element(by.id('search_scheduled_24h'));
        scheduleDay.click();
        expect(globalSearch.getItems().count()).toBe(2);
        expect(globalSearch.getItem(0).element(by.className('state-scheduled')).isDisplayed()).toBe(true);
        expect(globalSearch.getItem(0).element(by.className('state-scheduled')).getText()).toEqual('SCHEDULED');
        expect(element.all(by.repeater('key in keys')).count()).toBe(1);
        element(by.css('.icon-close-small.icon-white')).click();
        expect(globalSearch.getItems().count()).toBe(15);
    });
});
