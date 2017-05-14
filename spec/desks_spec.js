/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

var desks = require('./helpers/desks');
var assertToastMsg = require('./helpers/utils').assertToastMsg;

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
        desks.actionSaveAndContinueOnGeneralTab();

        // Now create a new stage
        desks.getNewStageButton().click();
        desks.stageNameElement().sendKeys('Test Stage A');
        desks.stageDescriptionElement().sendKeys('Test Desk A Stage A Description');

        // Make sure the macros have loaded
        expect(desks.getStageMacros().count()).toBe(3);

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
});
