/* eslint-disable newline-per-chained-call */

import {element, by, browser} from 'protractor';
import {nav} from './utils';

class PublishQueue {
    openPublishQueue: () => void;
    getRow: any;
    getHeadline: (rowNo: any) => any;
    getUniqueName: (rowNo: any) => any;
    getDestination: (rowNo: any) => any;
    previewAction: (rowNo: any) => void;
    openCompositeItem: (group: any) => void;
    getCompositeItemHeadline: any;
    getOpenedItemHeadline: any;
    getPreviewTitle: any;
    searchAction: (search: any) => void;
    clearSearch: () => void;
    getItemCount: any;

    constructor() {
        this.openPublishQueue = function() {
            nav('/publish_queue');
        };

        this.getRow = function(rowNo) {
            return element.all(by.css('[ng-click="preview(queue_item);"]')).get(rowNo);
        };

        this.getHeadline = function(rowNo) {
            var row = this.getRow(rowNo);

            return row.all(by.className('ng-binding')).get(2);
        };

        this.getUniqueName = function(rowNo) {
            var row = this.getRow(rowNo);

            return row.all(by.className('ng-binding')).get(1);
        };

        this.getDestination = function(rowNo) {
            var row = this.getRow(rowNo);

            return row.all(by.className('ng-binding')).get(7);
        };

        this.previewAction = function(rowNo) {
            var row = this.getRow(rowNo);

            row.click();
        };

        this.openCompositeItem = function(group) {
            var _list = element(by.css('[data-title="' + group.toLowerCase() + '"]'))
                .all(by.repeater('child in item.childData'));

            _list.all(by.css('[ng-click="open(data)"]')).get(0).click();
        };

        this.getCompositeItemHeadline = function(index) {
            return element.all(by.className('package-item__item-headline')).get(index).getText();
        };

        this.getOpenedItemHeadline = function() {
            return element.all(by.className('headline')).get(0).getText();
        };

        this.getPreviewTitle = function() {
            return element(by.css('.content-container'))
                .element(by.css('.preview-headline'))
                .getText();
        };

        this.searchAction = function(search) {
            element(by.css('.flat-searchbar')).click();
            browser.sleep(100);
            element(by.model('query')).clear();
            element(by.model('query')).sendKeys(search);
        };

        this.clearSearch = function() {
            element(by.css('.flat-searchbar')).click();
            browser.sleep(100);
            element(by.model('query')).clear();
        };

        var list = element(by.className('list-pane'));

        this.getItemCount = function() {
            browser.sleep(500); // wait for a while to get list populated.
            return list.all(by.repeater('queue_item in publish_queue track by queue_item._id')).count();
        };
    }
}

export const publishQueue = new PublishQueue();
