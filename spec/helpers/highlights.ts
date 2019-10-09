/* eslint-disable newline-per-chained-call */

import {element, by, browser} from 'protractor';
import {waitFor, nav} from './utils';
import {el} from 'end-to-end-testing-helpers';
import {multiAction} from './actions';

class Highlights {
    list: any;
    name: any;
    desks: any;
    groups: any;
    btnSave: any;
    get: () => void;
    getRow: (name: any) => any;
    getCount: (index: any) => any;
    add: () => void;
    edit: (name: any) => void;
    remove: (name: any) => void;
    getName: () => any;
    setName: (name: any) => void;
    getHighlightTitle: any;
    getDesk: (name: any) => any;
    toggleDesk: (name: any) => void;
    expectDeskSelection: (name: any, selected: any) => void;
    getGroup: (name: any) => any;
    addGroup: (name: any) => void;
    editGroup: (name: any, newName: any) => void;
    deleteGroup: (name: any) => void;
    getTemplate: any;
    setTemplate: (template: any) => void;
    save: () => void;
    cancel: () => void;
    getHighlights: (elem: any) => any;
    errorUniquenessElement: any;
    errorLimitsElement: any;
    selectHighlight: (elem: any, name: any) => void;
    selectDesk: (elem: any, name: any) => void;
    createHighlightsPackage: (highlight: any) => void;
    exportHighlights: () => void;
    exportHighlightsConfirm: () => void;
    saveTextHighlightsConfirm: () => void;
    multiMarkHighlight: (name: any) => void;

    constructor() {
        this.list = element.all(by.repeater('config in configurations._items'));
        this.name = element(by.model('configEdit.name'));
        this.desks = element.all(by.repeater('desk in assignedDesks'));
        this.groups = element.all(by.repeater('group in configEdit.groups'));
        this.btnSave = element(by.css('[ng-click="save()"]'));

        this.get = function() {
            nav('/settings/highlights');
        };

        this.getRow = function(name) {
            return this.list.filter((elem, index) =>
                elem.element(by.binding('config.name'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        this.getCount = function(index) {
            return this.list.count();
        };

        this.add = function() {
            element(by.className('icon-plus-sign')).click();
            browser.sleep(500);
        };

        this.edit = function(name) {
            this.getRow(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-pencil')).click();
                browser.sleep(500);
            });
        };

        this.remove = function(name) {
            this.getRow(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-trash')).click();
                browser.sleep(500);
                element(by.buttonText('OK')).click();
            });
        };

        this.getName = function() {
            return this.name.getText();
        };

        this.setName = function(name) {
            this.name.clear();
            this.name.sendKeys(name);
        };

        this.getHighlightTitle = function() {
            return element.all(by.css('[ng-if="type === \'highlights\'"]')).get(0).getText();
        };

        this.getDesk = function(name) {
            return this.desks.filter((elem, index) =>
                elem.element(by.binding('desk.name'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        this.toggleDesk = function(name) {
            this.getDesk(name).then((desks) => {
                desks[0].element(by.className('sd-checkbox')).click();
            });
        };

        this.expectDeskSelection = function(name, selected) {
            this.getDesk(name).then((desks) => {
                if (selected) {
                    expect(desks[0].element(by.className('sd-checkbox')).getAttribute('checked')).toBe('true');
                } else {
                    expect(desks[0].element(by.className('sd-checkbox')).getAttribute('checked')).toBe(null);
                }
            });
        };

        this.getGroup = function(name) {
            return this.groups.filter((elem, index) =>
                elem.element(by.binding('group'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        this.addGroup = function(name) {
            element(by.css('[ng-click="editGroup(\'\'); selectedGroup = null"]')).click();
            element(by.id('insert-group')).sendKeys(name);
            element(by.css('[ng-click="saveGroup()"]')).click();
        };

        this.editGroup = function(name, newName) {
            this.getGroup(name).click();
            this.getGroup(name).then((groups) => {
                groups[0].element(by.css('[ng-click="editGroup(group)"]')).click();
            });
            element(by.id('edit-group')).clear();
            element(by.id('edit-group')).sendKeys(newName);
            element(by.css('[ng-click="saveGroup()"]')).click();
        };

        this.deleteGroup = function(name) {
            this.getGroup(name).click();
            this.getGroup(name).then((groups) => {
                groups[0].element(by.css('[ng-click="removeGroup(group)"]')).click();
            });
        };

        /**
         * Get the current set template for highlight
         *
         * @return {string} template
         */
        this.getTemplate = function() {
            return element(by.id('template')).$('option:checked').getText();
        };

        /**
         * Set the current template for highlight
         *
         * @param {string} template
         */
        this.setTemplate = function(template) {
            element(by.id('template')).click();
            browser.sleep(300);
            element(by.id('template')).element(by.id(template)).click();
        };

        this.save = function() {
            this.btnSave.click();
        };

        this.cancel = function() {
            element(by.css('[ng-click="cancel()"]')).click();
        };

        this.getHighlights = function(elem) {
            return elem.all(by.repeater('h in highlights track by h._id'))
                .filter((highlight, index) => highlight.getText().then((text) => text));
        };

        this.errorUniquenessElement = function() {
            return element.all(by.css('[ng-show="_errorUniqueness"]'));
        };

        this.errorLimitsElement = function() {
            return element.all(by.css('[ng-show="_errorLimits"]')).first();
        };

        this.selectHighlight = function(elem, name) {
            elem.all(by.repeater('h in highlights')).all(by.partialButtonText(name)).click();
        };

        this.selectDesk = function(elem, name) {
            elem.all(by.className('dropdown__menu--submenu-left')).all(by.partialButtonText(name)).click();
        };

        this.createHighlightsPackage = function(highlight) {
            element(by.className('big-icon--marked-star')).click();
            this.selectHighlight(element(by.id('highlightPackage')), highlight);
            element(by.id('create')).click();
        };

        this.exportHighlights = function() {
            element(by.id('export')).click();
        };

        this.exportHighlightsConfirm = function() {
            var btn = element(by.className('modal__footer')).element(by.buttonText('OK'));

            waitFor(btn, 500);
            btn.click();
        };

        this.saveTextHighlightsConfirm = function() {
            var btn = element(by.className('modal__footer')).element(by.buttonText('Save'));

            waitFor(btn, 500);
            btn.click();
        };

        this.multiMarkHighlight = function(name) {
            multiAction('Add to highlight');
            el(['multiple-highlights-select', 'input-select-multiple'], by.cssContainingText('option', name)).click();
            el(['multiple-highlights-select', 'confirm']).click();
        };
    }
}

export const highlights = new Highlights();
