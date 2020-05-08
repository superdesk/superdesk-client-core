import {element, browser, protractor, by} from 'protractor';

import {monitoring} from './helpers/monitoring';
import {authoring} from './helpers/authoring';
import {ECE, el} from 'end-to-end-testing-helpers';
import {assertToastMsg} from './helpers/utils';

class Editor3Toolbar {
    controls: any;
    linkForm: any;
    linkInput: any;
    linkSaveButton: any;

    constructor(_element) {
        this.controls = _element.element(by.className('Editor3-controls'));
        this.linkForm = element(by.className('link-input'));
        this.linkInput = this.linkForm.element(by.tagName('input'));
        this.linkSaveButton = this.controls.element(by.buttonText('Insert'));
    }

    clickIcon(icon) {
        this.controls.element(by.className('icon-' + icon)).click();
    }

    bold() {
        this.clickIcon('bold');
    }

    link() {
        this.clickIcon('link');
    }

    table() {
        this.clickIcon('table');
    }
}

class Editor3 {
    editable: any;
    toolbar: Editor3Toolbar;
    constructor(_element) {
        this.editable = _element.element(by.className('public-DraftEditor-content'));
        this.toolbar = new Editor3Toolbar(_element);
    }

    sendKeys(...keys) {
        this.editable.sendKeys(...keys);
    }
}

describe('editor3', () => {
    const editors = element.all(by.className('Editor3-editor'));
    const bodyEditor = new Editor3(editors.get(1));
    const headlineEditor = new Editor3(editors.get(0));
    const selectAll = protractor.Key.chord(protractor.Key.SHIFT, protractor.Key.UP);

    beforeEach(() => {
        monitoring.openMonitoring();
        monitoring.selectDesk('xeditor3');
        monitoring.createFromDeskTemplate();
        browser.wait(ECE.presenceOf(editors.get(0)));
    });

    it('can edit headline', () => {
        expect(editors.count()).toBe(2);
        headlineEditor.sendKeys('headline text');
        authoring.save();
        expect(monitoring.getItem(0, 0).getText()).toContain('headline text');
    });

    it('can edit body with toolbar', () => {
        bodyEditor.sendKeys('body text');
        bodyEditor.sendKeys(selectAll);
        bodyEditor.toolbar.bold();
        bodyEditor.toolbar.link();
        bodyEditor.toolbar.linkInput.sendKeys('example.com/');
        bodyEditor.toolbar.linkSaveButton.click();
        browser.sleep(500); // it must wait for the change from e3 to be visible in authoring

        const body = getPreviewBody();

        expect(body.element(by.tagName('b')).getText()).toBe('body text');
        expect(body.element(by.tagName('a')).getText()).toBe('body text');
        expect(body.element(by.tagName('a')).getAttribute('href')).toBe('https://example.com/');
    });

    it('can add tables', () => {
        const tableEditor = new Editor3(editors.get(1).element(by.className('table-block')));

        bodyEditor.toolbar.table();
        tableEditor.sendKeys('foo');

        const body = getPreviewBody();

        expect(body.element(by.tagName('table')).getText()).toBe('foo');
    });

    it('ctrl+z on tables mantains cursor position at the end', () => {
        const tableEditor = new Editor3(editors.get(1).element(by.className('table-block')));

        bodyEditor.toolbar.table();
        tableEditor.sendKeys('foo');
        tableEditor.sendKeys(protractor.Key.CONTROL, 'z');
        tableEditor.sendKeys('bar');

        const body = getPreviewBody();

        expect(body.element(by.tagName('table')).getText()).toBe('fobar');
    });

    it('ctrl+z on tables mantains cursor position at the beginning', () => {
        const tableEditor = new Editor3(editors.get(1).element(by.className('table-block')));

        bodyEditor.toolbar.table();
        tableEditor.sendKeys('foo');
        tableEditor.sendKeys(protractor.Key.ARROW_LEFT);
        tableEditor.sendKeys(protractor.Key.ARROW_LEFT);
        tableEditor.sendKeys(protractor.Key.ARROW_LEFT);
        tableEditor.sendKeys(protractor.Key.CONTROL, 'z');
        tableEditor.sendKeys('bar');

        const body = getPreviewBody();

        expect(body.element(by.tagName('table')).getText()).toBe('fobar');
    });

    it('ctrl+z on tables mantains cursor position in the middle', () => {
        const tableEditor = new Editor3(editors.get(1).element(by.className('table-block')));

        bodyEditor.toolbar.table();
        tableEditor.sendKeys('foo');
        tableEditor.sendKeys(protractor.Key.ARROW_LEFT);
        tableEditor.sendKeys(protractor.Key.ARROW_LEFT);
        tableEditor.sendKeys(protractor.Key.CONTROL, 'z');
        tableEditor.sendKeys(protractor.Key.CONTROL, 'z');
        tableEditor.sendKeys('bar');

        const body = getPreviewBody();

        expect(body.element(by.tagName('table')).getText()).toBe('fbar');
    });

    it('ctrl+y on tables mantains cursor position', () => {
        const tableEditor = new Editor3(editors.get(1).element(by.className('table-block')));

        bodyEditor.toolbar.table();
        tableEditor.sendKeys('foo');
        tableEditor.sendKeys(protractor.Key.CONTROL, 'z');
        tableEditor.sendKeys(protractor.Key.CONTROL, 'y');
        tableEditor.sendKeys('bar');

        const body = getPreviewBody();

        expect(body.element(by.tagName('table')).getText()).toBe('foobar');
    });

    function getPreviewBody() {
        const saveButton = el(['authoring', 'authoring-topbar', 'save']);

        browser.wait(ECE.elementToBeClickable(saveButton));
        saveButton.click();
        assertToastMsg('success', 'Item updated.');
        monitoring.previewAction(0, 0);
        return monitoring.getPreviewBody();
    }
});
