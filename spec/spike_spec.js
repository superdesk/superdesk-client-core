/* eslint-disable newline-per-chained-call */

'use strict';

var openUrl = require('./helpers/utils').open,
    workspace = require('./helpers/pages').workspace,
    content = require('./helpers/pages').content,
    monitoring = require('./helpers/monitoring');

describe('spike', function() {
    beforeEach(function(done) {
        openUrl('/#/workspace/content').then(done);
    });

    it('can spike item', function() {
        workspace.switchToDesk('PERSONAL');
        content.setListView();

        var personalCount;
        content.getItems().count().then(function(count) {
            personalCount = count;
        });

        content.actionOnItem('Spike Item', 0);

        // check that there are less items than before
        browser.wait(function() {
            return content.getItems().count().then(function(count) {
                return count < personalCount;
            });
        }, 3000);
    });

    it('can spike and unspike multiple items', function() {
        monitoring.openMonitoring();

        monitoring.selectItem(2, 2);
        monitoring.selectItem(2, 3);

        content.spikeItems();

        monitoring.showSpiked();
        expect(monitoring.getAllItems().count()).toBe(2);

        content.selectItem(0);
        content.selectItem(1);
        content.unspikeItems();

        expect(monitoring.getAllItems().count()).toBe(0);
    });
});
