/* eslint-disable newline-per-chained-call */

var el = require('./helpers/e2e-helpers').el;

var workspace = require('./helpers/pages').workspace,
    content = require('./helpers/content'),
    authoring = require('./helpers/authoring');

describe('content', () => {
    var body = element(by.tagName('body'));

    function selectedHeadline() {
        var headline = element.all(by.css('.preview-headline')).first();

        browser.wait(() => headline.isDisplayed(), 500); // animated sidebar

        return headline.getText();
    }

    beforeEach(() => {
        workspace.open();
        workspace.createWorkspace('Personal');
        workspace.switchToDesk('PERSONAL');
        expect(element.all(by.css('.media-box')).count()).toBe(2);
    });

    // wait a bit after sending keys to body
    function pressKey(key) {
        browser.actions().sendKeys(key).perform();
        browser.sleep(50);
    }

    function setEmbargo() {
        var now = new Date();
        // choose time with date not in a valid month number.
        // default view time format in config
        var embargoDate = '09/09/' + (now.getFullYear() + 1);
        var embargoTime = (now.getHours() < 10 ? '0' + now.getHours() : now.getHours()) + ':' +
                        (now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes());

        element(by.model('item.embargo_date')).element(by.tagName('input')).sendKeys(embargoDate);
        element(by.model('item.embargo_time')).element(by.tagName('input')).sendKeys(embargoTime);
    }

    it('can navigate with keyboard', () => {
        content.getItems().first().click();

        pressKey(protractor.Key.UP);
        expect(selectedHeadline()).toBe('item1');

        pressKey(protractor.Key.DOWN);
        expect(selectedHeadline()).toBe('item2');

        pressKey(protractor.Key.LEFT);
        expect(selectedHeadline()).toBe('item1');

        pressKey(protractor.Key.RIGHT);
        expect(selectedHeadline()).toBe('item2');

        pressKey(protractor.Key.UP);
        expect(selectedHeadline()).toBe('item1');
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

        el(['multi-actions-inline', 'Multiedit']).click();
        expect(browser.getCurrentUrl()).toMatch(/multiedit$/);
        expect(element.all(by.repeater('board in boards')).count()).toBe(2);
    });

    it('can create text article in a desk', () => {
        workspace.switchToDesk('SPORTS DESK');
        content.setListView();

        element(by.className('sd-create-btn')).click();
        element(by.id('create_text_article')).click();

        authoring.writeText('Words');
        authoring.save();
        authoring.close();

        expect(content.count()).toBe(3);
    });

    it('can create empty package in a desk', () => {
        workspace.switchToDesk('SPORTS DESK');
        content.setListView();

        element(by.className('sd-create-btn')).click();
        element(by.id('create_package')).click();

        element.all(by.model('item.headline')).first().sendKeys('Empty Package');
        authoring.save();
        authoring.close();

        expect(content.count()).toBe(3);
    });

    xit('can close unsaved empty package in a desk', () => {
        workspace.switchToDesk('SPORTS DESK');
        content.setListView();

        element(by.className('sd-create-btn')).click();
        element(by.id('create_package')).click();

        element.all(by.model('item.headline')).first().sendKeys('Empty Package');
        authoring.close();

        element.all(by.className('btn--warning')).first().click();

        browser.wait(() => content.count().then((contentCount) => contentCount && contentCount === 2), 500);
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
        browser.sleep(500);

        expect(content.getItemType('composite').isDisplayed()).toBe(true);
        expect(content.getWidgets().count()).toBeGreaterThanOrEqual(5);

        element(by.id('closeAuthoringBtn')).click();
    });

    it('can display embargo in metadata when set', () => {
        workspace.editItem('item3', 'SPORTS');
        authoring.sendToButton.click();

        setEmbargo();
        browser.sleep(100);

        authoring.closeSendAndPublish();

        element(by.css('[ng-click="saveTopbar()"]')).click();
        element(by.id('closeAuthoringBtn')).click();

        content.previewItem('item3');
        element(by.css('[ng-click="vm.current_tab = \'metadata\'"]')).click();

        expect(element(by.css('[datetime="item.embargo"]')).isDisplayed()).toBe(true);

        content.closePreview();
    });

    it('can enable/disable send based on embargo', () => {
        // Initial steps before proceeding, to get initial state of send buttons.
        workspace.editItem('item3', 'SPORTS');
        authoring.sendTo('Sports Desk', 'Incoming Stage');
        authoring.confirmSendTo();

        workspace.editItem('item3', 'SPORTS');
        authoring.sendToButton.click().then(() => {
            // Initial State
            expect(authoring.sendBtn.isEnabled()).toBe(false);
        });

        var sidebar = element.all(by.css('.side-panel')).last(),
            dropdown = sidebar.element(by.css('.dropdown--dark .dropdown__toggle'));

        dropdown.waitReady();
        dropdown.click();
        sidebar.element(by.buttonText('Sports Desk')).click();

        // State after selecting different Stage in the same desk
        sidebar.element(by.buttonText('two')).click();
        expect(authoring.sendBtn.isEnabled()).toBe(true);

        // State after setting Embargo
        setEmbargo();
        browser.sleep(100);
        expect(authoring.sendBtn.isEnabled()).toBe(true);

        // State after changing Desk
        dropdown.click();
        sidebar.element(by.buttonText('Politic Desk')).click();
        expect(authoring.sendBtn.isEnabled()).toBe(true);
    });
});
