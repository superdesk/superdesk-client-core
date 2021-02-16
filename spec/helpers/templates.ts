/* eslint-disable newline-per-chained-call */

import {nav} from './utils';
import {element, by, browser} from 'protractor';
import {el} from '@superdesk/end-to-end-testing-helpers';

class Templates {
    list: any;
    name: any;
    newTemplateBtn: any;
    openTemplatesSettings: () => void;
    add: () => void;
    getTemplateNameElement: any;
    getLegalSwitch: any;
    getTemplateType: any;
    setTemplateType: (templateType: any) => void;
    getContentProfile: any;
    getDeskElement: any;
    selectDesk: (deskName: any) => void;
    getAutomaticItemCreationElement: any;
    toggleMetadata: any;
    toggleLegal: () => any;
    toggleAutomaticItemCreation: () => void;
    getWeekDayElement: any;
    selectWeekDay: (weekDay: any) => void;
    getTimeElement: any;
    setTime: (hour: any, minute: any) => void;
    getTime: any;
    getDeskScheduleElement: any;
    selectScheduleDesk: (deskName: any) => void;
    getStageScheduleElement: any;
    selectScheduleStage: (stageName: any) => void;
    getSaveButton: any;
    save: () => void;
    cancel: () => void;
    edit: (name: any) => void;
    remove: (name: any) => void;
    getRow: (name: any) => any;
    getValidationElement: any;
    getListCount: () => any;

    constructor() {
        /** List of templates on template settings list **/
        this.list = element.all(by.repeater('template in content_templates._items'));
        /** For an item from templates settings list, get his name **/
        this.name = element(by.model('template.name'));

        /** a button for creating a new template **/
        this.newTemplateBtn = element(by.buttonText('Add New'));

        /**
         * Open the template settings wizard
         **/
        this.openTemplatesSettings = function() {
            nav('/settings/templates');
        };

        /**
         * Opens the template add dialog from templates settings
         **/
        this.add = function() {
            this.newTemplateBtn.click();
        };

        /**
         * Get the template name element
         * @returns {ElementFinder} template name element
         **/
        this.getTemplateNameElement = function() {
            return element(by.model('template.template_name'));
        };

        /**
         * Get the legal switch element
         * @returns {ElementFinder} legal switch element
         **/
        this.getLegalSwitch = () => element(by.model('item.flags.marked_for_legal'));

        /**
         * Get the template type element
         * @returns {ElementFinder} template type element
         **/
        this.getTemplateType = function() {
            return element(by.model('template.template_type'));
        };

        /**
         * Set template type
         * @param {string} templateType name
         **/
        this.setTemplateType = function(templateType) {
            element(by.model('template.template_type')).$('[value="' + templateType + '"]').click();
        };

        /**
         * Get the selected content profile name
         **/
        this.getContentProfile = function() {
            return element(by.id('template-profile'))
                .all(by.tagName('option'))
                .filter((option: any) => option.getAttribute('selected'))
                .first()
                .getText();
        };

        /**
         * Return desk selection element
         * @param {string} deskName desk name
         * @returns {ElementFinder} desk selection element
         **/
        this.getDeskElement = function(deskName) {
            return el(['template-edit-view', 'desks', 'desk--' + deskName]);
        };

        /**
         * Select desk
         * @param {string} deskName desk name
         **/
        this.selectDesk = function(deskName) {
            this.getDeskElement(deskName).click();
        };

        /**
         * Return automatic item creation element
         * @returns {ElementFinder} automatic item creation switch element
         **/
        this.getAutomaticItemCreationElement = function() {
            return element(by.model('template.schedule.is_active'));
        };

        /**
         * Toggles metadata section
         **/
        this.toggleMetadata = () => element(by.id('template-editor-metadata')).click();

        /**
         * Toggles legal switch
         **/
        this.toggleLegal = () => this.getLegalSwitch().click();

        /**
         * Toggle automatic item creation
         **/
        this.toggleAutomaticItemCreation = function() {
            this.getAutomaticItemCreationElement().click();
        };

        /**
         * Select week day
         * @param {string} weekDay week day
         * @returns {ElementFinder} week day element
         **/
        this.getWeekDayElement = function(weekDay) {
            return element.all(by.repeater('day in weekdayList'))
                .filter((elem, index) => elem.getText().then((text) => text.toUpperCase() === weekDay.toUpperCase()))
                .first();
        };

        /**
         * Select week day
         * @param {string} weekDay week day
         **/
        this.selectWeekDay = function(weekDay) {
            this.getWeekDayElement(weekDay).click();
        };

        /**
         * Set time
         * @param {int} hour
         * @param {int} minute
         * @returns {ElementFinder} time input element
         **/
        this.getTimeElement = function() {
            return element(by.model('tt'));
        };

        /**
         * Set time
         * @param {int} hour
         * @param {int} minute
         **/
        this.setTime = function(hour, minute) {
            element(by.model('tt')).sendKeys(hour.toString() + ':' + minute.toString());
            element(by.id('add_time')).click();
        };

        /**
         * getTime
         * returns the first time in the list of time pills
        **/
        this.getTime = function() {
            return element.all(by.repeater('time in cron_times')).first().getText();
        };

        /**
         * Return desk schedule element
         * @param {string} deskName
         * @returns {ElementFinder} schedule desk selection element
         **/
        this.getDeskScheduleElement = function(deskName) {
            var deskSelector = element(by.model('template.schedule_desk'));

            return deskSelector.element(by.cssContainingText('option', deskName));
        };

        /**
         * Select schedule desk
         * @param {string} deskName desk name
         **/
        this.selectScheduleDesk = function(deskName) {
            this.getDeskScheduleElement(deskName).click();
        };

        /**
         * Return stage schedule element
         * @param {string} stageName
         * @returns {ElementFinder} schedule stage selection element
         **/
        this.getStageScheduleElement = function(stageName) {
            var stageSelector = element(by.model('template.schedule_stage'));

            return stageSelector.element(by.cssContainingText('option', stageName));
        };

        /**
         * Select schedule stage
         * @param {string} stageName stage name
         **/
        this.selectScheduleStage = function(stageName) {
            this.getStageScheduleElement(stageName).click();
        };

        this.getSaveButton = () => element(by.css('[ng-click="save()"]'));

        /**
         * Saves template settings and close the template settings wizard
         **/
        this.save = function() {
            this.getSaveButton().click();
        };

        this.cancel = function() {
            element(by.css('[ng-click="cancel()"]')).click();
        };

        /**
         * Starts the edit action for named template from templates settings list
         * @param {string} name of template
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
         * Removes the named template from templates settings list
         * @param {string} name of template
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
         * Get a template item by name on templates settings list
         * @param {string} name of template
         * @return {promise} template element
         **/
        this.getRow = function(name) {
            browser.sleep(200);
            return this.list.filter((elem, index) =>
                elem.element(by.binding('template.template_name'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        /**
         * Return the validation element for the given field
         * @param {string} fieldName
         * @returns {ElementFinder} validation element
         **/
        this.getValidationElement = function(fieldName) {
            return element(by.css('[sd-validation-error="error.' + fieldName + '"]'));
        };

        /**
         * Return the numbers of templates on templates settings list
         * @return {integer} number of elements in the templates list
         **/
        this.getListCount = function() {
            return this.list.count();
        };
    }
}

export const templates = new Templates();
