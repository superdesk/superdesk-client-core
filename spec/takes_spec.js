'use strict';

var authoring = require('./helpers/authoring'),
    monitoring = require('./helpers/monitoring'),
    assertToastMsg = require('./helpers/utils').assertToastMsg;

describe('takes', function() {

    beforeEach(function() {
        monitoring.openMonitoring();
    });

    it('performs send and continue and reopens scenarios', function() {
        /*
        * Scenario: Send and Continue
        */
        authoring.createTextItem();
        authoring.setHeaderSluglineText('takes slugline');

        authoring.setCategoryBtn.click(); // opens category dropdown
        authoring.getCategoryListItems.get(0).click(); // select first category

        authoring.setHeaderEdNoteText('takes ednote');

        authoring.writeTextToHeadline('takes send and continue');
        authoring.save();

        authoring.sendToAndContinue('Politic Desk', 'Incoming Stage', true);

        expect(monitoring.getTextItem(1, 0)).toBe('takes send and continue');
        expect(authoring.getANPATakeKeyValue()).toBe('=2');
        // expect fields are copied to 2nd take
        expect(authoring.getHeaderSluglineText()).toBe('takes slugline');
        expect(authoring.getSelectedCategories().count()).toBe(1);
        expect(authoring.getHeaderEdNoteText()).toBe('takes ednote');
        expect(authoring.getHeadlineText()).toBe('takes send and continue');

        // expect spike action should NOT be available for 1st story
        expect(monitoring.getMenuActionElement('Spike', 1, 0).isPresent()).toBeFalsy();

        // fill rest of fields in order to publish attempt on 2nd take
        authoring.getSubjectMetadataDropdownOpened();
        browser.sleep(100);
        browser.actions().sendKeys('archaeology').perform();
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        browser.actions().sendKeys(protractor.Key.ENTER).perform(); // selects subject term

        authoring.writeTextToAbstract('takes abstract');
        authoring.writeTextToByline('adm');
        authoring.setlocation('Sydney');
        authoring.writeText('takes body text');
        authoring.publish();

        assertToastMsg('error', 'PublishQueueError Error 9007 - Previous take is either not published or killed');
        authoring.close();

        // expect spike action should be available for 2nd story
        expect(monitoring.getMenuActionElement('Spike', 0, 0).isPresent()).toBeTruthy();

        /*
        * Scenario: Reopens
        */
        // switch to SPORTS desk and create an item for reopening (new take on publish item) scenario
        monitoring.switchToDesk('SPORTS DESK').then(authoring.createTextItem());

        // Fill header fields
        expect(authoring.getItemSource()).toBe('aap');
        authoring.setHeaderSluglineText('reopens slugline');

        authoring.getGenreDropdown().click();
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        expect(authoring.getGenreDropdown().first().getText()).toBe('Article (news)');

        authoring.getCategoryMetadataDropdownOpened();
        browser.sleep(100);
        browser.actions().sendKeys('finance').perform();
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        browser.actions().sendKeys(protractor.Key.ENTER).perform(); // selects finance category
        browser.sleep(50);
        expect(authoring.getSelectedCategories().first().getText()).toBe('Finance');

        authoring.getSubjectMetadataDropdownOpened();
        browser.sleep(100);
        browser.actions().sendKeys('campaign finance').perform();
        browser.actions().sendKeys(protractor.Key.DOWN).perform();
        browser.actions().sendKeys(protractor.Key.ENTER).perform(); // selects subject term
        expect(authoring.getSelectedSubjects().first().getText()).toBe('campaign finance');

        authoring.setHeaderEdNoteText('reopens ednote');

        // Fill article fields
        authoring.writeTextToHeadline('Reopening Headline');
        authoring.writeTextToAbstract('This is Abstract');
        authoring.writeTextToByline('adm');
        authoring.setlocation('Sydney');
        authoring.writeText('This is Body');

        // Fill metadata fields
        authoring.showInfo();
        authoring.toggleLegal();
        authoring.setKeywords('FINANCE');
        expect(authoring.getKeywords()).toBe('FINANCE');
        expect(authoring.getPubStatus()).toBe('usable');

        authoring.save();
        authoring.publish();

        monitoring.filterAction('text');
        expect(monitoring.getTextItem(5, 0)).toBe('Reopening Headline');
        monitoring.actionOnItem('New Take', 5, 0);

        expect(monitoring.getTextItem(0, 0)).toBe('Reopening Headline');
        // verify fields are copied in new take
        expect(authoring.getItemSource()).toBe('aap');
        expect(authoring.getHeaderSluglineText()).toBe('reopens slugline');
        expect(authoring.getGenreDropdown().first().getText()).toBe('Article (news)');
        expect(authoring.getANPATakeKeyValue()).toContain('reopens');
        expect(authoring.getSelectedCategories().first().getText()).toBe('Finance');
        expect(authoring.getSelectedSubjects().first().getText()).toBe('campaign finance');
        expect(authoring.getHeaderEdNoteText()).toBe('reopens ednote');
        expect(authoring.getHeadlineText()).toBe('Reopening Headline');
        expect(authoring.getSelectedLocation()).toBe('Sydney');

        authoring.showInfo();
        expect(authoring.marked_for_legal.getAttribute('checked')).toBeTruthy();
        expect(authoring.getKeywords()).toBe('FINANCE');
        expect(authoring.getPubStatus()).toBe('usable');

        // now save the take 2 after filling abstract, byline and body field
        authoring.writeTextToAbstract('reopened take abstract');
        authoring.writeTextToByline('adm');
        authoring.writeText('reopened take body');
        authoring.save();

        // expect New Take action no longer available for original story
        expect(monitoring.getMenuActionElement('New Take', 5, 0).isPresent()).toBeFalsy();
        // correct the original story and publish
        monitoring.actionOnItem('Correct item', 5, 0);
        authoring.writeText('corrections');
        authoring.sendToButton.click();
        authoring.correct_button.click();
        // expect corrected item is in published collection and New Take action should NOT available for this.
        expect(monitoring.getItem(5, 0).element(by.className('state-corrected')).isDisplayed()).toBe(true);
        expect(monitoring.getMenuActionElement('New Take', 5, 0).isPresent()).toBeFalsy();

        // publish take 2
        expect(monitoring.getTextItem(0, 0)).toBe('Reopening Headline');
        monitoring.actionOnItem('Edit', 0, 0);
        authoring.publish();

        expect(monitoring.getItem(5, 0).element(by.className('takekey')).isDisplayed()).toBe(true);
        expect(monitoring.getItem(5, 1).element(by.className('state-corrected')).isDisplayed()).toBe(true);
        expect(monitoring.getMenuActionElement('Kill item', 5, 1).isPresent()).toBeTruthy();
        // kill corrected item
        monitoring.actionOnItem('Kill item', 5, 1);
        authoring.sendToButton.click();
        authoring.kill_button.click();
        // expect that corrected, take 2 story and take package is killed.
        //
        /* TODO(gbbr): Fix assertions below
        monitoring.openSearchBox();
        monitoring.searchInput.sendKeys('killed');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        expect(monitoring.getGroupItems(5).count()).toBe(2);
        expect(monitoring.getCorrectionItems(5).first().isPresent()).toBeTruthy(); // deskoutput stage
        expect(monitoring.getTakeItems(5).first().isPresent()).toBeTruthy();

        // expecting package is killed
        monitoring.filterAction('all'); // clear filters
        monitoring.filterAction('takesPackage');
        expect(monitoring.getGroupItems(5).count()).toBe(1);
        expect(monitoring.getTextItemBySlugline(5, 0)).toBe('REOPENS SLUGLINE');
        */
    });

    it('performs Associate as a take scenario', function() {
        /*
        * Scenario: Associate as a take.
        */
        monitoring.switchToDesk('POLITIC DESK').then(authoring.createTextItem());

        authoring.setHeaderSluglineText('Story1 slugline');
        authoring.setCategoryBtn.click(); // opens category dropdown
        authoring.getCategoryListItems.get(0).click(); // select first category
        authoring.setHeaderEdNoteText('Story1 ednote');
        authoring.writeTextToHeadline('Story1 headline');
        authoring.save();
        authoring.close();

        monitoring.switchToDesk('SPORTS DESK').then(authoring.createTextItem());

        authoring.setHeaderSluglineText('Story2 slugline');
        authoring.setCategoryBtn.click(); // opens category dropdown
        authoring.getCategoryListItems.get(0).click(); // select first category
        authoring.setHeaderEdNoteText('Story2 ednote');
        authoring.writeTextToHeadline('Story2 Headline');
        authoring.save();

        authoring.openRelatedItem(); // opens related item widget
        authoring.searchRelatedItems('Story1');
        browser.sleep(100);
        authoring.actionRelatedItem(0, 'Associate as take');
        browser.sleep(100);
        expect(authoring.getANPATakeKeyValue()).toBe('=2');
        // expect fields are copied to 2nd take
        expect(authoring.getHeaderSluglineText()).toBe('Story1 slugline');
        expect(authoring.getSelectedCategories().count()).toBe(1);
        expect(authoring.getHeaderEdNoteText()).toBe('Story1 ednote');
        expect(authoring.getHeadlineText()).toBe('Story1 headline');
        expect(monitoring.getItem(0, 0).element(by.className('takes')).isDisplayed()).toBe(true);

        monitoring.switchToDesk('POLITIC DESK');
        expect(monitoring.getItem(0, 0).element(by.className('takes')).isDisplayed()).toBe(true);

        monitoring.getItem(0, 0).element(by.className('takes')).click();
        browser.sleep(100);
        expect(authoring.getPackageItems('main').count()).toBe(2);
    });
});
