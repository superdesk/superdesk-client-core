/* eslint-disable newline-per-chained-call */

import {element, by, browser, protractor} from "protractor";
import {nav} from './utils';

class Desks {
    list: any;
    name: any;
    tabs: any;
    stages: any;
    newDeskBtn: any;
    listedMacros: any;
    openDesksSettings: () => void;
    getRow: (name: any) => any;
    getCount: () => any;
    getStageCount: (name: any) => any;
    edit: (name: any) => void;
    showMonitoringSettings: (name: any) => void;
    remove: (name: any) => void;
    getTab: (name: any) => any;
    showTab: (name: any) => void;
    getStage: (name: any) => any;
    editStage: (name: any) => void;
    removeStage: (name: any) => void;
    save: () => void;
    close: () => void;
    deskNameElement: any;
    deskDescriptionElement: any;
    deskSourceElement: any;
    getDeskType: any;
    setDeskType: (deskType: any) => void;
    actionSaveAndContinueOnGeneralTab: () => void;
    actionDoneOnGeneralTab: () => void;
    actionDoneOnStagesTab: () => void;
    actionSaveAndContinueOnStagesTab: () => void;
    actionSaveAndContinueOnPeopleTab: () => void;
    getNewDeskButton: any;
    getDeskContentExpiryHours: any;
    getDeskContentExpiryMinutes: any;
    setDeskContentExpiry: (hours: any, minutes: any) => void;
    getNewStageButton: any;
    stageNameElement: any;
    stageDescriptionElement: any;
    toggleWorkingStageFlag: () => void;
    toggleGlobalReadFlag: () => void;
    getGlobalReadFlag: any;
    getIncomingFlag: any;
    toggleIncomingStageFlag: () => void;
    confirmStageDeleteButton: (stageName: any) => void;
    saveNewStage: () => void;
    saveEditedStage: () => void;
    getStageMacros: any;
    getStageIncomingMacro: any;
    setStageIncomingMacro: (name: any) => void;
    getStageMovedOntoMacro: any;
    setStageMovedOntoMacro: (name: any) => void;
    getStageOutgoingMacro: any;
    setStageOutgoingMacro: (name: any) => void;
    addUser: (userName: any) => void;

    constructor() {
        /** List of desks on desk settings list **/
        this.list = element.all(by.repeater('desk in desks._items'));
        /** For an item from desks settings list, get his name **/
        this.name = element(by.model('desk.name'));
        /** The list of tabs in desk settings wizard **/
        this.tabs = element.all(by.repeater('step in steps'));
        /** The list of stages from stages tab on desks settings wizard **/
        this.stages = element.all(by.repeater('stage in stages'));

        /** a button for creating a new desk **/
        this.newDeskBtn = element(by.buttonText('Add New'));

        /** the list of macros listed in a desk settings modal **/
        this.listedMacros = element.all(by.repeater('macro in macros'));

        /**
         * Open the desk settings wizard
         **/
        this.openDesksSettings = function() {
            nav('/settings/desks');
        };

        /**
         * Get a desk item by name on desks settings list
         * @param {string} name of desk
         * @return {promise} desk element
         **/
        this.getRow = function(name) {
            return this.list
                .filter((elem, index) =>
                    elem.element(by.binding('desk.name'))
                        .getText()
                        .then((text) => text.toUpperCase() === name.toUpperCase()),
                );
        };

        /**
         * Return the numbers of desks on desks settings list
         * @return {integer}
         **/
        this.getCount = function() {
            return this.list.count();
        };

        /**
         * Returns the stage count for named desk on desks settings list
         * @param {string} name of desk
         * @return {Promise.<string>} a promise which is resolved with the stage count
         **/
        this.getStageCount = function(name) {
            return this.getRow(name).then((rows) =>
                rows[0].element(by.binding('getDeskStages(desk).length')).getText().then((count) => count));
        };

        /**
         * Starts the edit action for named desk from desks settings list
         * @param {string} name of desk
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
         * Starts the monitoring settings for named desk from desks settings list
         * @param {string} name of desk
         **/
        this.showMonitoringSettings = function(name) {
            this.getRow(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-dots-vertical')).click();
                rows[0].element(by.className('icon-settings')).click();

                browser.wait(() => element.all(by.css('.aggregate-widget-config')).isDisplayed());
                element.all(by.css('[ng-click="goTo(step)"]')).first().click();
            });
        };

        /**
         * Remove named desk from desks settings list
         * @param {string} name of desk
         **/
        this.remove = function(name) {
            this.getRow(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-dots-vertical')).click();
                rows[0].element(by.className('icon-trash')).click();
                browser.sleep(500);
                element(by.buttonText('OK')).click();
            });
        };

        /**
         * Get desk settings wizard tab by name
         * @param {string} name of tab
         * @return {promise} tab element
         **/
        this.getTab = function(name) {
            return this.tabs.filter((elem, index) =>
                elem.element(by.binding('step.title'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        /**
         * Set named tab as the current one on desk settings wizard
         * @param {string} name of tab
         **/
        this.showTab = function(name) {
            this.getTab(name).then((rows) => {
                rows[0].click();
                browser.sleep(500);
            });
        };

        /**
         * Get a named stage on desk wizard, stages tab
         * @param {string} name of stage
         * @return {promise} stage element
         **/
        this.getStage = function(name) {
            return this.stages.filter((elem, index) =>
                elem.element(by.binding('stage.name'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        /**
         * Edit a named stage on desk settings wizard, stages tab
         * @param {string} name of stage
         **/
        this.editStage = function(name) {
            this.getStage(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-pencil')).click();
                browser.sleep(500);
            });
        };

        /**
         * Delete a named stage on desk settings wizard, stages tab
         * @param {string} name of stage
         **/
        this.removeStage = function(name) {
            this.getStage(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-trash')).click();
            });
        };

        /**
         * Saves desk settings and close the desk settings wizard
         **/
        this.save = function() {
            element(by.id('save')).click();
        };

        this.close = function() {
            element(by.className('close-modal')).click();
        };

        /**
         * Get the desk name element
         * @returns {ElementFinder} desk name element
         **/
        this.deskNameElement = function() {
            return element(by.model('desk.edit.name'));
        };

        /**
         * Get the desk description element
         * @returns {ElementFinder} desk description element
         **/
        this.deskDescriptionElement = function() {
            return element(by.model('desk.edit.description'));
        };

        /**
         * Get the desk source element
         * @returns {ElementFinder} desk source element
         **/
        this.deskSourceElement = function() {
            return element(by.model('desk.edit.source'));
        };

        /**
         * Get the desk type element
         * @returns {ElementFinder} desk type element
         **/
        this.getDeskType = function() {
            return element(by.model('desk.edit.desk_type'));
        };

        /**
         * Set desk type
         * @param {string} deskType name
         **/
        this.setDeskType = function(deskType) {
            element(by.model('desk.edit.desk_type')).$('[value="' + deskType + '"]').click();
        };

        /**
         * Save & Continue action on general tab
         **/
        this.actionSaveAndContinueOnGeneralTab = function() {
            element(by.id('next-general')).click();
        };

        /**
         * Done action on general tab
         **/
        this.actionDoneOnGeneralTab = function() {
            element(by.id('done-general')).click();
        };

        /**
         * Done action on stages tab
         **/
        this.actionDoneOnStagesTab = function() {
            element(by.id('done-stages')).click();
        };

        /**
         * Save & Continue action on stages tab
         **/
        this.actionSaveAndContinueOnStagesTab = function() {
            element(by.id('next-stages')).click();
        };

        /**
         * Save & Continue action on people tab
         **/
        this.actionSaveAndContinueOnPeopleTab = function() {
            element(by.id('next-people')).click();
        };

        /**
         * new desk button
         * @returns {ElementFinder} button
         **/
        this.getNewDeskButton = function() {
            return element(by.id('add-new-desk'));
        };

        /**
         * Get the Desk Content Expiry Hours.
         * @returns {ElementFinder} Content Expiry Hours input element
         */
        this.getDeskContentExpiryHours = function() {
            return element(by.model('contentExpiry.hours'));
        };

        /**
         * Get the Desk Content Expiry Minutes.
         * @returns {ElementFinder} Content Expiry Minutes input element
         */
        this.getDeskContentExpiryMinutes = function() {
            return element(by.model('contentExpiry.minutes'));
        };

        /**
         * Set the Desk Content Expiry.
         * @param {int} hours
         * @param {int} minutes
         */
        this.setDeskContentExpiry = function(hours, minutes) {
            var hoursElm = this.getDeskContentExpiryHours(),
                minutesElm = this.getDeskContentExpiryMinutes();

            hoursElm.clear();
            hoursElm.sendKeys(hours);
            minutesElm.clear();
            minutesElm.sendKeys(minutes);
        };

        /**
         * new stage button
         * @returns {ElementFinder} button
         **/
        this.getNewStageButton = function() {
            return element(by.id('new-stage'));
        };

        /**
         * Get the stage name element
         * @returns {ElementFinder} stage name element
         **/
        this.stageNameElement = function() {
            return element(by.model('editStage.name'));
        };

        /**
         * Get the stage description element
         * @returns {ElementFinder} stage name element
         **/
        this.stageDescriptionElement = function() {
            return element(by.model('editStage.description'));
        };

        /**
         * Toggles the working stage flag
         **/
        this.toggleWorkingStageFlag = function() {
            element(by.model('editStage.working_stage')).click();
        };

        /**
         * Toggles the global read flag
         **/
        this.toggleGlobalReadFlag = function() {
            element(by.model('editStage.is_visible')).click();
        };

        /**
         * Get global read flag status
         **/
        this.getGlobalReadFlag = function() {
            return element(by.model('editStage.is_visible'));
        };

        /**
         * Get Incoming flag status
         **/
        this.getIncomingFlag = function() {
            return element(by.model('editStage.default_incoming'));
        };

        /**
         * Toggles the incoming stage flag
         **/
        this.toggleIncomingStageFlag = function() {
            element(by.model('editStage.default_incoming')).click();
        };

        this.confirmStageDeleteButton = function(stageName) {
            this.getStage(stageName).then((rows) => {
                browser.actions().mouseMove(rows[0]).perform();
                expect(rows[0].element(by.className('icon-trash')).isPresent()).toBe(true);
            });
        };

        /**
         * Saves new stage settings
         **/
        this.saveNewStage = function() {
            element(by.id('save-new-stage')).click();
        };

        /**
         * Saves edited stage settings
         **/
        this.saveEditedStage = function() {
            element(by.id('save-edited-stage')).click();
        };

        /**
         * Get the list of macros available to stages
         * @return {promise} list of elements for macros available to stages
         */
        this.getStageMacros = function() {
            return element.all(by.model('editStage.incoming_macro')).all(by.repeater('macro in macros'));
        };

        /**
         * Get Incoming Macro for a stage
         * @return {promise} stage incoming macro select input
         */
        this.getStageIncomingMacro = function() {
            return element(by.model('editStage.incoming_macro'));
        };

        /**
         * Set Incoming Macro for a stage
         * @param {string} name of macro
         */
        this.setStageIncomingMacro = function(name) {
            this.getStageIncomingMacro().$('[value="' + name + '"]').click();
        };

        /**
         * Get Moved Onto Macro for a stage
         * @return {promise} stage moved onto macro select input
         */
        this.getStageMovedOntoMacro = function() {
            return element(by.model('editStage.onstage_macro'));
        };

        /**
         * Set Moved Onto Macro for a stage
         * @param {string} name of macro
         */
        this.setStageMovedOntoMacro = function(name) {
            this.getStageMovedOntoMacro().$('[value="' + name + '"]').click();
        };

        /**
         * Get Outgoing Macro for a stage
         * @return {promise} stage outgoing macro select input
         */
        this.getStageOutgoingMacro = function() {
            return element(by.model('editStage.outgoing_macro'));
        };

        /**
         * Set Outgoing Macro for a stage
         * @param {string} name of macro
         */
        this.setStageOutgoingMacro = function(name) {
            this.getStageOutgoingMacro().$('[value="' + name + '"]').click();
        };

        /**
         * Saves the user by given name to the desk
         * @param {string} userName
         */
        this.addUser = (userName) => {
            const searchBox = element(by.model('search'));

            searchBox.sendKeys(userName);
            searchBox.sendKeys(protractor.Key.ENTER);
            browser.sleep(1000);
            element.all(by.repeater('user in users._items')).first().click();
            element(by.id('next-people')).click();
        };
    }
}

export default new Desks();
