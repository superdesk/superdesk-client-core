/* eslint-disable newline-per-chained-call */

import {element, browser, protractor, by} from 'protractor';

import {monitoring} from './helpers/monitoring';
import {globalSearch} from './helpers/search';
import {content} from './helpers/content';
import {authoring} from './helpers/authoring';
import {nav, scrollToView} from './helpers/utils';

describe('search', () => {
    beforeEach(() => {
        nav('/search').then(globalSearch.setListView());
    });

    it('can search by search field', () => {
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.searchInput.click();
        globalSearch.searchInput.clear();
        globalSearch.searchInput.sendKeys('item3');
        var focused = browser.driver.switchTo().activeElement().getAttribute('id');

        expect(globalSearch.searchInput.getAttribute('id')).toEqual(focused);
        element(by.id('search-button')).click();
        expect(globalSearch.getItems().count()).toBe(3);
        globalSearch.openFilterPanel();
        globalSearch.clickClearFilters();

        // can navigate/filter subject field and search by selected subject term
        expect(globalSearch.getItems().count()).toBe(16);
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

        // can search by priority field
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.toggleSearchTabs('filters');
        expect(globalSearch.getPriorityElements().count()).toBe(3);
        var priority = globalSearch.getPriorityElementByIndex(0);

        priority.click();
        expect(globalSearch.getItems().count()).toBe(1);
        globalSearch.clickClearFilters();

        // can search by byline field
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.openParameters();
        var bylineTextbox = element(by.id('search-byline'));

        bylineTextbox.clear();
        bylineTextbox.sendKeys('Billy The Fish');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        globalSearch.clickClearFilters();

        // can search by slugline
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.openParameters();
        bylineTextbox = element(by.id('search-slugline'));
        bylineTextbox.clear();
        bylineTextbox.sendKeys('one/two');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        globalSearch.clickClearFilters();

        // can search by slugline with parenthesis and clear by tag
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.openParameters();
        bylineTextbox = element(by.id('search-slugline'));
        bylineTextbox.clear();
        bylineTextbox.sendKeys('(one/two)');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        expect(element.all(by.repeater('parameter in tags.selectedParameters')).count()).toBe(1);
        element(by.css('.tag-label__remove')).click();
        expect(globalSearch.getItems().count()).toBe(16);

        // can search by original creator
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.openParameters();
        globalSearch.selectCreator('search-creator', 'first name last name');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(12);
        globalSearch.clickClearFilters();

        // can search by ingest provider
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.openParameters();
        globalSearch.selectProvider('search-ingest-provider', 'aap');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(1);
        globalSearch.clickClearFilters();

        // can search by genre field
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.toggleSearchTabs('filters');
        expect(globalSearch.getGenreElements().count()).toBe(2);
        var genre = globalSearch.getGenreElementByIndex(0);

        genre.click();
        expect(globalSearch.getItems().count()).toBe(12);
        globalSearch.clickClearFilters();

        // initialize for search by from desk field and company
        monitoring.openMonitoring();
        monitoring.selectDesk('SPORTS DESK');
        authoring.createTextItem();
        authoring.writeTextToHeadline('From-Sports-To-Politics');
        authoring.writeText('This is Body');
        authoring.writeTextToAbstract('This is Abstract');
        authoring.save();
        authoring.sendTo('Politic Desk');
        authoring.confirmSendTo();
        monitoring.switchToDesk('POLITIC DESK');
        expect(monitoring.getTextItem(1, 0)).toBe('From-Sports-To-Politics');

        // search by from desk field
        globalSearch.openGlobalSearch();
        globalSearch.setListView();
        expect(globalSearch.getItems().count()).toBe(17);
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
        expect(globalSearch.getItems().count()).toBe(17);
    });

    it('can dynamically update items in related tab when item duplicated', () => {
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.actionOnSubmenuItem('Duplicate', 'Duplicate in place', 0, true);
        globalSearch.itemClick(0);
        monitoring.tabAction('related');
        expect(globalSearch.getRelatedItems().count()).toBe(1);
        globalSearch.actionOnSubmenuItem('Duplicate', 'Duplicate in place', 0, true);
        globalSearch.itemClick(0);
        monitoring.tabAction('related');
        expect(globalSearch.getRelatedItems().count()).toBe(2);
        element(by.css('.close-preview')).click();
    });

    it('can search with different repos', () => {
        globalSearch.openParameters();
        globalSearch.ingestRepo.click();
        browser.sleep(200);
        expect(globalSearch.getItems().count()).toBe(15);
        globalSearch.archiveRepo.click();
        browser.sleep(200);
        expect(globalSearch.getItems().count()).toBe(3);
        globalSearch.archivedRepo.click();
        browser.sleep(200);
        expect(globalSearch.getItems().count()).toBe(0);

        // can do a boolean search in the raw panel
        globalSearch.clickClearFilters();
        globalSearch.archiveRepo.click();
        globalSearch.archivedRepo.click();
        globalSearch.openRawSearchTab();
        var rawTextbox = element(by.id('raw-query'));

        rawTextbox.clear();
        rawTextbox.sendKeys('type:text AND (item1 OR item4)');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(3);
        globalSearch.closeFilterPanel();

        // search spiked content
        globalSearch.openGlobalSearch();
        globalSearch.setListView();
        expect(globalSearch.getItems().count()).toBe(16);
        content.actionOnItem('Spike Item', 2, null, true);
        content.actionOnItem('Spike Item', 1, null, true);
        content.actionOnItem('Spike Item', 0, null, true);
        browser.sleep(200);
        expect(globalSearch.getItems().count()).toBe(13);
        globalSearch.openFilterPanel();
        globalSearch.openParameters();
        globalSearch.selectDesk('spike-options', 'Include spiked content');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(16);
        expect(globalSearch.getSelectedTags().count()).toBe(1);
        globalSearch.selectDesk('spike-options', 'Spiked only content');
        globalSearch.goButton.click();
        expect(globalSearch.getItems().count()).toBe(3);
        expect(globalSearch.getSelectedTags().count()).toBe(1);
    });

    it('can action on items', () => {
        // DOWN arrow key selects an item and opens preview pane
        expect(globalSearch.getItems().count()).toBe(16);
        var previewPane = element(by.id('item-preview'));

        expect(previewPane.isPresent()).toBe(false);
        globalSearch.itemClick(2);
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        expect(previewPane.isPresent()).toBe(true);
        // now proceed to perform keyboard operation on text editor
        globalSearch.actionOnItem('Edit', 'item5');
        expect(authoring.getBodyText()).toBe('item5 text');
        authoring.focusBodyHtmlElement();
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.actions().sendKeys('additional text').perform();
        expect(previewPane.isPresent()).toBe(false); // ENTER key avoided for opening preview
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        expect(authoring.getBodyText()).toContain('additional text');
        expect(previewPane.isPresent()).toBe(false); // DOWN arrow key avoided for opening preview
        browser.actions().sendKeys(protractor.Key.UP).perform();
        expect(previewPane.isPresent()).toBe(false); // UP arrow key avoided for opening preview
        // it should not effect global keyboard shortcuts (e.g: 'ctrl+alt+d', 'ctrl+shift+*')
        // now test 'ctrl+shift+*' shortcut that triggers spell checker when not set to automatic
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeTruthy();
        authoring.toggleAutoSpellCheck();
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeFalsy();
        authoring.focusBodyHtmlElement();
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.actions().sendKeys('Testhilite').perform();
        expect(authoring.getBodyText()).toContain('Testhilite');
        expect(authoring.getBodyInnerHtml()).not.toContain('sderror sdhilite');
        // trigger spell checker via keyboard operation
        browser.actions().sendKeys(protractor.Key.chord(protractor.Key.CONTROL, protractor.Key.SHIFT, 'y')).perform();
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
    });

    it('can avoid opening item\'s preview on an item action', () => {
        var previewPane = element(by.id('item-preview'));

        expect(globalSearch.getItems().count()).toBe(16);
        previewPane = element(by.id('item-preview'));
        expect(previewPane.isPresent()).toBe(false);
        globalSearch.actionOnItem('Edit', 'item1');
        expect(previewPane.isPresent()).toBe(false); // avoids opening preview
        authoring.close();

        // can avoid retaining item\'s preview on an item action
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.itemClick(2);
        previewPane = element(by.id('item-preview'));
        expect(previewPane.isPresent()).toBe(true);
        globalSearch.actionOnItem('Edit', 'item2');
        expect(previewPane.isPresent()).toBe(false); // avoids retaining already opened preview
        authoring.close();
    });

    it('can display embargo item when set', () => {
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.actionOnItem('Edit', 'item1');
        authoring.sendToButton.click();
        authoring.setEmbargo();
        authoring.closeSendAndPublish();
        authoring.save();
        authoring.close();
        expect(globalSearch.getItem(0).element(by.className('state_embargo')).isDisplayed()).toBe(true);
        expect(globalSearch.getItem(0).element(by.className('state_embargo')).getText()).toEqual('EMBARGO');
    });

    it('can search scheduled', () => {
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.actionOnItem('Edit', 'item9');
        authoring.schedule(false);
        globalSearch.openFilterPanel();
        globalSearch.openParameters();
        globalSearch.toggleSearchTabs('filters');

        const scheduleFilter = element(by.css('#filter-schedule_settings\\.utc_publish_schedule .toggle-box__header'));

        scrollToView(scheduleFilter);
        scheduleFilter.click();

        var dateScheduled = element(by.css('#filter-schedule_settings\\.utc_publish_schedule-last_24_hours'));

        scrollToView(dateScheduled);
        dateScheduled.click();

        expect(globalSearch.getItems().count()).toBe(1);
        expect(globalSearch.getItem(0).element(by.className('state-scheduled')).isDisplayed()).toBe(true);
        expect(globalSearch.getItem(0).element(by.className('state-scheduled')).getText()).toEqual('SCHEDULED');
        expect(element.all(by.repeater('key in keys')).count()).toBe(1);
        element(by.css('.tag-label__remove')).click();
        expect(globalSearch.getItems().count()).toBe(16);
    });

    it('can search by facet and exclude facet', () => {
        expect(globalSearch.getItems().count()).toBe(16);
        globalSearch.openFilterPanel();
        globalSearch.toggleSearchTabs('filters');
        browser.sleep(200);
        expect(globalSearch.getDeskElements().count()).toBe(2);
        globalSearch.excludeDeskFacet(0);
        expect(globalSearch.getDeskElements().count()).toBe(1);
        expect(globalSearch.getItems().count()).toBe(8);
        expect(globalSearch.getExcludedFacetTags().count()).toBe(1);
        globalSearch.deleteExcludedFacetTagByIndex(0);
        expect(globalSearch.getExcludedFacetTags().count()).toBe(0);
        expect(globalSearch.getDeskElements().count()).toBe(2);
        expect(globalSearch.getItems().count()).toBe(16);
    });
});
