import {browser} from 'protractor';

import {assertToastMsg, nav, getListOption} from './helpers/utils';
import {ingestSettings} from './helpers/pages';

describe('ingest_settings', () => {
    beforeEach((done) => {
        nav('/settings/ingest').then(done);
    });

    it('contains the Schedule tab for editing routing schedules', () => {
        var ruleSettings,
            tzOption;

        // Open the routing scheme edit modal under the Routing tab and set
        // routing scheme name.
        // Then add a new routing rule and set its name, and open the Schedule
        // settings pane
        ingestSettings.tabs.routingTab.click();
        ingestSettings.newSchemeBtn.click();
        ingestSettings.schemeNameInput.sendKeys('My Routing Scheme');

        ruleSettings = ingestSettings.routingRuleSettings;
        ingestSettings.newRoutingRuleBtn.click();
        ingestSettings.newDeskRoutingRuleBtn.click();
        ruleSettings.ruleNameInput.sendKeys('Routing Rule 1');

        // one the Schedule tab now, set a few scheduling options...
        // de-select Saturday and Sunday
        ruleSettings.daysButtons.sat.click();
        ruleSettings.daysButtons.sun.click();

        // untick the all day
        ruleSettings.allDayCheckBox.click();

        // pick the time zone
        ruleSettings.timezoneLabel.click();
        ruleSettings.timezoneDeleteBtn.click();
        ruleSettings.timezoneInput.sendKeys('Asia/Singapore');
        tzOption = ruleSettings.timezoneList;

        browser.wait(() => tzOption.isDisplayed(), 3000);

        tzOption.click();

        // save the routing scheme and check that it was successfull
        ingestSettings.saveBtn.click();

        assertToastMsg('success', 'Routing scheme saved');
    });

    it('cannot save a routing scheme with blank rule', () => {
        ingestSettings.tabs.routingTab.click();
        ingestSettings.newSchemeBtn.click();
        ingestSettings.writeTextToSchemeName('Test Scheme');
        ingestSettings.newRoutingRuleBtn.click();
        ingestSettings.newDeskRoutingRuleBtn.click();

        expect(ingestSettings.getTextfromRuleName()).toBe('');
        expect(ingestSettings.saveBtn.getAttribute('disabled')).toBeTruthy();

        ingestSettings.writeTextToRuleName('Test Rule');
        expect(ingestSettings.getTextfromRuleName()).toBe('Test Rule');
        expect(ingestSettings.saveBtn.getAttribute('disabled')).toBeFalsy();
    });
});
