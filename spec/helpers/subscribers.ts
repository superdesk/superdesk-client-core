/* eslint-disable newline-per-chained-call */

import {element, browser, by} from 'protractor';
import {nav} from './utils';

class Subscribers {
    cancelSubscriberButton: any;
    list: any;
    saveSubscriberButton: any;
    get: () => void;
    getSubscriber: (name: any) => any;
    getCount: (index?: any) => any;
    edit: (name: any) => void;
    setType: (ingestType: any) => void;
    setDestinationFormat: (ingestType: any) => void;
    cancel: () => void;

    constructor() {
        this.list = element.all(by.repeater('subscriber in subscribers'));
        this.saveSubscriberButton = element(by.css('[ng-click="save()"]'));
        this.cancelSubscriberButton = element(by.css('[ng-click="cancel()"]'));

        this.get = function() {
            nav('/settings/publish');
            browser.sleep(500);
        };

        this.getSubscriber = function(name) {
            return this.list.filter((elem, index) =>
                elem.element(by.binding('subscriber.name'))
                    .getText()
                    .then((text) => text.toUpperCase() === name.toUpperCase()),
            );
        };

        this.getCount = function(index) {
            return this.list.count();
        };

        this.edit = function(name) {
            this.getSubscriber(name).then((rows) => {
                rows[0].click();
                rows[0].element(by.className('icon-pencil')).click();
                browser.sleep(500);
            });
        };

        this.setType = function(ingestType) {
            element(by.id('subType')).all(by.tagName('option'))
                .filter((elem, index) => elem.getText().then((label) => label.toLowerCase().indexOf(ingestType) > -1))
                .then((options) => {
                    options[0].click();
                });
        };

        this.setDestinationFormat = function(ingestType) {
            element(by.id('destination-format')).all(by.tagName('option'))
                .filter((elem, index) => elem.getText().then((label) => label.toLowerCase().indexOf(ingestType) > -1))
                .then((options) => {
                    options[0].click();
                });
        };

        this.cancel = function() {
            this.cancelSubscriberButton.click();
        };
    }
}

export const subscribers = new Subscribers();
export default subscribers;
