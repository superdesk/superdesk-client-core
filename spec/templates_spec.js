/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

var templates = require('./helpers/templates');

describe('templates', () => {
    beforeEach(() => {
        templates.openTemplatesSettings();
    });

    it('add create template', () => {
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
        expect(templates.getDeskElement('Politic Desk').getAttribute('checked')).toEqual('true');
        expect(templates.getDeskElement('Sports Desk').getAttribute('checked')).toEqual('true');
        expect(templates.getAutomaticItemCreationElement().getAttribute('checked')).toEqual('true');
        expect(templates.getWeekDayElement('Tuesday').getAttribute('class')).toContain('active');
        expect(templates.getTimeElement().getAttribute('value')).toEqual('10:30');
        expect(templates.getDeskScheduleElement('Politic Desk').getAttribute('selected')).toEqual('true');
        expect(templates.getStageScheduleElement('one').getAttribute('selected')).toEqual('true');
        templates.cancel();
        templates.remove('New Template');
        expect(templates.getListCount()).toEqual(1);
    });

    it('error adding empty template', () => {
        templates.add();
        templates.save();
        expect(templates.getValidationElement('template_name').getAttribute('class')).toContain('sd-invalid');
    });
});
