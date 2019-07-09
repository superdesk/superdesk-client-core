import {element, browser, protractor, by, $} from 'protractor';

import {monitoring} from './helpers/monitoring';
import {workspace} from './helpers/workspace';
import {globalSearch} from './helpers/search';
import {authoring} from './helpers/authoring';
import {highlights} from './helpers/highlights';
import {route, ctrlShiftKey} from './helpers/utils';
import {desks} from './helpers/desks';

describe('highlights', () => {
    describe('add highlights configuration:', () => {
        beforeEach(route('/settings/highlights'));

        it('highlights management', () => {
            // add highlights configuration with one desk and open it in monitoring
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
            monitoring.openMonitoring();
            workspace.selectDesk('Sports Desk');
            workspace.showHighlightList('highlight new');
            expect(highlights.getHighlightTitle()).toMatch('highlight new');

            // add highlights configuration with the same name'
            highlights.get();
            highlights.add();
            highlights.setName('Highlight one');
            highlights.save();
            expect(highlights.errorUniquenessElement().isDisplayed()).toBeTruthy();
            highlights.cancel();
            expect(highlights.getRow('Highlight one').count()).toBe(1);

            // display limit error on exceeding character limit(i.e: 40) in highlight name field
            highlights.add();
            highlights.setName('Highlights greater than Fourty characters'); // 41 characters
            expect(highlights.errorLimitsElement().isDisplayed()).toBeTruthy();
            expect(highlights.btnSave.isEnabled()).toBe(false);
            highlights.setName('Highlights less than Fourty characters'); // 38 characters
            expect(highlights.errorLimitsElement().isDisplayed()).toBeFalsy();
            expect(highlights.btnSave.isEnabled()).toBe(true);
            highlights.cancel();

            // add highlights configuration with no desk and open it from all desks
            highlights.add();
            highlights.setName('highlight no desk');
            highlights.save();
            expect(highlights.getRow('highlight no desk').count()).toBe(1);
            monitoring.openMonitoring();
            workspace.selectDesk('Sports Desk');
            workspace.showHighlightList('highlight no desk');
            workspace.selectDesk('Politic Desk');
            workspace.showHighlightList('highlight no desk');

            // set default template for highlight configuration
            highlights.get();
            highlights.edit('highlight one');
            highlights.setTemplate('default');
            highlights.save();
            highlights.edit('highlight one');
            expect(highlights.getTemplate()).toMatch('');
            highlights.cancel();

            // change the name of highlight configuration
            highlights.edit('highlight one');
            highlights.setName('highlight new name');
            highlights.save();
            expect(highlights.getRow('highlight new name').count()).toBe(1);
            expect(highlights.getRow('highlight one').count()).toBe(0);

            // add a desk to highlight configuration
            highlights.edit('highlight new name');
            highlights.expectDeskSelection('Politic Desk', false);
            highlights.toggleDesk('Politic Desk');
            highlights.save();
            highlights.edit('highlight new name');
            highlights.expectDeskSelection('Politic Desk', true);
            highlights.cancel();
            monitoring.openMonitoring();
            workspace.selectDesk('Politic Desk');
            workspace.showHighlightList('highlight new name');

            // delete a desk from highlight configuration
            highlights.get();
            highlights.edit('highlight three');
            highlights.expectDeskSelection('Politic Desk', true);
            highlights.toggleDesk('Politic Desk');
            highlights.save();
            highlights.edit('highlight three');
            highlights.expectDeskSelection('Politic Desk', false);
            highlights.cancel();
            monitoring.openMonitoring();
            workspace.selectDesk('Politic Desk');
            expect(workspace.getHighlightListItem('highlight three').isPresent()).toBe(false);

            // delete highlight configuration'
            highlights.get();
            expect(highlights.getRow('highlight four').count()).toBe(1);
            highlights.remove('highlight four');
            expect(highlights.getRow('highlight four').count()).toBe(0);
        });
    });

    describe('mark for highlights in a desk:', () => {
        beforeEach(route('/workspace/monitoring'));

        it('keyboard shortcuts', () => {
            expect(workspace.getCurrentDesk()).toEqual('POLITIC DESK');
            monitoring.selectItem(2, 0);

            browser.sleep(1000);
            // trigger keyoard shortcut(ctrl+shift+^) for 'Mark for highlight'
            ctrlShiftKey('^');

            // focus to next highlight
            browser.actions().sendKeys(protractor.Key.DOWN)
                .perform();

            // press enter to mark highlight
            browser
                .actions()
                .sendKeys(protractor.Key.ENTER)
                .perform();
            browser.sleep(1000);

            // expect 'Highlight three' is marked
            monitoring.checkMarkedForHighlight('Highlight three', 2, 0);

            // again trigger keyoard shortcut for multimark
            ctrlShiftKey('^');

            // mark for first focused highlight in monitoring
            browser
                .actions()
                .sendKeys(protractor.Key.ENTER)
                .perform();
            browser.sleep(1000);

            // expect 'Highlight two' is marked
            monitoring.checkMarkedForMultiHighlight('Highlight four', 2, 0);
        });

        it('create highlight package', () => {
            // Setup Desk Monitoring Settings
            expect(workspace.getCurrentDesk()).toEqual('POLITIC DESK');
            desks.openDesksSettings();
            desks.showMonitoringSettings('POLITIC DESK');
            monitoring.turnOffDeskWorkingStage(0);
            monitoring.openMonitoring();

            // mark for highlight in monitoring
            monitoring.actionOnItemSubmenu('Mark for highlight', 'Highlight two', 1, 0);
            monitoring.actionOnItemSubmenu('Mark for highlight', 'Highlight three', 1, 2);
            monitoring.checkMarkedForHighlight('Highlight two', 1, 0);
            monitoring.checkMarkedForHighlight('Highlight three', 1, 2);
            monitoring.closeHighlightsPopup();

            // mark for highlight in authoring
            monitoring.actionOnItem('Edit', 1, 1);
            authoring.markForHighlights();
            expect(highlights.getHighlights(authoring.getSubnav()).count()).toBe(3);
            highlights.selectHighlight(authoring.getSubnav(), 'Highlight two');
            authoring.checkMarkedForHighlight('Highlight two');
            globalSearch.openGlobalSearch();
            monitoring.openMonitoring();
            monitoring.checkMarkedForHighlight('Highlight two', 1, 1);
            element(by.id('closeAuthoringBtn')).click();

            // multi mark for highlights
            highlights.get();
            highlights.add();
            highlights.setName('Highlight All Desks');
            highlights.save();
            monitoring.openMonitoring();
            workspace.selectDesk('Politic Desk');
            monitoring.selectItem(1, 3);
            monitoring.selectItem(2, 2);
            highlights.multiMarkHighlight('Highlight All Desks');
            monitoring.checkMarkedForHighlight('Highlight All Desks', 1, 3);
            monitoring.checkMarkedForHighlight('Highlight All Desks', 2, 2);

            // multi mark for highlights, in case of partial mark for selected items
            monitoring.selectItem(1, 0);
            monitoring.selectItem(2, 2);
            highlights.multiMarkHighlight('Highlight All Desks');
            monitoring.checkMarkedForHighlight('Highlight All Desks', 2, 2);
            monitoring.selectItem(2, 2); // to close the popup

            // Highlighting two items out of which first is already highlighted should retain it's highlight mark
            monitoring.actionOnItem('Edit', 2, 2);
            authoring.markForHighlights();
            highlights.selectHighlight(authoring.getSubnav(), 'Highlight two');
            monitoring.checkMarkedForMultiHighlight('Highlight All Desks', 2, 2);
            monitoring.checkMarkedForMultiHighlight('Highlight two', 2, 2);
            // now remove from the first highlight
            monitoring.removeFromFirstHighlight(2, 2);
            monitoring.checkMarkedForHighlight('Highlight two', 2, 2);

            // create the highlight and add a item to it
            monitoring.actionOnItemSubmenu('Mark for highlight', 'Highlight All Desks', 2, 2);
            highlights.createHighlightsPackage('Highlight All Desks');
            workspace.actionOnItemSubmenu('Add to current', 'main', 1);
            expect(authoring.getGroupItems('main').count()).toBe(1);
            expect(element(by.className('preview-container')).isPresent()).toBe(true);

            // from monitoring add an item to highlight package
            workspace.showList('Monitoring (alt+m)');
            monitoring.actionOnItemSubmenu('Add to current', 'main', 2, 3);
            expect(authoring.getGroupItems('main').count()).toBe(2);

            // change desk on highlights
            workspace.showHighlightList('Highlight four');
            workspace.selectDesk('SPORTS DESK');
            expect(browser.getCurrentUrl()).toMatch('/monitoring');

            // show highlight three and add an item to highlight package two
            workspace.selectDesk('POLITIC DESK');
            workspace.showHighlightList('Highlight three');
            expect(authoring.getGroupItems('main').count()).toBe(2);
            workspace.actionOnItemSubmenu('Add to current', 'main', 0);
            expect(authoring.getGroupItems('main').count()).toBe(3);

            // export highlight
            authoring.save();
            highlights.exportHighlights();
            // not all items are published so confirm export modal is showed
            highlights.exportHighlightsConfirm();

            // check that the new highlight package and generated list are on personal
            workspace.showList('Monitoring (alt+m)');
            desks.openDesksSettings();
            desks.showMonitoringSettings('POLITIC DESK');
            monitoring.turnOffDeskWorkingStage(0);
            monitoring.openMonitoring();
            expect(monitoring.getTextItem(5, 0)).toBe('Highlight All Desks');
            expect(monitoring.getTextItem(5, 1)).toBe('Highlight All Desks');
        });
    });
});
