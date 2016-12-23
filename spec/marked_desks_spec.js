
var route = require('./helpers/utils').route,
    monitoring = require('./helpers/monitoring'),
    search = require('./helpers/search'),
    authoring = require('./helpers/authoring'),
    workspace = require('./helpers/workspace'),
    highlights = require('./helpers/highlights'),
    desks = require('./helpers/desks');

describe('marked desks', () => {
    describe('marking a story for a desk:', () => {
        beforeEach(route('/workspace/monitoring'));

        it('displays the story in desk output stage', () => {
            // Setup Desk Monitoring Settings
            expect(workspace.getCurrentDesk()).toEqual('POLITIC DESK');
            desks.openDesksSettings();
            desks.showMonitoringSettings('POLITIC DESK');
            monitoring.turnOffDeskWorkingStage(0);
            monitoring.openMonitoring();

            // mark for desk in monitoring in list
            monitoring.actionOnItemSubmenu('Mark for desk', 'Sports Desk', 1, 0);
            monitoring.checkMarkedForDesk('Sports Desk', 1, 0);

            // mark for desk in monitoring in edit
            monitoring.actionOnItem('Edit', 1, 2);
            authoring.markForDesks();
            highlights.selectDesk(authoring.getSubnav(), 'Sports Desk');
            monitoring.checkMarkedForDesk('Sports Desk', 1, 2);

            // mark for desk in search
            search.openGlobalSearch();
            search.setListView();
            search.actionOnSubmenuItem('Mark for desk', 'Sports Desk', 3);
            search.checkMarkedForDesk('Sports Desk', 3);

            // search by marked desk field
            expect(search.getItems().count()).toBe(14);
            search.openFilterPanel();
            search.openParameters();
            search.selectMarkedDesk(1);
            search.goButton.click();
            expect(search.getItems().count()).toBe(3);

            // check the marked items in output stage of marked desk
            monitoring.openMonitoring();
            monitoring.switchToDesk('SPORTS DESK');
            expect(monitoring.getGroupItems(5).count()).toBe(3);

            // Remove the marked desk
            monitoring.removeFromFirstDesk(5, 1);
            expect(monitoring.getGroupItems(5).count()).toBe(2);
        });
    });
});
