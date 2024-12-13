/* eslint-disable newline-per-chained-call */

import {element, browser, protractor, by} from 'protractor';

import {workspace} from './helpers/workspace';
import {content} from './helpers/content';
import {authoring} from './helpers/authoring';
import {monitoring} from './helpers/monitoring';
import {multiAction} from './helpers/actions';
import {ECE, el} from '@superdesk/end-to-end-testing-helpers';
import {TreeSelectDriver} from './helpers/tree-select-driver';

describe('content', () => {
    var body = element(by.tagName('body'));

    beforeEach(() => {
        workspace.open();
        workspace.createWorkspace('Personal');
        workspace.switchToDesk('PERSONAL');

        // eslint-disable-next-line jasmine/no-expect-in-setup-teardown
        expect(element.all(by.css('.media-box')).count()).toBe(2);
    });

    // wait a bit after sending keys to body
    function pressKey(key) {
        browser.actions().sendKeys(key).perform();
    }

    function setEmbargo() {
        var now = new Date();
        // choose time with date not in a valid month number.
        // default view time format in config
        var embargoDate = '09/09/' + (now.getFullYear() + 1);
        var embargoTime = (now.getHours() < 10 ? '0' + now.getHours() : now.getHours()) + ':' +
                        (now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes());

        el(['authoring', 'interactive-actions-panel', 'embargo', 'date-input']).sendKeys(embargoDate);
        el(['authoring', 'interactive-actions-panel', 'embargo', 'time-input']).sendKeys(embargoTime);
    }

    it('can navigate with keyboard', () => {
        content.getItems().first().click();
        browser.wait(
            ECE.textToBePresentInElement(
                el(['authoring-preview', 'field--headline']),
                'item1',
            ),
            1000,
        );

        pressKey(protractor.Key.UP);
        browser.wait(
            ECE.textToBePresentInElement(
                el(['authoring-preview', 'field--headline']),
                'item1',
            ),
            1000,
        );

        browser.sleep(100);

        pressKey(protractor.Key.DOWN);
        browser.wait(
            ECE.textToBePresentInElement(
                el(['authoring-preview', 'field--headline']),
                'item2',
            ),
            1000,
        );

        browser.sleep(100);

        pressKey(protractor.Key.LEFT);
        browser.wait(
            ECE.textToBePresentInElement(
                el(['authoring-preview', 'field--headline']),
                'item1',
            ),
            1000,
        );

        browser.sleep(100);

        pressKey(protractor.Key.RIGHT);
        browser.wait(
            ECE.textToBePresentInElement(
                el(['authoring-preview', 'field--headline']),
                'item2',
            ),
            1000,
        );

        browser.sleep(100);

        pressKey(protractor.Key.UP);
        browser.wait(
            ECE.textToBePresentInElement(
                el(['authoring-preview', 'field--headline']),
                'item1',
            ),
            1000,
        );
    });

    it('can open search with s', () => {
        pressKey('s');
        expect(element(by.id('search-input')).isDisplayed()).toBe(true);
    });

    it('can toggle view with v', () => {
        var gridBtn = element.all(by.css('.view-select button')).first();

        // reset to grid view first
        gridBtn.isDisplayed().then((isList) => {
            if (isList) {
                gridBtn.click();
            }
        });

        expect(element.all(by.css('.state-border')).count()).toBe(0);
        body.sendKeys('v');
        expect(element.all(by.css('.state-border')).count()).toBe(2);
        body.sendKeys('v');
        expect(element.all(by.css('.state-border')).count()).toBe(0);
    });

    function toggle(selectbox) {
        browser.actions().mouseMove(selectbox).perform();
        selectbox.element(by.css('.sd-checkbox')).click();
    }

    it('can select multiple items', () => {
        content.setListView();
        var count = element(by.id('multi-select-count')),
            boxes = element.all(by.css('.list-field.type-icon'));

        toggle(boxes.first());
        expect(count.getText()).toBe('1 Item selected');

        toggle(boxes.last());
        expect(count.getText()).toBe('2 Items selected');

        browser.sleep(100);

        multiAction('Multi-edit');
        expect(browser.getCurrentUrl()).toMatch(/multiedit$/);
        expect(element.all(by.repeater('board in boards')).count()).toBe(2);
    });

    it('can create text article in a desk', () => {
        workspace.switchToDesk('SPORTS DESK');
        content.setListView();

        authoring.createTextItem();

        authoring.writeText('Words');
        authoring.save();
        authoring.close();

        expect(content.count()).toBe(3);
    });

    it('can create empty package in a desk', () => {
        workspace.switchToDesk('SPORTS DESK');
        content.setListView();

        monitoring.createItem('Create package');

        element.all(by.model('item.headline')).first().sendKeys('Empty Package');
        authoring.save();
        authoring.close();

        expect(content.count()).toBe(3);
    });

    it('can open item using hotkey ctrl+0', () => {
        content.setListView();

        browser.actions().sendKeys(protractor.Key.chord(protractor.Key.CONTROL, '0')).perform();
        browser.sleep(500);

        var storyNameEl = element(by.model('meta.unique_name'));

        expect(storyNameEl.isDisplayed()).toBe(true);

        storyNameEl.clear();
        storyNameEl.sendKeys('item1');

        element(by.id('searchItemByNameBtn')).click();
        browser.sleep(500);

        expect(content.getItemType('text').isDisplayed()).toBe(true);
        expect(content.getWidgets().count()).toBeGreaterThanOrEqual(5);

        element(by.id('closeAuthoringBtn')).click();
    });

    it('can open package using hotkey ctrl+0', () => {
        content.setListView();

        browser.actions().sendKeys(protractor.Key.chord(protractor.Key.CONTROL, '0')).perform();
        browser.sleep(500);

        var storyNameEl = element(by.model('meta.unique_name'));

        expect(storyNameEl.isDisplayed()).toBe(true);

        storyNameEl.clear();
        storyNameEl.sendKeys('package1');

        element(by.id('searchItemByNameBtn')).click();
        browser.wait(() => content.getWidgets().count().then((count) => count > 1), 1000);

        expect(content.getItemType('composite').isDisplayed()).toBe(true);
        expect(content.getWidgets().count()).toBeGreaterThanOrEqual(5);

        element(by.id('closeAuthoringBtn')).click();
    });

    it('can set embargo and send', () => {
        // Initial steps before proceeding, to get initial state of send buttons.
        workspace.editItem('item3', 'SPORTS');
        authoring.sendTo('Sports Desk', 'Incoming Stage');
        authoring.confirmSendTo();

        workspace.editItem('item3', 'SPORTS');

        el(['open-send-publish-pane']).click();

        el(['authoring', 'interactive-actions-panel', 'tabs'], by.buttonText('Send to')).click();

        const sendToButton = el(['authoring', 'interactive-actions-panel', 'send']);

        browser.wait(ECE.visibilityOf(sendToButton));

        new TreeSelectDriver(
            el(['interactive-actions-panel', 'destination-select']),
        ).setValue('Sports Desk');

        const stage = 'two';

        // State after selecting different Stage in the same desk
        el(
            ['interactive-actions-panel', 'stage-select'],
            by.cssContainingText('[data-test-id="item"]', stage),
        ).click();

        expect(sendToButton.isEnabled()).toBe(true);

        // State after setting Embargo
        setEmbargo();
        browser.sleep(100);
        expect(sendToButton.isEnabled()).toBe(true);

        // State after changing Desk
        new TreeSelectDriver(
            el(['interactive-actions-panel', 'destination-select']),
        ).setValue('Politic Desk');

        expect(sendToButton.isEnabled()).toBe(true);
    });
});
