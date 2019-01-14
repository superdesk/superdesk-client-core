const authoring = require('./helpers/authoring');
const monitoring = require('./helpers/monitoring');

class Editor3Toolbar {
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
    constructor(element) {
        this.editable = element.element(by.className('public-DraftEditor-content'));
        this.toolbar = new Editor3Toolbar(element);
    }

    sendKeys(...keys) {
        this.editable.sendKeys(...keys);
    }
}

describe('editor3', () => {
    const editors = element.all(by.className('Editor3-editor'));
    const bodyEditor = new Editor3(editors.get(1));
    const headlineEditor = new Editor3(editors.get(0));
    const ctrlA = protractor.Key.chord(protractor.Key.CONTROL, 'a');

    beforeEach(() => {
        monitoring.openMonitoring();
        monitoring.selectDesk('xeditor3');
        monitoring.createFromDeskTemplate();
    });

    it('can edit headline', () => {
        expect(editors.count()).toBe(2);
        headlineEditor.sendKeys('headline text');
        authoring.save();
        expect(monitoring.getItem(0, 0).getText()).toContain('headline text');
    });

    it('can edit body with toolbar', () => {
        bodyEditor.sendKeys('body text');
        bodyEditor.sendKeys(ctrlA);
        bodyEditor.toolbar.bold();
        bodyEditor.toolbar.link();
        bodyEditor.toolbar.linkInput.sendKeys('example.com/');
        bodyEditor.toolbar.linkSaveButton.click();

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

        expect(body.element(by.tagName('table')).getText()).toBe('barfo');
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

        expect(body.element(by.tagName('table')).getText()).toBe('fobaro');
    });

    function getPreviewBody() {
        authoring.save();
        monitoring.previewAction(0, 0);
        return monitoring.getPreviewBody();
    }
});
