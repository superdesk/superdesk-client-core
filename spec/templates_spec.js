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
    monitoring = require('./helpers/monitoring'),
    workspace = require('./helpers/workspace'),
    authoring = require('./helpers/authoring');

describe('templates', () => {
    it('can manage templates', () => {
        // add a new template
        templates.openTemplatesSettings();
        templates.add();
        templates.getTemplateNameElement().sendKeys('New Template');
        templates.setTemplateType('string:create');
        templates.selectDesk('Politic Desk');
        templates.selectDesk('Sports Desk');
        templates.toggleMetadata();
        templates.toggleLegal();
        authoring.setHeaderSluglineText('Test Template');
        authoring.writeTextToHeadline('New Item');
        authoring.writeText('This is body from the template');
        authoring.writeSignoffText('ABC');
        templates.save();
        expect(templates.getListCount()).toBeGreaterThan(2);
        templates.edit('New Template');
        templates.toggleMetadata();
        expect(templates.getLegalSwitch().getAttribute('checked')).toEqual('true');
        expect(authoring.getHeadlineText()).toEqual('New Item');
        expect(authoring.getBodyText()).toEqual('This is body from the template');
        expect(authoring.getSignoffText()).toBe('ABC');
        templates.cancel();

        // check the New Template is accessable from both desks
        monitoring.openMonitoring();
        workspace.selectDesk('Sports Desk');
        authoring.createTextItemFromTemplate('new');
        expect(authoring.getBodyText()).toBe('This is body from the template');
        expect(authoring.getHeaderSluglineText()).toBe('Test Template');
        expect(authoring.getHeadlineText()).toBe('New Item');

        authoring.close();
        workspace.selectDesk('Politic Desk');
        authoring.createTextItemFromTemplate('new');
        expect(authoring.getBodyText()).toBe('This is body from the template');
        expect(authoring.getHeaderSluglineText()).toBe('Test Template');
        expect(authoring.getHeadlineText()).toBe('New Item');
        authoring.close();

        // add a new auto-create template
        templates.openTemplatesSettings();
        templates.add();
        templates.getTemplateNameElement().sendKeys('Second New Template');
        templates.setTemplateType('string:create');
        templates.selectDesk('Politic Desk');
        templates.selectDesk('Sports Desk');
        templates.toggleAutomaticItemCreation();
        templates.selectWeekDay('Tuesday');
        templates.setTime(10, 30);
        templates.selectScheduleDesk('Politic Desk');
        templates.selectScheduleStage('one');
        templates.save();
        expect(templates.getListCount()).toBeGreaterThan(3);
        templates.edit('Second New Template');
        expect(templates.getTemplateNameElement().getAttribute('value')).toEqual('second new template');
        expect(templates.getTemplateType().getAttribute('value')).toEqual('string:create');
        expect(templates.getDeskElement('Politic Desk').element(by.className('sd-checkbox'))
            .getAttribute('checked')).toEqual('true');
        expect(templates.getDeskElement('Sports Desk').element(by.className('sd-checkbox'))
            .getAttribute('checked')).toEqual('true');
        expect(templates.getAutomaticItemCreationElement().getAttribute('checked')).toEqual('true');
        expect(templates.getWeekDayElement('Tuesday').element(by.className('sd-checkbox'))
            .getAttribute('class')).toContain('checked');
        expect(templates.getTimeElement().getAttribute('value')).toEqual('10:30');
        expect(templates.getDeskScheduleElement('Politic Desk')
            .getAttribute('selected')).toEqual('true');
        expect(templates.getStageScheduleElement('one').getAttribute('selected')).toEqual('true');
        templates.cancel();


        templates.getListCount().then((count) => {
            templates.remove('Second New Template');
            expect(templates.getListCount()).toBeLessThan(count);
        });

        // cannot save empty template
        templates.openTemplatesSettings();
        templates.add();
        templates.save();
        expect(templates.getSaveButton().isEnabled()).toBe(false);
    });
});
