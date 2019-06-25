/* eslint-disable newline-per-chained-call */

import {element, by, browser} from 'protractor';
import {nav} from './utils';

class Dictionaries {
    list: any;
    name: any;
    languageId: any;
    get: () => void;
    getRow: (name: any) => any;
    getPersonalRow: any;
    getCount: (index: any) => any;
    edit: (name: any) => void;
    remove: (name: any) => void;
    getName: () => any;
    setName: (name: any) => void;
    setLanguageId: (languageId: any) => void;
    addDictionary: () => void;
    addPersonalDictionary: () => void;
    search: (word: any) => void;
    save: () => void;
    cancel: () => void;
    saveWord: () => void;
    getWord: () => any;
    getAddWordButton: any;
    getWordsCount: any;
    removeWord: any;

    constructor() {
        this.list = element.all(by.repeater('dictionary in dictionaries'));
        this.name = element(by.model('dictionary.name'));
        this.languageId = element(by.model('dictionary.language_id'));

        this.get = function() {
            nav('/settings/dictionaries');
            browser.sleep(500);
        };

        this.getRow = function(name) {
            return this.list.filter((elem, index) =>
                elem.element(by.binding('dictionary.name'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        this.getPersonalRow = function(languageId) {
            return element(by.id(languageId));
        };

        this.getCount = function(index) {
            return this.list.count();
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

        this.setLanguageId = function(languageId) {
            this.languageId.clear();
            this.languageId.sendKeys(languageId);
        };

        this.addDictionary = function() {
            element(by.css('[data-sd-tooltip="Add new"]')).click();
            element(by.id('createDictionary')).click();
            browser.sleep(100);
        };

        this.addPersonalDictionary = function() {
            element(by.css('[data-sd-tooltip="Add new"]')).click();
            element(by.id('createPersonalDictionary')).click();
            browser.sleep(100);
        };

        this.search = function(word) {
            element(by.id('words-search')).clear();
            element(by.id('words-search')).sendKeys(word);
        };

        this.save = function() {
            element(by.css('[ng-click="save()"]')).click();
        };

        this.cancel = function() {
            element(by.css('[ng-click="cancel()"]')).click();
        };

        this.saveWord = function() {
            element(by.buttonText('ADD WORD')).click();
        };

        this.getWord = function() {
            return this.word;
        };

        this.getAddWordButton = function() {
            return element(by.id('add-word-btn'));
        };

        this.getWordsCount = function() {
            return element.all(by.repeater('word in $vs_collection')).count();
        };

        this.removeWord = function(index) {
            return element.all(by.repeater('word in $vs_collection')).get(index || 0).element(by.css('button')).click();
        };
    }
}

export const dictionaries = new Dictionaries();
export default dictionaries;
