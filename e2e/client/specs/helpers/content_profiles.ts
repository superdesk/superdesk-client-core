/* eslint-disable newline-per-chained-call */

import {el} from '@superdesk/end-to-end-testing-helpers';
import {element, by, ElementFinder, browser, ExpectedConditions as EC} from 'protractor';
import {nav} from './utils';

const clickButton = (label) => {
    const button = element(by.buttonText(label));

    browser.wait(EC.elementToBeClickable(button), 1000);
    button.click();
};

class ContentProfiles {
    list: any;
    openContentProfileSettings: () => void;
    add: () => void;
    addNew: (name: string, type: 'text' | 'picture') => void;
    getNameElement: () => ElementFinder;
    save: () => void;
    getRow: (name: any) => any;
    edit: (name: any) => void;
    delete: (name: any) => void;
    update: () => void;
    toggleEnable: () => void;
    disableField: (fieldName: any) => void;
    setRequired: (fieldName: any) => void;
    cancel: () => void;
    openAddFieldDropdown: () => void;
    editContentFields: () => void;
    editHeaderFields: () => void;

    constructor() {
        /** List of content profiles on settings page **/
        this.list = element.all(by.repeater('type in ctrl.items'));

        /**
         * Open the content profile settings
         **/
        this.openContentProfileSettings = function() {
            nav('/settings/content-profiles');
        };

        /**
         * Opens the content profile add dialog
         **/
        this.add = function() {
            element(by.id('add-new-content-profile')).click();
        };

        this.addNew = (name, type) => {
            const modal = element(by.className('modal__body'));
            const typeIcon = modal.element(by.className('icon-' + type));

            this.add();
            this.getNameElement().sendKeys(name);
            browser.wait(EC.elementToBeClickable(typeIcon), 1000);
            typeIcon.click();
            this.save();
        };

        /**
         * Get the profile name element
         * @returns {ElementFinder} profile name element
         **/
        this.getNameElement = function() {
            return element(by.model('new.label'));
        };

        /**
         * Saves content profile settings
         **/
        this.save = function() {
            element(by.id('profile-save')).click();
        };

        /**
         * Get a profile item by name on settings list
         * @param {string} name of profile
         * @return {promise} profile element
         **/
        this.getRow = function(name) {
            return this.list.filter((elem, index) =>
                elem.element(by.binding('type.label'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        /**
         * Starts the edit action for named content profile
         * @param {string} name of content profile
         **/
        this.edit = function(name) {
            this.getRow(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-dots-vertical')).click();
                rows[0].element(by.className('icon-pencil')).click();
                browser.sleep(500);
            });
        };

        /**
         * Starts the delete action for named content profile
         * @param {string} name of content profile
         **/
        this.delete = function(name) {
            this.getRow(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-dots-vertical')).click();
                rows[0].element(by.className('icon-trash')).click();
                element(by.css('[ng-click="ok()"]')).click();
            });
        };

        /**
         * Updates content profile settings
         **/
        this.update = function() {
            element(by.id('profile-update')).click();
        };

        /**
         * Toggles enable button
         **/
        this.toggleEnable = function() {
            element(by.model('editing.form.enabled')).click();
        };

        /**
         * Switches off given field
         * @param {string} name of field
         **/
        this.disableField = function(fieldName) {
            const disableButton = element(by.cssContainingText('.title', fieldName))
                .element(by.xpath('..'))
                .element(by.css('[ng-click="remove(id)"]'));

            disableButton.click();
        };

        /**
         * Makes a given field as required field
         * @param {string} name of field
         **/
        this.setRequired = function(fieldName) {
            const field = element(by.cssContainingText('.sd-list-item', fieldName));
            const saveButton = el(['item-view-edit--save']);
            const requiredLabel = element(by.cssContainingText('.form__row', 'Required')).element(by.tagName('label'));

            browser.actions().mouseMove(field).perform();
            field.click();

            browser.wait(EC.elementToBeClickable(requiredLabel), 1000);
            requiredLabel.click();

            browser.wait(EC.elementToBeClickable(saveButton), 1000);
            saveButton.click();
        };

        /**
         * Cancels content profile pop up
         **/
        this.cancel = function() {
            element(by.css('[ng-click="ctrl.toggleEdit()"]')).click();
        };

        /**
         * Open first add field dropdown
         */
        this.openAddFieldDropdown = () => {
            element.all(by.className('icon-plus-large'))
                .filter((elem) => elem.isDisplayed())
                .first()
                .click();
        };

        this.editContentFields = () => {
            clickButton('Content fields');
        };

        this.editHeaderFields = () => {
            clickButton('Header fields');
        };
    }
}

export const contentProfiles = new ContentProfiles();
