'use strict';

var workspace = require('./helpers/workspace'),
    authoring = require('./helpers/authoring'),
    monitoring = require('./helpers/monitoring'),
    content = require('./helpers/content');

describe('send', function() {

    function getItemState(index) {
        var label = content.getItem(index).element(by.css('.state-label'));
        return label.getText();
    }

    function getSendPanelSelectedDesk() {
        var sidebar = element.all(by.css('.slide-pane')).last(),
            dropdown = sidebar.element(by.css('.dropdown--dark .dropdown-toggle')),
            dropdownSelected = dropdown.element(by.css('[ng-show="selectedDesk"]'));
        return dropdownSelected;
    }

    function waitForItems(count) {
        return browser.wait(function() {
            return content.getItems().count().then(function(_count) {
                return _count === count;
            });
        }, 500);
    }

    fit('can perform send with or without confirmation scenarios', function() {
        // warns that there are spelling mistakes while submitting item to a desk
        workspace.open();
        workspace.editItem(1);
        authoring.writeText('mispeled word');
        authoring.sendTo('Sports Desk');
        expect(element(by.className('modal-content')).isDisplayed()).toBe(true);

        // can cancel submit request because there are spelling mistakes
        element(by.className('modal-content')).all(by.css('[ng-click="cancel()"]')).click();
        expect(element(by.className('authoring-embedded')).isDisplayed()).toBe(true);

        // can submit item to a desk even there are spelling mistakes
        authoring.sendToButton.click();
        // Spell check confirmation modal save action
        authoring.sendTo('Sports Desk');
        browser.sleep(100);

        //Spell check confirmation modal save action
        authoring.confirmSendTo();
        browser.sleep(100);
        //Unsaved item confirmation modal save action
        authoring.confirmSendTo();

        workspace.switchToDesk('SPORTS DESK');
        browser.sleep(500);
        expect(getItemState(0)).toBe('SUBMITTED');

        // can open send to panel when monitoring list is hidden
        monitoring.switchToDesk('POLITIC DESK');
        monitoring.openAction(2, 0);
        monitoring.showHideList();
        expect(monitoring.hasClass(element(by.id('main-container')), 'hideMonitoring')).toBe(true);
        authoring.sendToButton.click();
        expect(authoring.sendItemContainer.isDisplayed()).toBe(true);
        authoring.close();

        // can display monitoring after submitting an item to a desk using full view of authoring
        monitoring.openMonitoring();
        monitoring.switchToDesk('SPORTS DESK');
        monitoring.openAction(2, 0);
        monitoring.showHideList();
        authoring.sendTo('Politic Desk');
        expect(monitoring.getGroups().count()).toBe(6);

        // can remember last sent destination desk and stage
        monitoring.actionOnItem('Edit', 1, 0);
        //monitoring.openAction(1, 0);
        browser.sleep(100);
        authoring.sendTo('Politic Desk', null, true);

        //Spell check confirmation modal save action
        authoring.confirmSendTo();
        expect(monitoring.getGroups().count()).toBe(6);
        
        //now continue to open new item to see if its remembered?
        monitoring.openAction(4, 0);
        authoring.sendToButton.click();

        expect(getSendPanelSelectedDesk().getText()).toEqual('Politic Desk');
        authoring.close();

        //can remember last sent destination desk and stage on multi selection sendTo panel
        monitoring.switchToDesk('POLITIC DESK');

        monitoring.selectItem(2, 0);
        monitoring.expectIsChecked(2, 0);

        monitoring.selectItem(2, 1);
        monitoring.expectIsChecked(2, 1);

        monitoring.openSendMenu();
        authoring.sendTo('Sports Desk', 'Working Stage');

        //now continue to open new multi selected items' SendTo panel to see if last destination remembered?
        monitoring.selectItem(3, 0);
        monitoring.expectIsChecked(3, 0);

        //open sendTo panel
        monitoring.openSendMenu();

        expect(getSendPanelSelectedDesk().getText()).toEqual('Sports Desk'); // desk remembered

        var btnStage = element(by.buttonText('Working Stage'));
        expect(btnStage.getAttribute('class')).toContain('active'); // stage remembered
    });

    fit('can confirm before submitting unsaved item to a desk', function () {
        workspace.openPersonal();
        workspace.editItem(1);
        //Skip spell check
        authoring.toggleAutoSpellCheck();
        expect(element(by.model('spellcheckMenu.isAuto')).getAttribute('checked')).toBeFalsy();

        authoring.writeText('Text, that not saved yet');
        authoring.sendTo('Sports Desk', null, true);

        //Spell check confirmation modal save action
        authoring.confirmSendTo();

        //Unsaved item confirmation modal save action
        authoring.confirmSendTo();

        workspace.switchToDesk('SPORTS DESK');
        waitForItems(3);
        expect(getItemState(0)).toBe('SUBMITTED');
    });

});
