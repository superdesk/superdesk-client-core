/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import {element, by, browser} from 'protractor';
import {monitoring} from './helpers/monitoring';
import {workspace} from './helpers/workspace';
import {authoring} from './helpers/authoring';
import {assertToastMsg, refresh} from './helpers/utils';
import {desks} from './helpers/desks';
import {contentProfiles} from './helpers/content_profiles';
import {ECE, els} from '@superdesk/end-to-end-testing-helpers';

describe('desks', () => {
    beforeEach(() => {
        desks.openDesksSettings();
    });

    it('edit desk', () => {
        desks.edit('Politic Desk');
        desks.deskDescriptionElement().sendKeys('New Description');
        desks.deskSourceElement().sendKeys('Test');
        desks.setDeskType('production');
        desks.setDeskContentExpiry(1, 10);
        desks.setDeskDefaultContentTemplate('testing');
        desks.setDeskDefaultContentProfile('testing');
        desks.actionSaveAndContinueOnGeneralTab();
        desks.showTab('macros');
        // expect(desks.listedMacros.count()).toBeGreaterThan(0);
        desks.save();
        desks.edit('Politic Desk');
        expect(desks.deskDescriptionElement().getAttribute('value')).toEqual('New Description');
        expect(desks.deskSourceElement().getAttribute('value')).toEqual('Test');
        expect(desks.getDeskType().getAttribute('value')).toEqual('production');
        expect(desks.getDeskContentExpiryHours().getAttribute('value')).toEqual('1');
        expect(desks.getDeskContentExpiryMinutes().getAttribute('value')).toEqual('10');
        desks.close();

        // add a new desk
        desks.openDesksSettings();
        desks.getNewDeskButton().click();
        desks.deskNameElement().sendKeys('Test Desk');
        desks.deskDescriptionElement().sendKeys('Test Description');
        desks.deskSourceElement().sendKeys('Test Source');
        desks.setDeskType('authoring');
        desks.setDeskContentExpiry(10, 1);
        desks.setDeskDefaultContentTemplate('testing');
        desks.setDeskDefaultContentProfile('testing');
        desks.actionSaveAndContinueOnGeneralTab();
        desks.showTab('macros');
        desks.save();
        desks.edit('Test Desk');
        expect(desks.deskNameElement().getAttribute('value')).toEqual('Test Desk');
        expect(desks.deskDescriptionElement().getAttribute('value')).toEqual('Test Description');
        expect(desks.deskSourceElement().getAttribute('value')).toEqual('Test Source');
        expect(desks.getDeskType().getAttribute('value')).toEqual('authoring');
        expect(desks.getDeskContentExpiryHours().getAttribute('value')).toEqual('10');
        expect(desks.getDeskContentExpiryMinutes().getAttribute('value')).toEqual('1');
        desks.close();

        // add desk with Done action
        desks.openDesksSettings();
        desks.getNewDeskButton().click();
        desks.deskNameElement().sendKeys('Test Desk2');
        desks.deskDescriptionElement().sendKeys('Test Description2');
        desks.deskSourceElement().sendKeys('Test Source');
        desks.setDeskType('authoring');
        desks.setDeskContentExpiry(10, 1);
        desks.setDeskDefaultContentTemplate('testing');
        desks.setDeskDefaultContentProfile('testing');
        desks.actionSaveAndContinueOnGeneralTab();
        desks.showTab('macros');
        desks.save();
        desks.edit('Test Desk2');
        expect(desks.deskNameElement().getAttribute('value')).toEqual('Test Desk2');
        expect(desks.deskDescriptionElement().getAttribute('value')).toEqual('Test Description2');
        expect(desks.deskSourceElement().getAttribute('value')).toEqual('Test Source');
        expect(desks.getDeskType().getAttribute('value')).toEqual('authoring');
        expect(desks.getDeskContentExpiryHours().getAttribute('value')).toEqual('10');
        expect(desks.getDeskContentExpiryMinutes().getAttribute('value')).toEqual('1');
        desks.close();

        // add desk reflects default stage count
        desks.openDesksSettings();
        desks.getNewDeskButton().click();
        desks.deskNameElement().sendKeys('Test Desk3');
        desks.deskDescriptionElement().sendKeys('Test Description');
        desks.deskSourceElement().sendKeys('Test Source');
        desks.setDeskType('authoring');
        desks.setDeskDefaultContentTemplate('testing');
        desks.setDeskDefaultContentProfile('testing');
        desks.actionDoneOnGeneralTab();
        expect(desks.getStageCount('Test Desk')).toEqual('2');

        // add another workingstage and assert the first working stage is deletable
        desks.edit('Test Desk3');
        desks.showTab('Stages');
        desks.getNewStageButton().click();
        desks.stageNameElement().sendKeys('Test Stage');
        desks.stageDescriptionElement().sendKeys('Test Stage Description');
        desks.toggleWorkingStageFlag();
        desks.saveNewStage();
        desks.confirmStageDeleteButton('Working Stage');

        // try to delete working stage will display error message
        desks.editStage('Test Stage');
        desks.toggleWorkingStageFlag();
        desks.saveEditedStage();
        assertToastMsg('error', 'Must have one working stage');

        // Turning Incoming flag ON should turn global read flag ON automatically
        desks.editStage('Test Stage');
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeTruthy();
        desks.toggleGlobalReadFlag();
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeFalsy();

        expect(desks.getIncomingFlag().getAttribute('checked')).toBeFalsy();
        expect(desks.getGlobalReadFlag().getAttribute('class')).not.toContain('prevent-off');
        // Turn ON Incoming flag
        desks.toggleIncomingStageFlag();
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeTruthy();
        // Now try GlobalReadFlag to OFF, and expect GlobalReadFlag cannot be turn ON since Incoming flag is ON
        expect(desks.getGlobalReadFlag().getAttribute('class')).toContain('prevent-off');
    });

    it('can set stage macro for new desk', () => {
        // Start by entering the details in the `General` tab
        desks.newDeskBtn.click();
        desks.deskNameElement().sendKeys('Test Desk A');
        desks.deskSourceElement().sendKeys('Test Source A');
        desks.setDeskType('authoring');
        desks.setDeskDefaultContentTemplate('testing');
        desks.setDeskDefaultContentProfile('testing');
        desks.actionSaveAndContinueOnGeneralTab();

        // Now create a new stage
        desks.getNewStageButton().click();
        desks.stageNameElement().sendKeys('Test Stage A');
        desks.stageDescriptionElement().sendKeys('Test Desk A Stage A Description');

        // Make sure the macros have loaded
        expect(desks.getStageMacros().count()).not.toBe(0);

        // Now set the stage macros
        desks.setStageIncomingMacro('populate_abstract');
        desks.setStageMovedOntoMacro('Validate for Publish');
        desks.setStageOutgoingMacro('populate_abstract');
        desks.saveNewStage();

        // Save changes and exit the desk config
        desks.actionSaveAndContinueOnStagesTab();
        desks.showTab('macros');
        desks.save();

        // Now re-open the desk to make sure the changes have been applied
        desks.edit('Test Desk A');
        desks.showTab('Stages');
        desks.editStage('Test Stage A');
        expect(desks.getStageIncomingMacro().getAttribute('value')).toEqual('populate_abstract');
        expect(desks.getStageMovedOntoMacro().getAttribute('value')).toEqual('Validate for Publish');
        expect(desks.getStageOutgoingMacro().getAttribute('value')).toEqual('populate_abstract');
        desks.close();

        // And clean up the desk we created
        desks.remove('Test Desk A');
    });

    it('can enforce incoming, outgoing and onstage rules', () => {
        // Send stories go to incoming stage
        desks.newDeskBtn.click();
        desks.deskNameElement().sendKeys('Test Desk');
        desks.deskSourceElement().sendKeys('Test Source A');
        desks.setDeskType('authoring');
        desks.setDeskDefaultContentTemplate('testing');
        desks.setDeskDefaultContentProfile('testing');
        desks.actionSaveAndContinueOnGeneralTab();

        desks.getNewStageButton().click();
        desks.stageNameElement().sendKeys('Test Stage A');
        desks.stageDescriptionElement().sendKeys('Test Desk A Stage A Description');
        desks.setStageIncomingMacro('Validate for Publish');
        desks.saveNewStage();

        desks.getNewStageButton().click();
        desks.stageNameElement().sendKeys('Test Stage B');
        desks.stageDescriptionElement().sendKeys('Test Desk B Stage B Description');
        desks.setStageOutgoingMacro('Validate for Publish');
        desks.saveNewStage();

        desks.getNewStageButton().click();
        desks.stageNameElement().sendKeys('Test Stage C');
        desks.stageDescriptionElement().sendKeys('Test Desk C Stage C Description');
        desks.setStageMovedOntoMacro('Validate for Publish');
        desks.saveNewStage();

        desks.showTab('people');
        desks.addUser('admin');
        desks.close();

        // update the content profile
        contentProfiles.openContentProfileSettings();
        contentProfiles.edit('testing');
        contentProfiles.setRequired('Subject');
        contentProfiles.editContentFields();
        contentProfiles.setRequired('Body HTML');
        contentProfiles.update();

        // confirm story is created on working stage
        monitoring.openMonitoring();
        refresh();
        workspace.selectDesk('Test Desk');
        authoring.createTextItemFromTemplate('testing');
        authoring.writeTextToHeadlineFromRecentTemplate('new item');
        authoring.save();

        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, els(['monitoring-group']).get(0)),
            1,
        ));

        // confirm incoming rule kicks in
        authoring.sendTo('Test Desk', 'Test Stage A');
        // FIXME: Improve error messages
        assertToastMsg('error', 'Error:["BODY HTML is a required field", "SUBJECT is a required field"]'
            + ' in incoming rule:Validate for Publish for stage:Test Stage A');

        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, els(['monitoring-group']).get(2)),
            0,
        ));

        authoring.closeSendAndPublish();
        authoring.close();

        // confirm onstage rule kicks in
        monitoring.actionOnItem('Edit', 0, 0);
        authoring.sendTo('Test Desk', 'Test Stage C');
        // FIXME: Improve error messages
        assertToastMsg('error', 'Error:["BODY HTML is a required field", "SUBJECT is a required field"]'
            + ' in onstage rule:Validate for Publish for stage:Test Stage C');
        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, els(['monitoring-group']).get(4)),
            1,
        ));

        authoring.closeSendAndPublish();
        authoring.close();

        // confirm outgoing rule kicks in
        monitoring.actionOnItem('Edit', 4, 0);
        authoring.sendTo('Test Desk', 'Test Stage B');
        monitoring.actionOnItem('Edit', 3, 0);
        authoring.sendTo('Test Desk', 'Test Stage A');
        // FIXME: Improve error messages
        assertToastMsg('error', 'Error:["BODY HTML is a required field", "SUBJECT is a required field"]'
            + ' in outgoing rule:Validate for Publish for stage:Test Stage B');
        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, els(['monitoring-group']).get(3)),
            1,
        ));
        browser.wait(ECE.hasElementCount(
            els(['article-item'], null, els(['monitoring-group']).get(2)),
            0,
        ));
    });
});
