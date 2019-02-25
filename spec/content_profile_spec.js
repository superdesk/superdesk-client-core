const templates = require('./helpers/templates');
const contentProfiles = require('./helpers/content_profiles');
const monitoring = require('./helpers/monitoring');
const workspace = require('./helpers/workspace');
const authoring = require('./helpers/authoring');
const assertToastMsg = require('./helpers/utils').assertToastMsg;
const metadata = require('./helpers/metadata');

describe('Content profiles', () => {
    it('creates corresponding template', () => {
        // create a new content profile
        contentProfiles.openContentProfileSettings();
        contentProfiles.addNew('Simple');
        contentProfiles.toggleEnable();
        element(by.buttonText('Content fields')).click();
        contentProfiles.disableField('Abstract');
        contentProfiles.update();
        templates.openTemplatesSettings();
        expect(templates.getListCount()).toBeGreaterThan(2);
        templates.edit('Simple');
        expect(authoring.getAbstractFieldCount()).toEqual(0);
        expect(templates.getContentProfile()).toEqual('Simple');
        templates.cancel();

        // disable content profile displays warning
        contentProfiles.openContentProfileSettings();
        contentProfiles.edit('Simple');
        contentProfiles.toggleEnable();
        contentProfiles.update();
        assertToastMsg('error', 'Cannot disable content profile as following templates are referencing: simple');
        contentProfiles.cancel();

        // delete content profile and check the template
        contentProfiles.openContentProfileSettings();
        contentProfiles.delete('Simple');
        templates.openTemplatesSettings();
        expect(templates.getListCount()).toBeGreaterThan(2);
        templates.edit('Simple');
        expect(authoring.getAbstractFieldCount()).toEqual(1);
        expect(templates.getContentProfile()).toEqual('');
        templates.cancel();
    });

    it('displays defined fields in authoring', () => {
        // create a new content profile
        contentProfiles.openContentProfileSettings();
        contentProfiles.addNew('Simple');
        contentProfiles.toggleEnable();
        element(by.buttonText('Content fields')).click();
        contentProfiles.disableField('Abstract');
        element(by.buttonText('Header fields')).click();
        contentProfiles.setRequired('Editorial Note');
        contentProfiles.update();
        monitoring.openMonitoring();
        workspace.selectDesk('Sports Desk');
        authoring.createTextItemFromTemplate('simple');
        expect(authoring.getAbstractFieldCount()).toEqual(0);

        // publish of the required field will fail
        authoring.setHeaderSluglineText('Story1 slugline');
        authoring.getSubjectMetadataDropdownOpened();
        browser.sleep(100);
        browser.actions().sendKeys('archaeology')
            .perform();
        browser.actions().sendKeys(protractor.Key.DOWN)
            .perform();
        browser.actions().sendKeys(protractor.Key.ENTER)
            .perform();
        authoring.save();
        authoring.publish(true);
        assertToastMsg('error', 'EDNOTE is a required field');
    });

    it('displays custom text fields', () => {
        const FIELD_LABEL = 'A custom text field';

        metadata.open();
        metadata.openCustomTextFields();
        expect(metadata.items().count()).toBe(0);

        metadata.addNew('custom', FIELD_LABEL, 'custom help');
        expect(metadata.items().count()).toBe(1);

        contentProfiles.openContentProfileSettings();
        contentProfiles.addNew('Simple');

        element(by.buttonText('Content fields')).click();
        expect(element(by.buttonText(FIELD_LABEL)).isDisplayed()).toBeFalsy();

        contentProfiles.openAddFieldDropdown();
        expect(element(by.buttonText('A custom text field')).isPresent()).toBeTruthy();
    });
});
