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

    function waitForItems(count) {
        return browser.wait(function() {
            return content.getItems().count().then(function(_count) {
                return _count === count;
            });
        }, 500);
    }
    beforeEach(function() {
        workspace.open();
        workspace.createWorkspace('Personal');
    });

    it('can submit item to a desk', function() {
        workspace.editItem(1);
        authoring.sendTo('Sports Desk');
        // modal for the incorrect spelling.
        authoring.confirmSendTo();
        workspace.switchToDesk('SPORTS DESK');
        waitForItems(3);
        expect(getItemState(0)).toBe('SUBMITTED');
    });

    it('warns that there are spelling mistakes', function () {
        workspace.editItem(1);
        authoring.writeText('mispeled word');
        authoring.sendTo('Sports Desk');
        expect(element(by.className('modal-content')).isDisplayed()).toBe(true);
    });

    it('can submit item to a desk although there are spelling mistakes', function () {
        workspace.editItem(1);
        authoring.writeText('mispeled word');
        authoring.sendTo('Sports Desk');

        //Spell check confirmation modal save action
        authoring.confirmSendTo();

        //Unsaved item confirmation modal save action
        authoring.confirmSendTo();

        workspace.switchToDesk('SPORTS DESK');
        waitForItems(3);
        expect(getItemState(0)).toBe('SUBMITTED');
    });

    it('can cancel submit request because there are spelling mistakes', function () {
        workspace.editItem(1);
        authoring.writeText('mispeled word');
        authoring.sendTo('Sports Desk');
        element(by.className('modal-content')).all(by.css('[ng-click="cancel()"]')).click();
        expect(element(by.className('authoring-embedded')).isDisplayed()).toBe(true);
    });

    it('can open send to panel when monitoring list is hidden', function() {
        monitoring.openMonitoring(true);
        workspace.selectDesk('Sports Desk');

        monitoring.openAction(2, 0);
        monitoring.showHideList();
        expect(monitoring.hasClass(element(by.id('main-container')), 'hideMonitoring')).toBe(true);

        authoring.sendToButton.click();
        expect(authoring.sendItemContainer.isDisplayed()).toBe(true);
    });

    it('can display monitoring after submitting an item to a desk using full view of authoring', function() {
        monitoring.openMonitoring(true);
        workspace.selectDesk('Sports Desk');

        monitoring.openAction(2, 0);
        monitoring.showHideList();

        authoring.sendTo('Politic Desk');
        expect(monitoring.getGroups().count()).toBe(6);
    });

    it('can confirm before submitting unsaved item to a desk', function () {
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

    it('can remember last sent destination desk and stage', function() {
        monitoring.openMonitoring(true);
        workspace.selectDesk('Sports Desk');

        monitoring.openAction(2, 0);
        monitoring.showHideList();

        authoring.sendTo('Politic Desk');

        //Spell check confirmation modal save action
        authoring.confirmSendTo();

        expect(monitoring.getGroups().count()).toBe(6);

        //now continue to open new item to see if its remembered?
        monitoring.openAction(4, 0);
        monitoring.showHideList();
        authoring.sendToButton.click();

        var sidebar = element.all(by.css('.slide-pane')).last(),
            dropdown = sidebar.element(by.css('.dropdown--dark .dropdown-toggle')),
            dropdownSelected = dropdown.element(by.css('[ng-show="selectedDesk"]'));

        expect(dropdownSelected.getText()).toEqual('Politic Desk');
    });

    it('can remember last sent destination desk and stage on multi selection sendTo panel', function() {
        monitoring.openMonitoring(true);
        workspace.selectDesk('Politic Desk');

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

        var sidebar = element.all(by.css('.slide-pane')).last(),
            dropdown = sidebar.element(by.css('.dropdown--dark .dropdown-toggle')),
            dropdownSelected = dropdown.element(by.css('[ng-show="selectedDesk"]'));

        expect(dropdownSelected.getText()).toEqual('Sports Desk'); // desk remembered

        var btnStage = element(by.buttonText('Working Stage'));
        expect(btnStage.getAttribute('class')).toContain('active'); // stage remembered
    });

});
