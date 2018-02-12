/* eslint-disable newline-per-chained-call */


var authoring = require('./helpers/authoring'),
    monitoring = require('./helpers/monitoring'),
    workspace = require('./helpers/workspace'),
    dashboard = require('./helpers/dashboard'),
    desks = require('./helpers/desks');

describe('monitoring', () => {
    // Opens desk settings and configure monitoring settings for the named desk
    function setupDeskMonitoringSettings(name) {
        desks.openDesksSettings();
        desks.showMonitoringSettings(name.toUpperCase());
    }

    it('configure a stage and show it on monitoring view', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0, false);

        monitoring.toggleStage(0, 1);
        monitoring.toggleStage(0, 2);
        monitoring.toggleStage(0, 4);
        monitoring.nextStages();
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 2)).toBe('item6');
    });

    it('can configure desk output as default when user switches desks and show it on monitoring view', () => {
        monitoring.openMonitoring();
        expect(monitoring.getGroups().count()).toBe(6);

        workspace.selectDesk('Sports Desk');
        expect(monitoring.getGroups().count()).toBe(6);
    });

    it('can display the item in Desk Output when it\'s been submitted to a production desk', () => {
        monitoring.openMonitoring();
        workspace.selectDesk('Sports Desk');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.sendTo('Politic Desk', 'two', true);
        expect(monitoring.getTextItem(5, 0)).toBe('item3');
    });

    it('can display the item in Desk Output when it\'s published in a production desk', () => {
        monitoring.openMonitoring();
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.publish();
        expect(monitoring.getTextItem(5, 0)).toBe('item6');
    });

    it('can display the item in Desk Output when it\'s scheduled for publish ', () => {
        monitoring.openMonitoring();
        expect(monitoring.getTextItem(3, 2)).toBe('item6');
        monitoring.actionOnItem('Edit', 3, 2);
        authoring.writeText('Two');
        authoring.save();
        authoring.schedule();
        expect(monitoring.getTextItem(5, 0)).toBe('item6');
    });

    it('configure personal and show it on monitoring view', () => {
        setupDeskMonitoringSettings('POLITIC DESK');

        monitoring.toggleDesk(0);
        monitoring.togglePersonal();
        monitoring.nextStages();
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 0)).toBe('item1');
        expect(monitoring.getTextItem(0, 1)).toBe('item2');
    });

    it('configure a saved search and show it on monitoring view', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.toggleDesk(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(0);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 0)).toBe('ingest1');
    });

    it('configure a stage and a saved search and show them on monitoring view', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.toggleStage(0, 0);
        monitoring.toggleStage(0, 1);
        monitoring.toggleStage(0, 2);
        monitoring.toggleStage(0, 4);
        monitoring.toggleDeskOutput(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(0);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 2)).toBe('item6');
        expect(monitoring.getTextItem(1, 0)).toBe('ingest1');
    });

    it('configure a stage and a saved search then unselect stage and show search on monitoring view',
        () => {
            setupDeskMonitoringSettings('POLITIC DESK');
            monitoring.turnOffDeskWorkingStage(0, false);

            monitoring.toggleStage(0, 1);
            monitoring.toggleStage(0, 2);
            monitoring.toggleStage(0, 4);
            monitoring.toggleDeskOutput(0);
            monitoring.nextStages();
            monitoring.toggleGlobalSearch(0);
            monitoring.nextSearches();
            monitoring.nextReorder();
            monitoring.saveSettings();

            desks.showMonitoringSettings('POLITIC DESK');
            monitoring.toggleStage(0, 3);
            monitoring.nextStages();
            monitoring.nextSearches();
            monitoring.nextReorder();
            monitoring.saveSettings();

            monitoring.openMonitoring();

            expect(monitoring.getTextItem(0, 0)).toBe('ingest1');
        });

    it('configure stage and search and then reorder', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0, false);

        monitoring.toggleStage(0, 1);
        monitoring.toggleStage(0, 2);
        monitoring.toggleStage(0, 4);
        monitoring.toggleDeskOutput(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(0);
        monitoring.toggleGlobalSearch(1);
        monitoring.nextSearches();
        monitoring.moveOrderItem(0, 1);
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 0)).toBe('ingest1');
        expect(monitoring.getTextItem(1, 2)).toBe('item6');

        desks.openDesksSettings();

        desks.showMonitoringSettings('POLITIC DESK');
        monitoring.nextStages();
        monitoring.nextSearches();
        expect(monitoring.getOrderItemText(0)).toBe('global saved search ingest1');
        expect(monitoring.getOrderItemText(1)).toBe('Politic Desk : two');
    });

    it('configure a stage, a saved search and personal and then set max items', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0, false);
        // Keep only stage one turn on and turn off the rest of stages
        monitoring.toggleStage(0, 1); // turn off incoming stage
        monitoring.toggleStage(0, 3); // turn off stage two
        monitoring.toggleStage(0, 4); // turn off stage three
        monitoring.toggleDeskOutput(0); // turn off deskoutput stage
        monitoring.togglePersonal(); // turn on personal
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(0); // turn on global search
        monitoring.nextSearches();
        monitoring.nextReorder();

        monitoring.setMaxItems(0, 2);
        monitoring.setMaxItems(1, 1);
        monitoring.setMaxItems(2, 1);

        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 1)).toBe('item9'); // expect stage one 2nd item
        expect(monitoring.getTextItem(1, 0)).toBe('item1'); // expect personal 1st item
        expect(monitoring.getTextItem(2, 0)).toBe('ingest1'); // expect global serach 1st item
    });

    it('configure a saved search that contain ingest items', () => {
        setupDeskMonitoringSettings('POLITIC DESK');

        monitoring.toggleDesk(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(0);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 0)).toBe('ingest1');
    });

    it('configure a saved search that contain both ingest items and content items', () => {
        setupDeskMonitoringSettings('POLITIC DESK');

        monitoring.toggleDesk(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(1);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 0)).toBe('item5');
        expect(monitoring.getTextItem(0, 1)).toBe('item9');
        expect(monitoring.getTextItem(0, 3)).toBe('ingest1');
    });

    it('configure a saved search from other user', () => {
        monitoring.openMonitoring();
        workspace.createWorkspace('My Workspace');
        browser.sleep(500);
        monitoring.showMonitoringSettings();
        monitoring.nextStages();
        monitoring.switchGlobalSearchOn();
        monitoring.toggleGlobalSearch(3);
        expect(monitoring.getGlobalSearchText(3)).toBe('global saved search other user by first name1 last name1');
        monitoring.togglePrivateSearch(1);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        expect(monitoring.getTextItem(0, 0)).toBe('item5');
        expect(monitoring.getTextItem(0, 1)).toBe('item9');
        monitoring.showMonitoringSettings();
        monitoring.nextStages();
        expect(monitoring.getGlobalSearchText(0)).toBe('global saved search ingest1 by first name last name');
        expect(monitoring.getPrivateSearchText(0)).toBe('saved search ingest1');
    });

    it('configure monitoring view for more than 1 desk', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0, false);

        monitoring.toggleStage(0, 1);
        monitoring.toggleStage(0, 2);
        monitoring.toggleStage(0, 4);
        monitoring.nextStages();
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        desks.showMonitoringSettings('SPORTS DESK');
        monitoring.turnOffDeskWorkingStage(1, false);

        monitoring.toggleStage(1, 1);
        monitoring.toggleStage(1, 3);
        monitoring.toggleStage(1, 4);
        monitoring.nextStages();
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(workspace.getCurrentDesk()).toEqual('POLITIC DESK');
        expect(monitoring.getTextItem(0, 2)).toBe('item6');

        workspace.selectDesk('Sports Desk');
        expect(workspace.getCurrentDesk()).toEqual('SPORTS DESK');
        expect(monitoring.getTextItem(0, 0)).toBe('item3');
    });

    it('configure a stage and then delete the stage', () => {
        monitoring.openMonitoring();
        expect(monitoring.getGroups().count()).toBe(6);

        desks.openDesksSettings();

        desks.edit('Politic Desk');
        desks.showTab('stages');
        desks.removeStage('three');
        desks.showTab('macros');
        desks.save();

        monitoring.openMonitoring();
        expect(monitoring.getGroups().count()).toBe(5);
    });

    it('can search content', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.toggleDesk(0);
        monitoring.toggleDesk(1);
        monitoring.toggleStage(1, 2);
        monitoring.toggleStage(1, 4);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(2);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 0)).toBe('item3');
        expect(monitoring.getTextItem(1, 0)).toBe('item4');
        expect(monitoring.getTextItem(2, 0)).toBe('item1');
        expect(monitoring.getTextItem(2, 4)).toBe('item7');

        monitoring.searchAction('item3');
        expect(monitoring.getTextItem(0, 0)).toBe('item3');
        expect(monitoring.getTextItem(2, 0)).toBe('item3');

        workspace.selectDesk('Sports Desk');
        setupDeskMonitoringSettings('SPORTS DESK');
        monitoring.turnOffDeskWorkingStage(1);

        monitoring.openMonitoring();

        expect(workspace.getCurrentDesk()).toEqual('SPORTS DESK');
        expect(monitoring.getTextItem(1, 0)).toBe('item3');

        workspace.selectDesk('Politic Desk');
        dashboard.openDashboard();
        monitoring.openMonitoring();
        expect(monitoring.getTextItem(0, 0)).toBe('item3');
        expect(monitoring.getTextItem(1, 0)).toBe('item4');
        expect(monitoring.getTextItem(2, 0)).toBe('item1');
        expect(monitoring.getTextItem(2, 4)).toBe('item7');
    });

    it('can filter content by file type', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.toggleDesk(0);
        monitoring.nextStages();
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        expect(monitoring.getTextItem(2, 1)).toBe('item9');

        monitoring.filterAction('composite');
        expect(monitoring.getTextItem(3, 2)).toBe('package1');

        monitoring.filterAction('all');
        expect(monitoring.getTextItem(2, 0)).toBe('item5');

        monitoring.actionOnItem('Edit', 2, 0);
        authoring.publish();
        monitoring.filterAction('text');
        expect(monitoring.getTextItem(5, 0)).toBe('item5');

        workspace.selectDesk('Sports Desk');
        expect(monitoring.getGroupItems(0).count()).toBe(0);
        expect(monitoring.getGroupItems(1).count()).toBe(0);
        expect(monitoring.getGroupItems(2).count()).toBe(1);
        expect(monitoring.getGroupItems(3).count()).toBe(0);
        expect(monitoring.getGroupItems(4).count()).toBe(1);
    });

    it('can order content', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0);

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(1, 0)).toBe('item5');
        expect(monitoring.getTextItem(1, 1)).toBe('item9');
        expect(monitoring.getTextItem(1, 2)).toBe('item7');
        expect(monitoring.getTextItem(1, 3)).toBe('item8');
        monitoring.setOrder('Slugline', true);
        expect(monitoring.getTextItem(1, 0)).toBe('item5');
        expect(monitoring.getTextItem(1, 1)).toBe('item7');
        expect(monitoring.getTextItem(1, 2)).toBe('item8');
        expect(monitoring.getTextItem(1, 3)).toBe('item9');
    });

    it('can preview content', () => {
        monitoring.openMonitoring();

        monitoring.previewAction(3, 2);
        expect(monitoring.getPreviewTitle()).toBe('item6');
        monitoring.closePreview();
    });

    it('can open read only content', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0);

        monitoring.openMonitoring();

        monitoring.openAction(2, 0);
        expect(authoring.save_button.isPresent()).toBeTruthy();
    });

    it('can start content upload', () => {
        monitoring.openMonitoring();
        monitoring.openCreateMenu();
        monitoring.startUpload();
        expect(monitoring.uploadModal.isDisplayed()).toBeTruthy();
    });

    it('show personal', () => {
        monitoring.openMonitoring();
        monitoring.showPersonal();
        expect(monitoring.getPersonalItemText(0)).toBe('item1');
        expect(monitoring.getPersonalItemText(1)).toBe('item2');
    });

    it('can view items in related item tab', () => {
        monitoring.openMonitoring();
        expect(monitoring.getGroupItems(1).count()).toBe(0);
        expect(monitoring.getGroupItems(2).count()).toBe(4);
        monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate in place', 2, 0, true);
        monitoring.filterAction('text');
        expect(monitoring.getGroupItems(0).count()).toBe(1);
        expect(monitoring.getTextItem(0, 0)).toBe('item5');
        monitoring.previewAction(0, 0);
        monitoring.tabAction('related');
        monitoring.openRelatedItem(0);
        expect(authoring.getHeadlineText()).toBe('item5');
    });

    it('updates item group on single item spike-unspike', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0);

        monitoring.openMonitoring();

        expect(monitoring.getGroupItems(1).count()).toBe(4);

        monitoring.actionOnItem('Edit', 1, 2);
        authoring.close();
        monitoring.actionOnItem('Spike', 1, 2, null, true);
        expect(monitoring.getGroupItems(1).count()).toBe(3);

        monitoring.showSpiked();
        expect(monitoring.getSpikedTextItem(0)).toBe('item7');

        monitoring.unspikeItem(0);
        expect(monitoring.getSpikedItems().count()).toBe(0);
    });

    it('updates personal on single item spike', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.toggleDesk(0);
        monitoring.togglePersonal();
        monitoring.nextStages();
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getGroupItems(0).count()).toBe(2);
        monitoring.actionOnItem('Spike', 0, 0, null, true);
        browser.sleep(100);
        expect(monitoring.getGroupItems(0).count()).toBe(1);
    });

    it('updates item group on multiple item spike-unspike', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0);

        monitoring.openMonitoring();

        expect(monitoring.getGroupItems(1).count()).toBe(4);
        monitoring.selectItem(1, 2);
        browser.sleep(1000); // Wait for animation
        monitoring.spikeMultipleItems();
        expect(monitoring.getGroupItems(1).count()).toBe(3);
        monitoring.showSpiked();
        expect(monitoring.getSpikedTextItem(0)).toBe('item7');
        monitoring.selectSpikedItem(0);
        browser.sleep(1000); // Wait for animation
        monitoring.unspikeMultipleItems();
        expect(monitoring.getSpikedItems().count()).toBe(0);
    });

    it('can show/hide monitoring list', () => {
        monitoring.openMonitoring();
        monitoring.openAction(2, 0);
        monitoring.showHideList();
        expect(monitoring.hasClass(element(by.id('main-container')), 'hideMonitoring')).toBe(true);

        browser.sleep(1000);

        monitoring.showHideList();
        expect(monitoring.hasClass(element(by.id('main-container')), 'hideMonitoring')).toBe(false);
    });

    it('can fetch item', () => {
        setupDeskMonitoringSettings('POLITIC DESK');

        monitoring.toggleDesk(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(3);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        monitoring.openAction(0, 3); // creates new item

        expect(monitoring.getTextItem(0, 0)).toBe('ingest1');
        expect(monitoring.getTextItem(0, 4)).toBe('ingest1');
    });

    it('can fetch as item', () => {
        setupDeskMonitoringSettings('POLITIC DESK');

        monitoring.toggleDesk(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(3);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        monitoring.openFetchAsOptions(0, 3);

        expect(element(by.id('publishScheduleTimestamp')).isPresent()).toBe(false);
        expect(element(by.id('embargoScheduleTimestamp')).isPresent()).toBe(false);

        monitoring.clickOnFetchButton();

        desks.openDesksSettings();
        desks.showMonitoringSettings('POLITIC DESK');

        monitoring.toggleDesk(0);
        monitoring.toggleStage(0, 1);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(3);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(0, 0)).toBe('ingest1');
    });

    it('can fetch as and open item', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.toggleDesk(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(3);
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        monitoring.fetchAndOpen(0, 3);

        expect(authoring.save_button.isDisplayed()).toBe(true);
    });

    it('can display desk content in desk single view with their respective titles', () => {
        monitoring.openMonitoring();
        expect(workspace.getCurrentDesk()).toEqual('POLITIC DESK');
        expect(monitoring.getGroups().count()).toBe(6);
        // exclude deskOutput and ScheduledDeskOutput
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.toggleDeskOutput(0);
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getGroups().count()).toBe(5);

        // ensure each stage items counts
        expect(monitoring.getGroupItems(0).count()).toBe(0);
        expect(monitoring.getGroupItems(1).count()).toBe(0);
        expect(monitoring.getGroupItems(2).count()).toBe(4);
        expect(monitoring.getGroupItems(3).count()).toBe(4);
        expect(monitoring.getGroupItems(4).count()).toBe(0);

        // view all items in desk single view
        monitoring.actionOnDeskSingleView();
        expect(monitoring.getSingleViewItemCount()).toBe(8);
        expect(monitoring.getDeskSingleViewTitle()).toBe('Politic Desk desk 8');

        // Monitoring Home
        monitoring.actionMonitoringHome();
        expect(monitoring.getMonitoringHomeTitle()).toBe('Monitoring');

        // Stage single view
        monitoring.actionOnStageSingleView();
        expect(monitoring.getSingleViewItemCount()).toBe(0);
        expect(monitoring.getStageSingleViewTitle()).toBe('Politic Desk / Working Stage stage 0');
    });

    it('can remember multi selection even after scrolling and can reset multi-selection', () => {
        // Initial steps to setup global saved search group as a test group for this case
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0, false);

        // Keep Only global search on and turn off rest of stages
        monitoring.toggleStage(0, 1);
        monitoring.toggleStage(0, 2);
        monitoring.toggleStage(0, 3);
        monitoring.toggleStage(0, 4);
        monitoring.toggleDeskOutput(0);
        monitoring.nextStages();
        monitoring.toggleGlobalSearch(2);
        monitoring.nextSearches();
        monitoring.nextReorder();

        // limit the size of group for the sake of scroll bar
        monitoring.setMaxItems(0, 3);
        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getGroupItems(0).count()).toBe(9);

        // select first item
        monitoring.selectItem(0, 0);
        monitoring.expectIsChecked(0, 0);

        // scroll down and select last item
        browser.executeScript('window.scrollTo(0,250);').then(() => {
            monitoring.selectItem(0, 8);
            monitoring.expectIsChecked(0, 8);
        });

        // scroll up to top again to see if selection to first item is remembered?
        browser.executeScript('window.scrollTo(0,0);').then(() => {
            monitoring.expectIsChecked(0, 0);
        });

        // scroll down again to see if selection to last item is remembered?
        browser.executeScript('window.scrollTo(0,250);').then(() => {
            monitoring.expectIsChecked(0, 8);
        });

        expect(monitoring.getMultiSelectCount()).toBe('2 Items selected');

        // Now reset multi-selection
        monitoring.clickOnCancelButton();
        monitoring.expectIsNotChecked(0, 0);
        monitoring.expectIsNotChecked(0, 8);
    });

    it('can update selected item count after a selected item is corrected', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0, false);

        // Keep Only deskoutput on and turn off rest of stages
        monitoring.toggleStage(0, 1);
        monitoring.toggleStage(0, 2);
        monitoring.toggleStage(0, 4);
        monitoring.nextStages();
        monitoring.nextSearches();
        monitoring.moveOrderItem(0, 1);
        monitoring.nextReorder();

        monitoring.saveSettings();

        monitoring.openMonitoring();

        expect(monitoring.getTextItem(1, 2)).toBe('item6');

        monitoring.actionOnItem('Edit', 1, 2);
        authoring.publish();
        monitoring.filterAction('text');
        expect(monitoring.getTextItem(0, 0)).toBe('item6');
        // select first item
        monitoring.selectItem(0, 0);
        monitoring.expectIsChecked(0, 0);
        expect(monitoring.getMultiSelectCount()).toBe('1 Item selected');

        monitoring.actionOnItem('Correct item', 0, 0);
        authoring.send_correction_button.click();
        expect(element(by.id('multi-select-count')).isPresent()).toBeFalsy();
    });

    it('can view published duplicated item in duplicate tab of non-published original item', () => {
        monitoring.openMonitoring();
        expect(monitoring.getGroupItems(1).count()).toBe(0);
        expect(monitoring.getGroupItems(2).count()).toBe(4);
        expect(monitoring.getTextItem(2, 0)).toBe('item5'); // original item
        monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate in place', 2, 0, true);
        monitoring.filterAction('text');
        expect(monitoring.getGroupItems(0).count()).toBe(1);
        expect(monitoring.getTextItem(0, 0)).toBe('item5'); // duplicated item
        // publish this duplicated item
        monitoring.actionOnItem('Edit', 0, 0);
        authoring.publish();
        // now preview original item's duplicate tab for duplicated published item
        monitoring.previewAction(2, 0);
        monitoring.tabAction('related');
        expect(authoring.getDuplicatedItemState(0)).toBe('PUBLISHED');
    });

    it('can duplicate to a different desk and stage', () => {
        monitoring.openMonitoring();
        expect(monitoring.getGroupItems(1).count()).toBe(0);
        expect(monitoring.getGroupItems(2).count()).toBe(4);
        expect(monitoring.getTextItem(2, 0)).toBe('item5'); // original item
        monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate To', 2, 0, true);
        authoring.duplicateTo('Sports Desk', 'one');
        workspace.selectDesk('Sports Desk');
        expect(monitoring.getGroupItems(2).count()).toBe(2);
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.setHeaderSluglineText(' testing');
        authoring.save();
        authoring.close();
        monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate To', 2, 0, true);
        authoring.duplicateTo('Politic Desk', 'two', true);
        workspace.selectDesk('Politic Desk');
        expect(monitoring.getTextItem(3, 0)).toBe('item5');
        expect(authoring.getHeaderSluglineText()).toBe('item5 slugline one/two testing');
    });

    it('can remember last duplicate destination desk', () => {
        monitoring.openMonitoring();
        monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate To', 2, 0, true);
        authoring.duplicateTo('Sports Desk', 'one');
        monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate To', 2, 0, true);

        var dropdownSelected = monitoring.getSendToDropdown();

        browser.sleep(500);
        expect(dropdownSelected.getText()).toEqual('Sports Desk');
        authoring.duplicateTo('Politic Desk', 'two', true);
        monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate To', 2, 0, true);

        dropdownSelected = monitoring.getSendToDropdown();
        authoring.close();

        browser.sleep(500);
        expect(dropdownSelected.getText()).toEqual('Politic Desk');
    });

    it('can view published item as readonly when opened', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0);

        monitoring.openMonitoring();
        monitoring.actionOnItem('Edit', 1, 0);
        authoring.publish();

        // open published text item
        monitoring.filterAction('text');
        monitoring.actionOnItem('Open', 4, 0);
        expect(authoring.save_button.isPresent()).toBe(false); // Save button hidden for publish item

        var textField = element(by.className('text-editor'));
        // expect contenteditable=true attribute is missing/null for text-editor field,
        // hence editing is disabled for published item

        expect(textField.getAttribute('contenteditable')).toBe(null);
    });

    it('can close already opened preview on an item action', () => {
        monitoring.openMonitoring();
        monitoring.previewAction(3, 2);
        expect(monitoring.getPreviewTitle()).toBe('item6');
        var previewPane = element(by.id('item-preview'));

        expect(previewPane.isPresent()).toBe(true);
        monitoring.actionOnItem('Edit', 3, 2);
        expect(previewPane.isPresent()).toBe(false);
    });

    xit('can display embargo label when set for published item', () => {
        setupDeskMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0);

        monitoring.openMonitoring();

        monitoring.actionOnItem('Edit', 1, 0);
        authoring.sendToButton.click();
        authoring.setEmbargo();
        authoring.sendToButton.click();
        authoring.save();
        authoring.publish();

        // filter published text item
        monitoring.filterAction('text');
        expect(monitoring.getItem(4, 0).element(by.className('state_embargo')).isDisplayed()).toBe(true);
        expect(monitoring.getItem(4, 0).element(by.className('state_embargo')).getText()).toEqual('EMBARGO');
    });
});
