/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

var templates = require('./helpers/templates'),
    authoring = require('./helpers/authoring');

describe('templates', () => {
    beforeEach(() => {
        templates.openTemplatesSettings();
    });

    it('can create a new template', () => {
        // add a new template
        templates.add();
        templates.getTemplateNameElement().sendKeys('New Template');
        templates.setTemplateType('string:create');
        templates.selectDesk('Politic Desk');
        templates.selectDesk('Sports Desk');

        templates.toggleMetadata();
        templates.toggleLegal();
        authoring.setHeaderSluglineText('Test Template');
        authoring.writeTextToHeadline('New Item');
        authoring.writeText('This is body');
        authoring.writeSignoffText('ABC');
        templates.save();
        expect(templates.getListCount()).toEqual(2);
        templates.edit('New Template');
        templates.toggleMetadata();
        expect(templates.getLegalSwitch().getAttribute('checked')).toEqual('true');
        expect(authoring.getHeadlineText()).toEqual('New Item');
        expect(authoring.getBodyText()).toEqual('This is body');
        expect(authoring.getSignoffText()).toBe('ABC');
    });


    it('can add auto-create template', () => {
        // add a new template
        templates.add();
        templates.getTemplateNameElement().sendKeys('New Template');
        templates.setTemplateType('string:create');
        templates.selectDesk('Politic Desk');
        templates.selectDesk('Sports Desk');
        templates.toggleAutomaticItemCreation();
        templates.selectWeekDay('Tuesday');
        templates.setTime(10, 30);
        templates.selectScheduleDesk('Politic Desk');
        templates.selectScheduleStage('one');
        templates.save();
        expect(templates.getListCount()).toEqual(2);
        templates.edit('New Template');
        expect(templates.getTemplateNameElement().getAttribute('value')).toEqual('new template');
        expect(templates.getTemplateType().getAttribute('value')).toEqual('string:create');
        expect(templates.getDeskElement('Politic Desk').element(by.className('sd-checkbox'))
                .getAttribute('checked')).toEqual('true');
        expect(templates.getDeskElement('Sports Desk').element(by.className('sd-checkbox'))
                .getAttribute('checked')).toEqual('true');
        expect(templates.getAutomaticItemCreationElement().getAttribute('checked')).toEqual('true');
        expect(templates.getWeekDayElement('Tuesday').getAttribute('class')).toContain('active');
        expect(templates.getTimeElement().getAttribute('value')).toEqual('10:30');
        expect(templates.getDeskScheduleElement('Politic Desk').getAttribute('selected')).toEqual('true');
        expect(templates.getStageScheduleElement('one').getAttribute('selected')).toEqual('true');
        templates.cancel();
        templates.remove('New Template');
        expect(templates.getListCount()).toEqual(1);
    });

    it('cannot save empty template', () => {
        templates.add();
        templates.save();
        expect(templates.getSaveButton().isEnabled()).toBe(false);
    });
});
