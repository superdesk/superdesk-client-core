'use strict';

var monitoring = require('./helpers/monitoring'),
    authoring = require('./helpers/authoring'),
    publishQueue = require('./helpers/publish_queue'),
    workspace = require('./helpers/workspace'),
    desks = require('./helpers/desks');

describe('publishing', function() {
    beforeEach(function() {
        desks.openDesksSettings();
        desks.showMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0);
        monitoring.openMonitoring();
        expect(workspace.getCurrentDesk()).toEqual('POLITIC DESK');

        expect(monitoring.getTextItem(1, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 1, 0);
        authoring.publish();
        publishQueue.openPublishQueue();
    });

    it('publish using HTTP Push delivery type', function() {
        expect(publishQueue.getHeadline(0).getText()).toMatch(/item5/);
        expect(publishQueue.getDestination(0).getText()).toMatch(/HTTP Push/);
    });

    it('can preview content', function() {
        publishQueue.previewAction(0);
        expect(publishQueue.getPreviewTitle()).toBe('item5');
    });

    it('can search item by headline', function() {
        publishQueue.searchAction('item5');
        expect(publishQueue.getItemCount()).toBe(1);
        publishQueue.searchAction('item6');
        browser.sleep(100);
        expect(publishQueue.getItemCount()).toBe(0);
    });

    it('can search item by unique name', function() {
        var _uniqueName = publishQueue.getUniqueName(0).getText();
        publishQueue.searchAction(_uniqueName);
        expect(publishQueue.getItemCount()).toBe(1);
    });
});
