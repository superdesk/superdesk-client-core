/* eslint-disable newline-per-chained-call */

import {element, by, protractor, browser} from 'protractor';
import {
    ctrlKey,
    commandKey,
    ctrlShiftKey,
    assertToastMsg,
    assertToastMsgNotDisplayed,
    waitForToastMsgDissapear,
    nav,
} from './helpers/utils';
import {monitoring} from './helpers/monitoring';
import {dictionaries} from './helpers/dictionaries';
import {workspace} from './helpers/workspace';
import {authoring} from './helpers/authoring';

import {el, ECE, els, hover, selectFilesForUpload} from 'end-to-end-testing-helpers';

function uploadMedia(imageName) {
    el(['media-gallery--upload-placeholder']).click();

    browser.wait(ECE.presenceOf(el(['image-upload-input'])));
    selectFilesForUpload(el(['image-upload-input']), [imageName]);

    el(['media-metadata-editor', 'field--headline'], by.tagName('[contenteditable]'))
        .sendKeys('image headline');
    el(['media-metadata-editor', 'field--alt_text'], by.tagName('[contenteditable]'))
        .sendKeys('image alt text');
    el(['media-metadata-editor', 'field--description_text'], by.tagName('[contenteditable]'))
        .sendKeys('image description');

    el(['multi-image-edit--start-upload']).click();

    el(['change-image', 'done']).click();
}

describe('authoring', () => {
    beforeEach(() => {
        monitoring.openMonitoring();
    });

    it('add an embed and respect the order', () => {
        // try with same block content
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.cleanBodyHtmlElement();
        authoring.writeText('line\n');
        authoring.addEmbed('embed');
        var thirdBlockContext = element(by.model('item.body_html')).all(by.repeater('block in vm.blocks')).get(2);

        thirdBlockContext.all(by.css('.editor-type-html')).first().sendKeys('line\n');
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

            for (var j = from; j < to; j++) {
                lines += 'line ' + j + '\n';
            }
            return lines;
        }
        var body1 = generateLines(0, 8);
        var body2 = generateLines(8, 15);
        var body3 = generateLines(15, 20);

        authoring.writeText(body1 + body2 + body3);
        authoring.writeText(
            protractor.Key.HOME +
            protractor.Key.UP.repeat(5) +
            protractor.Key.ENTER +
            protractor.Key.UP,
        );

        authoring.addEmbed('Embed at position 15');
        authoring.blockContains(0, (body1 + body2).replace(/\n$/, ''));
        authoring.blockContains(2, body3.replace(/\n$/, ''));
        authoring.writeText(
            protractor.Key.UP.repeat(7) +
            protractor.Key.ENTER,
        );
        authoring.addEmbed('Embed at position 8');
        authoring.blockContains(0, body1.replace(/\n$/, ''));
        authoring.blockContains(2, body2.replace(/\n$/, ''));
        authoring.blockContains(4, body3.replace(/\n$/, ''));
    });

    it('authoring operations', () => {
        // undo and redo operations by using CTRL+Z and CTRL+y ...
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
        authoring.writeText(protractor.Key.HOME + protractor.Key.ENTER + protractor.Key.UP);
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
        authoring.writeText(' Two');
        expect(authoring.getBodyText()).toBe('item5 text Two');
        authoring.writeText(' Words');
        expect(authoring.getBodyText()).toBe('item5 text Two Words');
        ctrlKey('z');
        expect(authoring.getBodyText()).toBe('item5 text Two');
        ctrlKey('y');
        expect(authoring.getBodyText()).toBe('item5 text Two Words');
        authoring.save();
        authoring.close();

        // allows to create a new empty package
        monitoring.createItemAction('create_package');
        expect(element(by.className('packaging-screen')).isDisplayed()).toBe(true);
        authoring.close();

        // can edit packages in which the item was linked
        expect(monitoring.getTextItem(2, 1)).toBe('item9');
        monitoring.actionOnItem('Edit', 2, 1);
        authoring.showPackages();
        expect(authoring.getPackages().count()).toBe(1);
        expect(authoring.getPackage(0).getText()).toContain('package2');
        browser.actions().mouseMove(authoring.getPackage(0)).perform();
        authoring.getPackage(0).element(by.css('[ng-click="openPackage(pitem)"]')).click();
        authoring.showInfo();
        expect(authoring.getGUID().getText()).toMatch('package2');
        authoring.close();

        // can change normal theme
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.changeNormalTheme('sd-editor--theme-blue');
        expect(monitoring.hasClass(element(by.className('main-article')), 'sd-editor--theme-blue')).toBe(true);
        authoring.close();

        // can change proofread theme
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.changeProofreadTheme('sd-editor--theme-dark');
        expect(monitoring.hasClass(element(by.className('main-article')), 'sd-editor--theme-dark')).toBe(true);
        authoring.close();

        // publish & kill item
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();
        browser.sleep(300);

        monitoring.filterAction('text');
        monitoring.actionOnItemSubmenu('Publishing actions', 'Kill item', 5, 0, true);
        expect(authoring.send_kill_button.isDisplayed()).toBeTruthy();
        authoring.cancel();
        browser.sleep(300);

        // publish & correct item
        // reset filters
        monitoring.filterAction('all');
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.publish();
        browser.sleep(300);

        monitoring.filterAction('text');
        monitoring.actionOnItemSubmenu('Publishing actions', 'Correct item', 5, 0, true);
        expect(authoring.send_correction_button.isDisplayed()).toBeTruthy();
        authoring.cancel();

        expect(monitoring.getTextItem(5, 0)).toBe('item6');
        monitoring.actionOnItem('Open', 5, 0);
        expect(authoring.edit_correct_button.isDisplayed()).toBe(true);
        expect(authoring.edit_kill_button.isDisplayed()).toBe(true);
        authoring.close();
        browser.sleep(300);
        monitoring.filterAction('all'); // reset filter

        // update(rewrite) item
        monitoring.openMonitoring();
        // reset filters
        monitoring.filterAction('all');
        expect(monitoring.getTextItem(2, 1)).toBe('item7');
        monitoring.actionOnItem('Edit', 2, 1);
        authoring.publish();
        browser.sleep(300);
        monitoring.filterAction('text');
        expect(monitoring.getTextItem(5, 0)).toBe('item7');
        monitoring.actionOnItem('Open', 5, 0);
        expect(authoring.update_button.isDisplayed()).toBe(true);
        authoring.update_button.click();
        monitoring.compactActionDropdown().click();
        monitoring.filterAction('all');
        expect(monitoring.getTextItem(0, 0)).toBe('item7');
        expect(monitoring.getTextItem(5, 0)).toBe('item7');
    });

    it('authoring history', () => {
        // view item history create-fetch operation
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(1);
        expect(authoring.getHistoryItem(0).getText()).toMatch(/Fetched by first name last name Today/);
        authoring.close();

        // view item history move operation
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
        expect(authoring.getHistoryItem(2).getText()).toMatch(/Moved by first name last name Today/);
        authoring.close();

        // view item history editable for newly created unsaved item
        authoring.createTextItem();
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(1);
        expect(authoring.getHistoryItem(0).getText()).toMatch(/Created by first name last name Today/);
        expect(authoring.save_button.isDisplayed()).toBe(true);
        authoring.getHistoryItem(0).click();
        expect(authoring.save_button.isDisplayed()).toBe(true); // expect save button still available
        authoring.close();

        // view item history create-update operations
        authoring.createTextItem();
        authoring.writeTextToHeadline('new item');
        authoring.writeText('some text');
        authoring.save();
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(2);
        expect(authoring.getHistoryItem(0).getText()).toMatch(/Created by first name last name Today/);
        expect(authoring.getHistoryItem(1).getText()).toMatch(/Updated by.*/);
        authoring.close();

        // view item history publish operation
        expect(monitoring.getTextItem(3, 3)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 3);
        authoring.addHelpline('Children');
        expect(authoring.getBodyFooter()).toMatch(/Kids Helpline*/);
        expect(authoring.save_button.getAttribute('disabled')).toBe(null);
        authoring.save();
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Open', 5, 0);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(3);
        expect(authoring.getHistoryItem(0).getText()).toMatch(/Fetched by.*/);
        expect(authoring.getHistoryItem(1).getText()).toMatch(/Updated by.*/);
        expect(authoring.getHistoryItem(2).getText()).toMatch(/Published by.*/);
        var transmissionDetails = authoring.showTransmissionDetails(2);

        expect(transmissionDetails.count()).toBe(1);
        transmissionDetails.get(0).click();
        expect(element(by.className('modal__body')).getText()).toMatch(/Kids Helpline*/);
        element(by.css('[ng-click="hideFormattedItem()"]')).click();
        monitoring.compactActionDropdown().click();
        monitoring.filterAction('text');
        authoring.close();

        // view item history spike-unspike operations
        browser.sleep(5000);
        monitoring.showMonitoring();
        expect(monitoring.getTextItem(2, 2)).toBe('item7');
        monitoring.actionOnItem('Spike', 2, 2, null, true);
        monitoring.showSpiked();
        expect(monitoring.getSpikedTextItem(0)).toBe('item7');
        monitoring.unspikeItem(0, 'Politic desk', 'Incoming Stage');
        monitoring.showMonitoring();
        expect(monitoring.getTextItem(1, 0)).toBe('item7');
        monitoring.actionOnItem('Edit', 1, 0);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(3);
        expect(authoring.getHistoryItem(1).getText()).toMatch(/Spiked by first name last name Today/);
        expect(authoring.getHistoryItem(2).getText()).toMatch(/Unspiked by first name last name Today/);
        authoring.close();

        // view item history duplicate operation
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate in place', 2, 0, true);
        expect(monitoring.getTextItem(0, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 0, 0);
        authoring.showHistory();
        expect(authoring.getHistoryItems().count()).toBe(2);
        expect(authoring.getHistoryItem(1).getText()).toMatch(/Duplicated by/);
        authoring.close();
    });

    it('keyboard shortcuts', () => {
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.writeText('z');
        element(by.cssContainingText('label', 'Dateline')).click();
        ctrlShiftKey('s');
        browser.wait(() => element(by.buttonText('Save')).getAttribute('disabled'), 500);
        authoring.close();
        monitoring.actionOnItem('Edit', 2, 0);
        browser.sleep(300);

        expect(authoring.getBodyText()).toBe('item5 textz');

        element(by.cssContainingText('label', 'Headline')).click();
        ctrlShiftKey('e');
        browser.sleep(300);

        expect(element.all(by.css('.authoring-embedded .embedded-auth-view')).count()).toBe(0);
    });

    it('can display monitoring after publishing an item using full view of authoring', () => {
        monitoring.actionOnItem('Edit', 3, 2);
        monitoring.showHideList();

        authoring.publish();
        expect(monitoring.getGroups().count()).toBe(6);
    });

    it('broadcast operation', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Create Broadcast', 5, 0);
        expect(authoring.getHeaderSluglineText()).toContain('item5');
    });

    it('can calculate word counts', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.cleanBodyHtmlElement();
        authoring.writeText('There are seven words in this sentence.\n');
        authoring.writeText('There are eight words in this   new sentence.');
        authoring.writeText(protractor.Key.ENTER);
        authoring.writeText(' ');
        authoring.writeText(protractor.Key.ENTER);
        authoring.writeText('There are nine words, in this   final last sentence.\n');
        expect(authoring.getEditorWordCount()).toBe('24 words');
        authoring.save();
        authoring.close();
        expect(monitoring.getMonitoringWordCount('item5')).toBe('24');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.cleanBodyHtmlElement();
        expect(authoring.getEditorWordCount()).toBe('0 words');
        authoring.save();
        authoring.close();
        expect(monitoring.getMonitoringWordCount('item5')).toBe('0');
    });

    it('can update sign off manually', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        expect(authoring.getSignoffText()).toBe('fl');
        authoring.writeSignoffText('ABC');
        authoring.save();
        authoring.close();
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        expect(authoring.getSignoffText()).toBe('ABC');
        authoring.writeText('z');
        authoring.save();
        expect(authoring.getSignoffText()).toBe('ABC/fl');
    });

    it('toggle auto spellcheck and hold changes', () => {
        monitoring.actionOnItem('Edit', 2, 1);
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeTruthy();
        authoring.toggleAutoSpellCheck();
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeFalsy();
        authoring.close();
        monitoring.actionOnItem('Edit', 2, 2);
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeFalsy();
    });

    it('spellcheck hilite sentence word for capitalization and ignore the word after abbreviations', () => {
        nav('/settings/dictionaries');
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

    it('related item widget', () => {
        monitoring.actionOnItem('Edit', 2, 1);
        authoring.writeText('something');
        authoring.save();
        authoring.close();
        authoring.createTextItem();
        browser.sleep(1000);
        authoring.writeText('something');
        authoring.setHeaderSluglineText('item test');
        authoring.save();
        authoring.close();
        authoring.createTextItem();
        browser.sleep(1000);
        authoring.writeText('something');
        authoring.setHeaderSluglineText('item test');
        authoring.save();
        authoring.openRelatedItem();
        authoring.searchRelatedItems();
        expect(authoring.getRelatedItems().count()).toBe(1);
        authoring.searchRelatedItems('slugline');
        expect(authoring.getRelatedItems().count()).toBe(0);
        authoring.openRelatedItemConfiguration();
        authoring.setRelatedItemConfigurationSlugline('ANY');
        authoring.setRelatedItemConfigurationLastUpdate('now-48h');
        authoring.saveRelatedItemConfiguration();
        browser.sleep(1000);
        authoring.searchRelatedItems();
        expect(authoring.getRelatedItems().count()).toBe(1);
    });

    it('related item widget can open published item', () => {
        expect(monitoring.getGroups().count()).toBe(6);
        expect(monitoring.getTextItem(2, 1)).toBe('item9');
        expect(monitoring.getTextItemBySlugline(2, 1)).toContain('ITEM9 SLUGLINE');
        monitoring.actionOnItem('Edit', 2, 1);
        authoring.publish(); // item9 published

        monitoring.filterAction('text');
        // Duplicate item9 text published item
        monitoring.actionOnItemSubmenu('Publishing actions', 'Update', 5, 0, true);
        expect(monitoring.getGroupItems(0).count()).toBe(1);
        monitoring.actionOnItem('Edit', 0, 0);

        authoring.openRelatedItem(); // opens related item widget
        expect(authoring.getRelatedItemSlugline(0)).toContain('ITEM9 SLUGLINE');
        authoring.actionOpenRelatedItem(0); // Open item
        expect(authoring.getHeaderSluglineText()).toContain('item9 slugline');
    });

    it('Kill Template apply', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItemSubmenu('Publishing actions', 'Kill item', 5, 0, true);
        browser.sleep(500);
        expect(authoring.getBodyText()).toBe('This is kill template. Slugged item5 slugline one/two.');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');
        expect(authoring.send_kill_button.isDisplayed()).toBeTruthy();
    });

    it('Emptied body text fails to validate', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.writeText('');
        authoring.writeText(protractor.Key.HOME);
        ctrlShiftKey(protractor.Key.END);
        ctrlKey('x');
        authoring.save();
        authoring.publish(true);
        assertToastMsg('error', 'BODY HTML empty values not allowed');
    });

    it('keyboard navigation operations on subject dropdown', () => {
        // Open any item in Edit mode
        monitoring.actionOnItem('Edit', 2, 1);

        // Open subject metadata dropdown field
        authoring.getSubjectMetadataDropdownOpened();
        browser.sleep(500); // wait a bit

        // Perform down arrow would focus/active next element in list
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        browser.sleep(200);
        expect(browser.driver.switchTo().activeElement().getText()).toEqual('arts, culture and entertainment');

        // Perform right arrow would navigate to next level of focused category and selected as input term
        browser.actions().sendKeys(protractor.Key.RIGHT).perform();
        var selectedTerm = authoring.getNextLevelSelectedCategory();

        expect(selectedTerm.get(0).getText()).toBe('arts, culture and entertainment');

        // Perform Left arrow key would back to one level up in tree and should be focused/active
        browser.actions().sendKeys(protractor.Key.LEFT).perform();
        browser.sleep(200);
        expect(browser.driver.switchTo().activeElement().getText()).toEqual('arts, culture and entertainment');

        // now type some search term an check if down arrow navigates the search list
        browser.actions().sendKeys('cri').perform();
        browser.sleep(200);
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        expect(browser.driver.switchTo().activeElement().getText()).toEqual('crime, law and justice');
    });

    it('hide multi-edit option when action is kill', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.moreActionsButton.click();
        expect(authoring.multieditButton.isDisplayed()).toBe(true);
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItemSubmenu('Publishing actions', 'Kill item', 5, 0, true);
        authoring.moreActionsButton.click();
        expect(authoring.multieditButton.isDisplayed()).toBe(false);
    });

    it('Compare versions operations of an opened article via Compare versions menu option', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);

        // Provide another version on save
        authoring.writeTextToHeadline(' updated');
        authoring.save();
        expect(authoring.getHeadlineText()).toBe('item5 updated');

        // Open selected versions in compare-versions screen boards
        authoring.openCompareVersionsScreen();
        expect(authoring.getCompareVersionsBoards().count()).toBe(2);
        expect(authoring.getArticleHeadlineOfBoard(0)).toEqual('item5 updated');
        expect(authoring.getInnerDropdownItemVersions(1).count()).toBe(1);
        authoring.closeCompareVersionsScreen();

        // expect the article should be open on closing compare-versions screen
        expect(authoring.headline.isDisplayed()).toBe(true);
        expect(authoring.getHeadlineText()).toBe('item5 updated');

        // Update article headline again to get third version
        authoring.writeTextToHeadline(' newly');
        authoring.save();
        expect(authoring.getHeadlineText()).toBe('item5 updated newly');

        authoring.openCompareVersionsScreen();
        expect(authoring.getArticleHeadlineOfBoard(0)).toEqual('item5 updated newly');
        expect(authoring.getInnerDropdownItemVersions(1).count()).toBe(2);
        authoring.openItemVersionInBoard(1, 0);
        expect(authoring.getInnerDropdownItemVersions(0).count()).toBe(1);
        expect(authoring.getHtmlArticleHeadlineOfBoard(0)).toContain(
            '<span>item5 updated</span><ins style="background:#e6ffe6;"> newly</ins>',
        );
        expect(authoring.getArticleHeadlineOfBoard(1)).toEqual('item5 updated');
    });

    it('open publish item with footer text without <br> tag', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.addHelpline('Suicide');
        expect(authoring.getBodyFooter()).toMatch(/Readers seeking support and information about suicide*/);
        expect(authoring.save_button.isEnabled()).toBe(true);
        authoring.save();
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItem('Open', 5, 0);
        expect(element(by.css('#body_footer .medium-editor-element:not(.clone)')).getText()).not.toContain('<br>');
    });

    it('maintains helpline first option always selected', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.addHelpline('Suicide');
        expect(authoring.getBodyFooter()).toMatch(/Readers seeking support and information about suicide*/);
        expect(authoring.save_button.isEnabled()).toBe(true);
        expect(authoring.getHelplineSelectedOption(0)).toBe('true'); // first option remained selected
        expect(authoring.getHelplineSelectedOption(1)).toBe(null); // Suicide not remained selected

        // select another helpline
        authoring.addHelpline('Children');
        expect(authoring.getHelplineSelectedOption(0)).toBe('true'); // first option remained selected
        expect(authoring.getHelplineSelectedOption(2)).toBe(null); // Children not remained selected
    });

    it('Not be able to Ctrl-z to the original, actionable text when killing an item', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        expect(authoring.getHeadlineText()).toBe('item5'); // original, actionable headline text
        expect(authoring.getBodyText()).toBe('item5 text'); // original, actionable body text

        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItemSubmenu('Publishing actions', 'Kill item', 5, 0, true);

        // Body:
        // undo without editing body text
        ctrlKey('z');
        expect(authoring.getBodyText()).toBe('This is kill template. Slugged item5 slugline one/two.');

        // now edit body text
        authoring.writeText(protractor.Key.HOME + 'Edit kill notice body text:');
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
        authoring.writeTextToHeadline(protractor.Key.HOME + 'Edit kill headline:');
        expect(authoring.getHeadlineText()).toBe('Edit kill headline:KILL NOTICE');

        // undo edited headline text
        ctrlKey('z');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');

        // undo one more time and expect headline text not to be the original headline text.
        ctrlKey('z');
        expect(authoring.getHeadlineText()).not.toBe('item5');
        expect(authoring.getHeadlineText()).toBe('KILL NOTICE');

        expect(authoring.send_kill_button.isDisplayed()).toBeTruthy();
    });

    it('after undo/redo save last version', () => {
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

    it('can minimize story while a correction and kill is being written', () => {
        workspace.selectDesk('Politic Desk');
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.publish();
        monitoring.filterAction('text');
        monitoring.actionOnItemSubmenu('Publishing actions', 'Correct item', 5, 0, true); // Edit for correction
        authoring.minimize(); // minimize before publishing the correction
        expect(monitoring.getTextItem(2, 1)).toBe('item9');
        monitoring.actionOnItem('Edit', 2, 1);
        authoring.publish();
        monitoring.actionOnItemSubmenu('Publishing actions', 'Kill item', 5, 0, true); // Edit for kill
        authoring.minimize(); // minimize before publishing the kill
        authoring.maximize('item6');
        expect(authoring.send_correction_button.isDisplayed()).toBeTruthy();

        authoring.maximize('item9');
        expect(authoring.send_kill_button.isDisplayed()).toBeTruthy();
    });

    it('can apply macro', () => {
        workspace.selectDesk('Politic Desk');
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        expect(authoring.getBodyText()).toBe('item6 text');
        expect(authoring.getAbstractText()).toBe('');
        authoring.openMacros();
        authoring.callMacros('Populate Abstract');
        expect(authoring.getAbstractText()).toBe('item6 text');
    });

    it('Not modifying crops will not trigger an article change', () => {
        workspace.selectDesk('XEditor3 Desk'); // has media gallery in content profile
        el(['content-create']).click();
        el(['content-create-dropdown']).element(by.buttonText('editor3 template')).click();
        browser.wait(ECE.visibilityOf(el(['authoring-field--media-gallery', 'media-gallery--upload-placeholder'])));
        expect(ECE.hasElementCount(els(['authoring-field--media-gallery', 'media-gallery-image']), 0)()).toBe(true);

        uploadMedia('image-big.jpg');

        assertToastMsg('success', 'Item updated.');
        waitForToastMsgDissapear('success', 'Item updated.');

        browser.wait(ECE.hasElementCount(els(['authoring-field--media-gallery', 'media-gallery-image']), 1));

        hover(el(['authoring-field--media-gallery', 'media-gallery-image']));
        el(['media-gallery-image--edit']).click();
        el(['done']).click(); // click done without making any changes

        assertToastMsgNotDisplayed('success', 'Item updated.');
        expect(authoring.save_button.isEnabled()).toBe(false);
    });

    it('Can add an image with default crops to media gallery', () => {
        workspace.selectDesk('XEditor3 Desk'); // has media gallery in content profile
        el(['content-create']).click();
        el(['content-create-dropdown']).element(by.buttonText('editor3 template')).click();
        browser.wait(ECE.visibilityOf(el(['authoring-field--media-gallery', 'media-gallery--upload-placeholder'])));
        expect(ECE.hasElementCount(els(['authoring-field--media-gallery', 'media-gallery-image']), 0)()).toBe(true);

        uploadMedia('image-big.jpg');

        browser.wait(ECE.hasElementCount(els(['authoring-field--media-gallery', 'media-gallery-image']), 1));
    });

    it('Can remove an image from media gallery', () => {
        workspace.selectDesk('XEditor3 Desk'); // has media gallery in content profile

        el(['content-create']).click();
        el(['content-create-dropdown']).element(by.buttonText('editor3 template')).click();

        browser.wait(ECE.visibilityOf(el(['authoring-field--media-gallery', 'media-gallery--upload-placeholder'])));
        expect(ECE.hasElementCount(els(['authoring-field--media-gallery', 'media-gallery-image']), 0)()).toBe(true);

        uploadMedia('image-red.jpg');

        browser.wait(ECE.hasElementCount(els(['authoring-field--media-gallery', 'media-gallery-image']), 1));

        hover(el(['authoring-field--media-gallery', 'media-gallery-image']));
        el(['authoring-field--media-gallery', 'media-gallery-image--remove']).click();

        browser.wait(ECE.hasElementCount(els(['authoring-field--media-gallery', 'media-gallery-image']), 0));
    });
});
