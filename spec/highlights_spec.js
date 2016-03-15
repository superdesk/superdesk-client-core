
var route = require('./helpers/utils').route,
    monitoring = require('./helpers/monitoring'),
    search = require('./helpers/search'),
    authoring = require('./helpers/authoring'),
    workspace = require('./helpers/workspace'),
    highlights = require('./helpers/highlights'),
    desks = require('./helpers/desks');

describe('highlights', function() {
    'use strict';

    describe('add highlights configuration:', function() {
        beforeEach(route('/settings/highlights'));

        it('highlights management', function() {
            //add highlights configuration with one desk
            highlights.add();
            highlights.setName('highlight new');
            highlights.setTemplate('custom_highlight');
            highlights.toggleDesk('Sports Desk');
            highlights.save();
            expect(highlights.getRow('highlight new').count()).toBe(1);
            highlights.edit('highlight new');
            expect(highlights.getTemplate()).toMatch('custom_highlight');
            highlights.expectDeskSelection('Sports Desk', true);
            highlights.cancel();

            //add highlights configuration with the same name'
            highlights.add();
            highlights.setName('Highlight one');
            highlights.save();
            expect(highlights.errorUniquenessElement().isDisplayed()).toBeTruthy();
            highlights.cancel();
            expect(highlights.getRow('Highlight one').count()).toBe(1);

            //display limit error on exceeding character limit(i.e: 40) in highlight name field
            highlights.add();
            highlights.setName('Highlights greater than Fourty characters'); // 41 characters
            expect(highlights.errorLimitsElement().isDisplayed()).toBeTruthy();
            expect(highlights.btnSave.isEnabled()).toBe(false);
            highlights.setName('Highlights less than Fourty characters'); // 38 characters
            expect(highlights.errorLimitsElement().isDisplayed()).toBeFalsy();
            expect(highlights.btnSave.isEnabled()).toBe(true);
            highlights.cancel();

            //add highlights configuration with no desk
            highlights.add();
            highlights.setName('highlight no desk');
            highlights.save();
            expect(highlights.getRow('highlight no desk').count()).toBe(1);

            //set default template for highlight configuration
            highlights.edit('highlight one');
            highlights.setTemplate('default');
            highlights.save();
            highlights.edit('highlight one');
            expect(highlights.getTemplate()).toMatch('');
            highlights.cancel();

            //change the name of highlight configuration
            highlights.edit('highlight one');
            highlights.setName('highlight new name');
            highlights.save();
            expect(highlights.getRow('highlight new name').count()).toBe(1);
            expect(highlights.getRow('highlight one').count()).toBe(0);

            //add a desk to highlight configuration
            highlights.edit('highlight new name');
            highlights.expectDeskSelection('Politic Desk', false);
            highlights.toggleDesk('Politic Desk');
            highlights.save();
            highlights.edit('highlight new name');
            highlights.expectDeskSelection('Politic Desk', true);
            highlights.cancel();

            //delete a desk from highlight configuration
            highlights.edit('highlight three');
            highlights.expectDeskSelection('Politic Desk', true);
            highlights.toggleDesk('Politic Desk');
            highlights.save();
            highlights.edit('highlight three');
            highlights.expectDeskSelection('Politic Desk', false);
            highlights.cancel();

            //delete highlight configuration'
            expect(highlights.getRow('highlight four').count()).toBe(1);
            highlights.remove('highlight four');
            expect(highlights.getRow('highlight four').count()).toBe(0);
        });
    });

    describe('mark for highlights in a desk:', function() {
        beforeEach(route('/workspace/monitoring'));

        xit('create highlight package', function() {
            // Setup Desk Monitoring Settings
            expect(workspace.getCurrentDesk()).toEqual('POLITIC DESK');
            desks.openDesksSettings();
            desks.showMonitoringSettings('POLITIC DESK');
            monitoring.turnOffDeskWorkingStage(0);

            monitoring.openMonitoring();

            //mark for highlight in monitoring
            monitoring.actionOnItemSubmenu('Mark for highlight', 'Highlight two', 1, 0);
            monitoring.actionOnItemSubmenu('Mark for highlight', 'Highlight three', 1, 2);
            monitoring.checkMarkedForHighlight('Highlight two', 1, 0);
            monitoring.checkMarkedForHighlight('Highlight three', 1, 2);

            //mark for highlight in authoring
            monitoring.actionOnItem('Edit', 1, 1);
            authoring.markForHighlights();
            expect(highlights.getHighlights(authoring.getSubnav()).count()).toBe(3);
            highlights.selectHighlight(authoring.getSubnav(), 'Highlight two');
            authoring.checkMarkedForHighlight('Highlight two');
            search.openGlobalSearch();
            monitoring.openMonitoring();
            monitoring.checkMarkedForHighlight('Highlight two', 1, 1);

            //multi mark for highlights
            monitoring.selectItem(1, 3);
            monitoring.selectItem(2, 0);
            highlights.multiMarkHighlight('Highlight two');
            monitoring.checkMarkedForHighlight('Highlight two', 1, 3);
            monitoring.checkMarkedForHighlight('Highlight two', 2, 0);

            //multi mark for highlights, in case of partial mark for selected items
            monitoring.selectItem(2, 1);
            monitoring.selectItem(2, 2);
            highlights.multiMarkHighlight('Highlight two');
            monitoring.checkMarkedForHighlight('Highlight two', 2, 1);
            monitoring.checkMarkedForHighlight('Highlight two', 2, 2);

            //Highlighting two items out of which first is already highlighted should retain it's highlight mark
            monitoring.checkMarkedForHighlight('Highlight two', 2, 2);
            //now multi select this already highlighted item(2, 2) and other item(2, 3) for highlight
            monitoring.selectItem(2, 2);
            monitoring.selectItem(2, 3);
            highlights.multiMarkHighlight('Highlight two');
            //now check if previously highlighted item(2,2) still retains it's marked highlight
            monitoring.checkMarkedForHighlight('Highlight two', 2, 2);
            monitoring.checkMarkedForHighlight('Highlight two', 2, 3);

            //create the highlight and add a item to it
            highlights.createHighlightsPackage('Highlight two');
            workspace.actionOnItemSubmenu('Add to current', 'one', 3);
            expect(authoring.getGroupItems('one').count()).toBe(3);

            //from monitoring add an item to highlight package
            workspace.showList('Monitoring');
            monitoring.actionOnItemSubmenu('Add to current', 'two', 2, 3);
            expect(authoring.getGroupItems('two').count()).toBe(1);

            //change desk on highlights
            workspace.showHighlightList('Highlight one');
            workspace.selectDesk('SPORTS DESK');
            expect(browser.getLocationAbsUrl()).toMatch('/monitoring');

            //show highlight three and add an item to highlight package two
            workspace.selectDesk('POLITIC DESK');
            workspace.showHighlightList('Highlight three');
            expect(authoring.getGroupItems('two').count()).toBe(1);
            workspace.actionOnItemSubmenu('Add to current', 'two', 0);
            expect(authoring.getGroupItems('two').count()).toBe(2);

            //export highlight
            authoring.save();
            highlights.exportHighlights();
            //not all items are published so confirm export modal is showed
            highlights.exportHighlightsConfirm();

            //check that the new highlight package and generated list are on personal
            workspace.showList('Monitoring');

            desks.openDesksSettings();
            desks.showMonitoringSettings('POLITIC DESK');
            monitoring.turnOffDeskWorkingStage(0);
            monitoring.openMonitoring();

            expect(monitoring.getTextItem(5, 0)).toBe('Highlight two');
            expect(monitoring.getTextItem(5, 1)).toBe('Highlight two');

            //close generated content item
            authoring.close();
            highlights.saveTextHighlightsConfirm();
            expect(monitoring.getTextItem(5, 0)).toBe('Highlight two');
            expect(monitoring.getTextItem(5, 1)).toBe('Highlight two');
        });
    });
});
