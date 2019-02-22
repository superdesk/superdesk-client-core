
var modal = require('./helpers/modal');
var prefs = require('./helpers/user_prefs');
var authoring = require('./helpers/authoring');
var monitoring = require('./helpers/monitoring');

describe('errors', () => {
    it('SDESK-3965: render modals with translated specs', () => {
        prefs.navigateTo();
        prefs.setLang('English (UK)');
        prefs.save();
        monitoring.openMonitoring();
        monitoring.createFromDeskTemplate();
        authoring.writeTextToHeadline('test');
        browser.sleep(200);
        authoring.close();
        expect(modal.headerText()).toContain('Save changes?');
        expect(modal.bodyText()).toContain('unsaved changes');
    });
});