'use strict';

var monitoring = require('./helpers/monitoring'),
    authoring = require('./helpers/authoring'),
    ctrlKey = require('./helpers/utils').ctrlKey,
    commandKey = require('./helpers/utils').commandKey,
    ctrlShiftKey = require('./helpers/utils').ctrlShiftKey,
    assertToastMsg = require('./helpers/utils').assertToastMsg,
    openUrl = require('./helpers/utils').open,
    dictionaries = require('./helpers/dictionaries'),
    workspace = require('./helpers/workspace');

describe('authoring', function() {

    beforeEach(function() {
        monitoring.openMonitoring();
    });

    it('add an embed and respect the order', function() {
        // try with same block content
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.cleanBodyHtmlElement();
        authoring.writeText('line\n');
        authoring.addEmbed('embed');
        var thirdBlockContext = element(by.model('item.body_html')).all(by.repeater('block in vm.blocks')) .get(2);
        thirdBlockContext.element(by.css('.editor-type-html')).sendKeys('line\n');
        authoring.addEmbed('embed', thirdBlockContext);
        authoring.blockContains(0, 'line');
        authoring.blockContains(1, 'embed');
        authoring.blockContains(2, 'line');
        authoring.blockContains(3, 'embed');
        authoring.close();
        authoring.ignore();
        // with different block content
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.cleanBodyHtmlElement();
        function generateLines(from, to) {
            var lines = '';
            for (var i = from; i < to; i++) {
                lines += 'line ' + i + '\n';
            }
            return lines;
        }
        var body1 = generateLines(0, 8);
        var body2 = generateLines(8, 15);
        var body3 = generateLines(15, 20);
        authoring.writeText(body1 + body2 + body3);
        for (var i = 0; i < 5; i++) {
            authoring.writeText(protractor.Key.UP);
        }
        authoring.writeText(protractor.Key.ENTER);
        authoring.writeText(protractor.Key.UP);
        authoring.addEmbed('Embed at position 15');
        authoring.blockContains(0, (body1 + body2).replace(/\n$/, ''));
        authoring.blockContains(2, body3.replace(/\n$/, ''));
        element(by.model('item.body_html')).all(by.css('.editor-type-html')).get(0).click();
        authoring.writeText(protractor.Key.ENTER);
        authoring.addEmbed('Embed at position 8');
        authoring.blockContains(0, body1.replace(/\n$/, ''));
        authoring.blockContains(2, body2.replace(/\n$/, ''));
        authoring.blockContains(4, body3.replace(/\n$/, ''));
    });

    it('authoring operations', function() {
        //undo and redo operations by using CTRL+Z and CTRL+y ...
        // ... from a new item
        authoring.createTextItem();
        browser.sleep(1000);
        authoring.writeText('to be undone');
        expect(authoring.getBodyText()).toBe('to be undone');
        browser.sleep(1000);
        ctrlKey('z');
        expect(authoring.getBodyText()).toBe('');
        ctrlKey('y');
        expect(authoring.getBodyText()).toBe('to be undone');
        authoring.writeText(protractor.Key.ENTER);
        authoring.writeText(protractor.Key.UP);
        authoring.addEmbed('Embed');
        authoring.blockContains(1, 'Embed');
        authoring.blockContains(2, 'to be undone');
        commandKey('z');
        authoring.blockContains(0, 'to be undone');
        commandKey('y');
        authoring.blockContains(1, 'Embed');
        authoring.blockContains(2, 'to be undone');
        authoring.cutBlock(1);
        authoring.blockContains(0, 'to be undone');
        ctrlKey('z');
        authoring.blockContains(1, 'Embed');
        authoring.blockContains(2, 'to be undone');
        authoring.close();
        authoring.ignore();
        // ... from an existing item
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        expect(authoring.getBodyText()).toBe('item5 text');
        authoring.writeText('Two');
        expect(authoring.getBodyText()).toBe('Twoitem5 text');
        authoring.writeText('Words');
        expect(authoring.getBodyText()).toBe('TwoWordsitem5 text');
        ctrlKey('z');
        expect(authoring.getBodyText()).toBe('Twoitem5 text');
        ctrlKey('y');
        expect(authoring.getBodyText()).toBe('TwoWordsitem5 text');
        authoring.save();
        authoring.close();

        //allows to create a new empty package
        monitoring.createItemAction('create_package');
        expect(element(by.className('packaging-screen')).isDisplayed()).toBe(true);
        authoring.close();

        //can edit packages in which the item was linked
        expect(monitoring.getTextItem(2, 1)).toBe('item9');
        monitoring.actionOnItem('Edit', 2, 1);
        authoring.showPackages();
        expect(authoring.getPackages().count()).toBe(1);
        expect(authoring.getPackage(0).getText()).toMatch('PACKAGE2');
        authoring.getPackage(0).element(by.tagName('a')).click();
        authoring.showInfo();
        expect(authoring.getGUID().getText()).toMatch('package2');
        authoring.close();

        //can change normal theme
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.changeNormalTheme('dark-theme');
        expect(monitoring.hasClass(element(by.className('main-article')), 'dark-theme')).toBe(true);
        authoring.close();

        //can change proofread theme
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.changeProofreadTheme('dark-theme-mono');
        expect(monitoring.hasClass(element(by.className('main-article')), 'dark-theme-mono')).toBe(true);
        authoring.close();

        //publish & kill item
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();

        monitoring.filterAction('text');
        monitoring.actionOnItem('Kill item', 5, 0);
        authoring.sendToButton.click();
        expect(authoring.kill_button.isDisplayed()).toBe(true);

        //publish & correct item
        monitoring.openMonitoring();
        // reset filters
        monitoring.filterAction('all');
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Correct item', 5, 0);
        authoring.sendToButton.click();
        expect(authoring.correct_button.isDisplayed()).toBe(true);

        authoring.close();
        expect(monitoring.getTextItem(5, 0)).toBe('item6');
        monitoring.actionOnItem('Open', 5, 0);
        expect(authoring.edit_correct_button.isDisplayed()).toBe(true);
        expect(authoring.edit_kill_button.isDisplayed()).toBe(true);
        authoring.close();
        monitoring.filterAction('all'); // reset filter
        monitoring.filterAction('takesPackage');
        expect(monitoring.getTextItem(5, 0)).toBe('item6');
        monitoring.actionOnItem('Open', 5, 0);
        expect(authoring.edit_correct_button.isDisplayed()).toBe(false);
        expect(authoring.edit_kill_button.isDisplayed()).toBe(false);

        //update(rewrite) item
        monitoring.openMonitoring();
        // reset filters
        monitoring.filterAction('all');
        expect(monitoring.getTextItem(2, 1)).toBe('item7');
        monitoring.actionOnItem('Edit', 2, 1);
        authoring.publish();
        monitoring.filterAction('text');
        expect(monitoring.getTextItem(5, 0)).toBe('item7');
        monitoring.actionOnItem('Open', 5, 0);
        expect(authoring.update_button.isDisplayed()).toBe(true);
        authoring.update_button.click();
        monitoring.filterAction('all');
        expect(monitoring.getTextItem(0, 0)).toBe('item7');
        expect(monitoring.getTextItem(5, 0)).toBe('item7');
    });

    it('authoring history', function() {
        //view item history create-fetch operation
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(1);
        expect(authoring.getHistoryItem(0).getText()).toMatch(/Fetched as \d+ to Politic Desk\/two by.*/);
        authoring.close();

        //view item history move operation
        expect(monitoring.getTextItem(2, 3)).toBe('item8');
        monitoring.actionOnItem('Edit', 2, 3);
        authoring.writeText('Two');
        authoring.save();
        expect(authoring.sendToButton.isDisplayed()).toBe(true);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(2);
        authoring.sendTo('Politic Desk', 'two');
        authoring.confirmSendTo();

        expect(monitoring.getTextItem(3, 0)).toBe('item8');
        monitoring.actionOnItem('Edit', 3, 0);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(3);
        expect(authoring.getHistoryItem(2).getText()).toMatch(/Moved to Politic Desk\/two by .*/);
        authoring.close();

        //view item history editable for newly created unsaved item
        authoring.createTextItem();
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(1);
        expect(authoring.getHistoryItem(0).getText()).toMatch(/Story \d+ (.*) Created by.*/);
        expect(authoring.save_button.isDisplayed()).toBe(true);
        authoring.getHistoryItem(0).click();
        expect(authoring.save_button.isDisplayed()).toBe(true); //expect save button still available
        authoring.close();

        //view item history create-update operations
        authoring.createTextItem();
        authoring.writeTextToHeadline('new item');
        authoring.writeText('some text');
        authoring.save();
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(2);
        expect(authoring.getHistoryItem(0).getText()).toMatch(/Story \d+ (.*) Created by.*/);
        expect(authoring.getHistoryItem(1).getText()).toMatch(/Updated by.*/);
        authoring.save();
        authoring.close();

        //view item history publish operation
        expect(monitoring.getTextItem(3, 3)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 3);
        authoring.addHelpline('Children');
        expect(authoring.getBodyFooter()).toMatch(/Kids Helpline*/);
        expect(authoring.save_button.getAttribute('disabled')).toBe(null);
        authoring.save();
        authoring.publish();
        monitoring.filterAction('takesPackage');
        monitoring.actionOnItem('Open', 5, 0);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(1);
        expect(authoring.getHistoryItem(0).getText()).toMatch(/Published by.*/);
        var transmissionDetails = authoring.showTransmissionDetails(0);
        expect(transmissionDetails.count()).toBe(1);
        transmissionDetails.get(0).click();
        expect(element(by.className('modal-body')).getText()).toMatch(/Kids Helpline*/);
        element(by.css('[ng-click="hideFormattedItem()"]')).click();
        monitoring.filterAction('takesPackage');
        authoring.close();

        //view item history spike-unspike operations
        browser.sleep(5000);
        monitoring.showMonitoring();
        expect(monitoring.getTextItem(2, 2)).toBe('item7');
        monitoring.actionOnItem('Spike', 2, 2);
        monitoring.showSpiked();
        expect(monitoring.getSpikedTextItem(0)).toBe('item7');
        monitoring.unspikeItem(0, 'Politic desk', 'Incoming Stage');
        monitoring.showMonitoring();
        expect(monitoring.getTextItem(1, 0)).toBe('item7');
        monitoring.actionOnItem('Edit', 1, 0);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(3);
        expect(authoring.getHistoryItem(1).getText()).toMatch(/Spiked from Politic Desk\/one by .*/);
        expect(authoring.getHistoryItem(2).getText()).toMatch(/Unspiked to Politic Desk\/Incoming Stage by .*/);
        authoring.close();

        //view item history duplicate operation
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Duplicate', 2, 0);
        expect(monitoring.getTextItem(0, 1)).toBe('item5');
        monitoring.actionOnItem('Edit', 0, 1);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(2);
        expect(authoring.getHistoryItem(1).getText()).toMatch(/Copied to \d+ \(Politic Desk\/Working Stage\) by .*/);
        authoring.close();
    });

    it('keyboard shortcuts', function() {
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.writeText('z');
        element(by.cssContainingText('span', 'Dateline')).click();
        ctrlShiftKey('s');
        browser.wait(function() {
            return element(by.buttonText('Save')).getAttribute('disabled');
        }, 500);
        authoring.close();
        monitoring.actionOnItem('Edit', 2, 0);
        browser.sleep(300);

        expect(authoring.getBodyText()).toBe('zitem5 text');

        element(by.cssContainingText('span', 'Headline')).click();
        ctrlShiftKey('e');
        browser.sleep(300);

        expect(element(by.className('authoring-embedded')).isDisplayed()).toBe(false);
    });

    it('can display monitoring after publishing an item using full view of authoring', function () {
        monitoring.actionOnItem('Edit', 3, 2);
        monitoring.showHideList();

        authoring.publish();
        expect(monitoring.getGroups().count()).toBe(6);
    });

    it('broadcast operation', function() {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Create Broadcast', 5, 0);
        expect(authoring.getHeaderSluglineText()).toContain('item5');
    });

    it('toggle auto spellcheck and hold changes', function() {
        monitoring.actionOnItem('Edit', 2, 1);
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeTruthy();
        authoring.toggleAutoSpellCheck();
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeFalsy();
        authoring.close();
        monitoring.actionOnItem('Edit', 2, 2);
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeFalsy();
    });

    it('spellcheck hilite sentence word for capitalization and ignore the word after abbreviations', function() {
        openUrl('/#/settings/dictionaries');
        dictionaries.edit('Test 1');
        expect(dictionaries.getWordsCount()).toBe(0);
        dictionaries.search('abbrev.');
        dictionaries.saveWord();
        dictionaries.search('abbrev');
        dictionaries.saveWord();
        expect(dictionaries.getWordsCount()).toBe(2);
        dictionaries.save();
        browser.sleep(200);

        monitoring.openMonitoring();

        authoring.createTextItem();
        authoring.writeText('some is a sentence word, but words come after an abbrev. few are not');
        browser.sleep(200);
        expect(authoring.getBodyInnerHtml()).toContain('<span class="sderror sdhilite sdCapitalize" data-word="some" ' +
        'data-index="0" data-sentence-word="true">some</span>');
        expect(authoring.getBodyInnerHtml()).not.toContain('<span class="sderror sdhilite sdCapitalize" ' +
        'data-word="few" data-index="57">few</span>');
        expect(authoring.getBodyInnerHtml()).toContain('<span class="sderror sdhilite" data-word="few" ' +
        'data-index="57">few</span>');
    });

    it('related item widget', function() {
        monitoring.actionOnItem('Duplicate', 2, 1); // duplicate item9 text published item
        monitoring.actionOnItem('Edit', 0, 0);
        authoring.writeTextToHeadline('Duplicate Item 9');
        authoring.save();
        authoring.close();
        monitoring.actionOnItem('Edit', 2, 1);
        expect(authoring.missing_link.getText()).toBe('MISSING LINK');
        authoring.openRelatedItem();
        expect(authoring.getRelatedItems().count()).toBe(1);
        authoring.searchRelatedItems('slugline');
        expect(authoring.getRelatedItems().count()).toBe(0);
        authoring.openRelatedItemConfiguration();
        authoring.setRelatedItemConfigurationSlugline('ANY');
        authoring.setRelatedItemConfigurationLastUpdate('now-48h');
        authoring.saveRelatedItemConfiguration();
        browser.sleep(500);
        expect(authoring.getRelatedItems().count()).toBe(2);
    });

    it('related item widget can open published item', function() {
        expect(monitoring.getGroups().count()).toBe(6);
        expect(monitoring.getTextItem(2, 1)).toBe('item9');
        expect(monitoring.getTextItemBySlugline(2, 1)).toContain('ITEM9 SLUGLINE');
        monitoring.actionOnItem('Edit', 2, 1);
        authoring.publish(); // item9 published

        monitoring.filterAction('text');
        monitoring.actionOnItem('Duplicate', 5, 0); // duplicate item9 text published item
        expect(monitoring.getGroupItems(0).count()).toBe(1);
        monitoring.actionOnItem('Edit', 0, 0);

        authoring.openRelatedItem(); // opens related item widget
        expect(authoring.getRelatedItemBySlugline(0).getText()).toContain('item9 slugline');
        authoring.actionOpenRelatedItem(0); // Open item
        expect(authoring.getHeaderSluglineText()).toContain('item9 slugline');
    });

    it('Kill Template apply', function() {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Kill item', 5, 0);
        browser.sleep(500);
        expect(authoring.getBodyText()).toBe('This is kill template. Slugged item5 slugline one/two.');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');
        authoring.sendToButton.click();
        expect(authoring.kill_button.isDisplayed()).toBe(true);
    });

    it('Emptied body text fails to validate', function() {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.writeText('');
        ctrlShiftKey(protractor.Key.END);
        ctrlKey('x');
        authoring.save();
        authoring.publish(true);
        assertToastMsg('error', 'BODY_HTML empty values not allowed');
    });

    it('keyboard navigation operations on subject dropdown', function() {
        //Open any item in Edit mode
        monitoring.actionOnItem('Edit', 2, 1);

        //Open subject metadata dropdown field
        authoring.getSubjectMetadataDropdownOpened();
        browser.sleep(500); //wait a bit

        //Perform down arrow would focus/active next element in list
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        browser.sleep(200);
        expect(browser.driver.switchTo().activeElement().getText()).toEqual('arts, culture and entertainment');

        //Perform right arrow would navigate to next level of focused category and selected as input term
        browser.actions().sendKeys(protractor.Key.RIGHT).perform();
        var selectedTerm = authoring.getNextLevelSelectedCategory();
        expect(selectedTerm.get(0).getText()).toBe('arts, culture and entertainment');

        //Perform Left arrow key would back to one level up in tree and should be focused/active
        browser.actions().sendKeys(protractor.Key.LEFT).perform();
        browser.sleep(200);
        expect(browser.driver.switchTo().activeElement().getText()).toEqual('arts, culture and entertainment');

        // now type some search term an check if down arrow navigates the search list
        browser.actions().sendKeys('cri').perform();
        browser.sleep(200);
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        expect(browser.driver.switchTo().activeElement().getText()).toEqual('crime, law and justice');
    });

    it('hide multi-edit option when action is kill', function() {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.moreActionsButton.click();
        expect(authoring.multieditButton.isDisplayed()).toBe(true);
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Kill item', 5, 0);
        authoring.moreActionsButton.click();
        expect(authoring.multieditButton.isDisplayed()).toBe(false);
    });

    it('open publish item with footer text without <br> tag', function() {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.addHelpline('Suicide');
        expect(authoring.getBodyFooter()).toMatch(/Readers seeking support and information about suicide*/);
        expect(authoring.save_button.isEnabled()).toBe(true);
        authoring.save();
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Open', 5, 0);
        expect(authoring.getBodyFooterPreview()).not.toContain('<br>');
    });

    it('maintains helpline first option always selected', function() {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.addHelpline('Suicide');
        expect(authoring.getBodyFooter()).toMatch(/Readers seeking support and information about suicide*/);
        expect(authoring.save_button.isEnabled()).toBe(true);
        expect(authoring.getHelplineSelectedOption(0)).toBe('true');    // first option remained selected
        expect(authoring.getHelplineSelectedOption(1)).toBe(null);      // Suicide not remained selected

        //select another helpline
        authoring.addHelpline('Children');
        expect(authoring.getHelplineSelectedOption(0)).toBe('true');    // first option remained selected
        expect(authoring.getHelplineSelectedOption(2)).toBe(null);      // Children not remained selected
    });

    it('Not be able to Ctrl-z to the original, actionable text when killing an item', function() {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        expect(authoring.getHeadlineText()).toBe('item5');  // original, actionable headline text
        expect(authoring.getBodyText()).toBe('item5 text'); // original, actionable body text

        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Kill item', 5, 0);

        // Body:
        // undo without editing body text
        ctrlKey('z');
        expect(authoring.getBodyText()).toBe('This is kill template. Slugged item5 slugline one/two.');

        // now edit body text
        authoring.writeText('Edit kill notice body text:');
        expect(authoring.getBodyText())
            .toBe('Edit kill notice body text:This is kill template. Slugged item5 slugline one/two.');

        // undo edited body text
        ctrlKey('z');
        expect(authoring.getBodyText()).toBe('This is kill template. Slugged item5 slugline one/two.');

        // undo one more time and expect body text not to be the original body text.
        ctrlKey('z');
        expect(authoring.getBodyText()).not.toBe('item5 text');
        expect(authoring.getBodyText()).toBe('This is kill template. Slugged item5 slugline one/two.');

        // Headline:
        // undo without editing headline text
        ctrlKey('z');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');

        // now edit headline text
        authoring.writeTextToHeadline('Edit kill headline:');
        expect(authoring.getHeadlineText()).toBe('Edit kill headline:KILL NOTICE');

        // undo edited headline text
        ctrlKey('z');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');

        // undo one more time and expect headline text not to be the original headline text.
        ctrlKey('z');
        expect(authoring.getHeadlineText()).not.toBe('item5');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');

        authoring.sendToButton.click();
        expect(authoring.kill_button.isDisplayed()).toBe(true);
    });

    it('after undo/redo save last version', function() {
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.cleanBodyHtmlElement();
        browser.sleep(2000);
        authoring.writeText('one\ntwo\nthree');
        browser.sleep(2000); // wait for autosave
        authoring.backspaceBodyHtml(5);
        browser.sleep(2000);
        ctrlKey('z');
        browser.sleep(1000);
        authoring.save();
        authoring.close();
        monitoring.actionOnItem('Edit', 2, 0);
        expect(authoring.getBodyText()).toBe('one\ntwo\nthree');
    });

    it('can send and publish', function() {
        workspace.selectDesk('Sports Desk');
        expect(monitoring.getGroupItems(0).count()).toBe(0);
        expect(monitoring.getGroupItems(1).count()).toBe(0);
        expect(monitoring.getGroupItems(2).count()).toBe(1);
        expect(monitoring.getGroupItems(3).count()).toBe(0);
        expect(monitoring.getGroupItems(4).count()).toBe(1);
        expect(monitoring.getGroupItems(5).count()).toBe(0); // no published content.
        workspace.selectDesk('Politic Desk');
        expect(monitoring.getGroupItems(5).count()).toBe(0); //desk output
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.writeText('Testing');
        authoring.save();
        authoring.sendAndpublish('Sports Desk');
        //desk output count zero as content publish from sport desk
        expect(monitoring.getGroupItems(5).count()).toBe(0);
        workspace.selectDesk('Sports Desk');
        expect(monitoring.getGroupItems(5).count()).toBe(2);
    }, 600000);
});
