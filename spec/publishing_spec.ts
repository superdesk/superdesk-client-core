

var monitoring = require('./helpers/monitoring'),
    authoring = require('./helpers/authoring'),
    publishQueue = require('./helpers/publish_queue');

describe('publishing', () => {
    beforeEach(monitoring.openMonitoring);

    it('publish using HTTP Push delivery type and can preview content and search publish queue', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();

        publishQueue.openPublishQueue();
        expect(publishQueue.getHeadline(0).getText()).toMatch(/item5/);
        expect(publishQueue.getDestination(0).getText()).toMatch(/HTTP Push/);

        // can preview content
        publishQueue.previewAction(0);
        expect(publishQueue.getPreviewTitle()).toBe('item5');

        // can search item by headline
        publishQueue.searchAction('item5');
        expect(publishQueue.getItemCount()).toBe(1);
        publishQueue.searchAction('item6');
        browser.sleep(100);
        expect(publishQueue.getItemCount()).toBe(0);

        publishQueue.clearSearch();

        // can search item by unique name
        var _uniqueName = publishQueue.getUniqueName(0).getText();

        publishQueue.searchAction(_uniqueName);
        expect(publishQueue.getItemCount()).toBe(1);
    });
});
