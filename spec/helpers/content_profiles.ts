/* eslint-disable newline-per-chained-call */

import {element, by, ElementFinder, browser, ElementArrayFinder} from 'protractor';
import {nav} from './utils';

class ContentProfiles {
    list: any;
    openContentProfileSettings: () => void;
    add: () => void;
    addNew: (name: any) => void;
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
    openContentProfileDropdown: () => void;
    selectContentProfile: () => void;
    removeFilter: () => void;
    clearFilters: () => void;
    totalProfiles: () => ElementArrayFinder;

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

        this.addNew = (name) => {
            this.add();
            this.getNameElement().sendKeys(name);
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
            const requiredCheckbox = element(by.cssContainingText('.title', fieldName))
                .element(by.xpath('..'))
                .element(by.xpath('..'))
                .element(by.model('model.schema[id].required'));

            requiredCheckbox.click();
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
            element.all(by.className('dropdown--add-more'))
                .filter((el) => el.isDisplayed())
                .first()
                .element(by.tagName('button')).click();
        };

        /**
         * Open content profile dropdown.
        */
        this.openContentProfileDropdown = () => {
            element(by.id('content-profile-dropdown')).click();
        };

        function selectProfile(filtered) {
            if (filtered.length) {
                return filtered[1].click();
            }
        }

        /**
         * Returns the list of content profiles.
        */
        this.totalProfiles = () => {
            const dropdownMenu = element(by.id('select-content-profile'));

            return dropdownMenu.all(by.repeater('profile in aggregate.activeProfiles'));
        };

        /**
         * Select a content profile from dropdown.
        */
        this.selectContentProfile = () => {
            this.totalProfiles().then(selectProfile);
        };

        /**
         * Remove a content profile filter.
        */
        this.removeFilter = () => {
            element(by.className('tag-label__remove')).click();
        };

        /**
         * Removes all the content profile filter.
        */
        this.clearFilters = () => {
            element(by.id('clearFilters')).click();
        };
    }
}

export const contentProfiles = new ContentProfiles();
