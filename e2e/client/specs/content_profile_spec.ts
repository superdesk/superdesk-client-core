import {element, browser, protractor, by} from 'protractor';

import {templates} from './helpers/templates';
import {contentProfiles} from './helpers/content_profiles';
import {monitoring} from './helpers/monitoring';
import {workspace} from './helpers/workspace';
import {authoring} from './helpers/authoring';
import {metadata} from './helpers/metadata';
import {assertToastMsg} from './helpers/utils';
import {ECE} from '@superdesk/end-to-end-testing-helpers';

describe('Content profiles', () => {
    it('creates corresponding template', () => {
        // create a new content profile
        contentProfiles.openContentProfileSettings();
        contentProfiles.addNew('Simple', 'text');
        contentProfiles.toggleEnable();
        contentProfiles.editContentFields();
        contentProfiles.update();
        templates.openTemplatesSettings();
        expect(templates.getListCount()).toBeGreaterThan(2);
        templates.edit('Simple');
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
        expect(templates.getContentProfile()).toEqual('');
        templates.cancel();
    });

    it('displays defined fields in authoring', () => {
        // create a new content profile
        contentProfiles.openContentProfileSettings();
        contentProfiles.addNew('Simple', 'text');
        contentProfiles.toggleEnable();
        contentProfiles.setRequired('Ed. Note');
        contentProfiles.update();
        templates.openTemplatesSettings();
        expect(templates.getListCount()).toBeGreaterThan(2);
        templates.edit('Simple');
        templates.selectDesk('Politic Desk');
        templates.selectDesk('Sports Desk');
        templates.save();
        monitoring.openMonitoring();
        workspace.selectDesk('Sports Desk');
        authoring.createTextItemFromTemplate('simple');

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
        assertToastMsg('error', 'ED. NOTE is a required field');
    });

    it('displays custom text fields', () => {
        const FIELD_LABEL = 'A custom text field';

        metadata.open();
        metadata.openCustomTextFields();
        expect(metadata.items().count()).toBe(0);

        metadata.addNew('custom', FIELD_LABEL, 'custom help');
        expect(metadata.items().count()).toBe(1);

        contentProfiles.openContentProfileSettings();
        contentProfiles.addNew('Simple', 'text');

        contentProfiles.editContentFields();

        const buttons = element.all(by.partialButtonText(FIELD_LABEL));

        browser.wait(ECE.hasElementCount(buttons, 0));

        contentProfiles.openAddFieldDropdown();

        browser.wait(ECE.hasElementCount(buttons, 1));
    });
});
