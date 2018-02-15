var nav = require('./helpers/utils').nav,
    workspace = require('./helpers/pages').workspace,
    content = require('./helpers/pages').content,
    monitoring = require('./helpers/monitoring');

describe('spike', () => {
    beforeEach((done) => {
        nav('/workspace/content').then(done);
    });

    it('can spike item', () => {
        workspace.switchToDesk('PERSONAL');
        content.setListView();

        var personalCount;

        content.getItems().count()
            .then((count) => {
                personalCount = count;
            });

        content.actionOnItem('Spike Item', 0, null, true);

        // check that there are less items than before
        browser.wait(() => content.getItems().count()
            .then((count) => count < personalCount), 3000);
    });

    it('can spike and unspike multiple items', () => {
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
