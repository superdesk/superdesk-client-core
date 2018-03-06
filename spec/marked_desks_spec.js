
var monitoring = require('./helpers/monitoring'),
    route = require('./helpers/utils').route,
    globalSearch = require('./helpers/search'),
    authoring = require('./helpers/authoring'),
    workspace = require('./helpers/workspace'),
    highlights = require('./helpers/highlights'),
    desks = require('./helpers/desks');

describe('marked desks', () => {
    function setupAttentionDeskAsSavedSearch() {
        // Create global saved search called 'Attention Sports'
        element(by.id('save_search_init')).click();
        let searchPanel = element(by.className('save-search-panel'));

        searchPanel.all(by.id('search_name')).sendKeys('Attention Sports');
        searchPanel.all(by.id('search_description')).sendKeys('Stories attention to sports');
        searchPanel.all(by.id('search_global')).click();
        searchPanel.all(by.id('search_save')).click();
        let savedSearch = element.all(by.repeater('search in userSavedSearches')).get(0);

        expect(savedSearch.element(by.css('.search-name')).getText()).toBe('Attention Sports [Global]');

        // setup desk monitoring settings to turn ON Attention Sports saved search for Sports Desk
        desks.openDesksSettings();
        desks.showMonitoringSettings('SPORTS DESK');
        monitoring.toggleDesk(1);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(0);
        monitoring.saveSettings();

        monitoring.openMonitoring();
    }

    describe('marking a story for a desk:', () => {
        beforeEach(route('/workspace/monitoring'));

        it('displays the story in desk attention stage', () => {
            expect(workspace.getCurrentDesk()).toEqual('POLITIC DESK');

            // mark for desk in monitoring in list
            monitoring.actionOnItemSubmenu('Mark for desk', 'Sports Desk', 2, 0);
            monitoring.checkMarkedForDesk('Sports Desk', 2, 0);
            monitoring.closeMarkedForDeskPopup();

            // mark for desk in monitoring in edit
            monitoring.actionOnItem('Edit', 2, 2);
            authoring.markForDesks();
            highlights.selectDesk(authoring.getSubnav(), 'Sports Desk');
            monitoring.checkMarkedForDesk('Sports Desk', 2, 2);

            // mark for desk in globalSearch
            globalSearch.openGlobalSearch();
            globalSearch.setListView();
            globalSearch.actionOnSubmenuItem('Mark for desk', 'Sports Desk', 3);
            globalSearch.checkMarkedForDesk('Sports Desk', 3);

            // search by marked desk field
            expect(globalSearch.getItems().count()).toBe(14);
            globalSearch.openFilterPanel();

            // make only production and published repos selected (unselect ingest and archived)
            globalSearch.ingestRepo.click();
            globalSearch.archivedRepo.click();

            globalSearch.openParameters();
            globalSearch.selectMarkedDesk(1); // selects Sports Desk
            globalSearch.goButton.click();
            expect(globalSearch.getItems().count()).toBe(3);

            // now setup attention desk of just selected Marked desk(Sports Desk) as global saved search
            setupAttentionDeskAsSavedSearch();

            // check the marked items in attention stage of marked desk
            monitoring.switchToDesk('SPORTS DESK');
            expect(monitoring.getGroupItems(0).count()).toBe(3);

            // Remove the marked desk
            monitoring.removeFromFirstDesk(0, 1);
            expect(monitoring.getGroupItems(0).count()).toBe(2);
        });
    });
});
