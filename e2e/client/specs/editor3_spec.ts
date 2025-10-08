import {element, browser, protractor, by} from 'protractor';

import {monitoring} from './helpers/monitoring';
import {authoring} from './helpers/authoring';
import {ECE, el} from '@superdesk/end-to-end-testing-helpers';
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
        browser.sleep(200);
    }

    bold() {
        this.clickIcon('bold');
        browser.sleep(200);
    }

    link() {
        this.clickIcon('link');
        browser.sleep(200);
    }

    table() {
        this.clickIcon('table');
        browser.sleep(200);
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
        browser.wait(ECE.presenceOf(editors.get(0)), 2000);
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
        bodyEditor.toolbar.linkInput.sendKeys('https://example.com/');
        bodyEditor.toolbar.linkSaveButton.click();
        browser.sleep(500); // it must wait for the change from e3 to be visible in authoring

        const body = getPreviewBody();

        expect(body.element(by.tagName('b')).getText()).toBe('body text');
        expect(body.element(by.tagName('a')).getText()).toBe('body text');
        expect(body.element(by.tagName('a')).getAttribute('href')).toBe('https://example.com/');
    });

    function getPreviewBody() {
        authoring.save();
        assertToastMsg('success', 'Item updated.');
        monitoring.previewAction(0, 0);
        return monitoring.getPreviewBody();
    }
});
