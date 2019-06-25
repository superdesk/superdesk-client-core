

var dashboard = require('./helpers/dashboard'),
    workspace = require('./helpers/workspace'),
    authoring = require('./helpers/authoring'),
    monitor = require('./helpers/monitoring');

describe('dashboard', () => {
    beforeEach(() => {
        dashboard.openDashboard();
    });

    it('add a widget to a desk', () => {
        expect(dashboard.getWidgets().count()).toBe(0);
        dashboard.showDashboardSettings();
        dashboard.addWidget('monitor');
        dashboard.doneAction();
        expect(dashboard.getWidgets().count()).toBe(1);
        workspace.selectDesk('Sports Desk');
        expect(dashboard.getWidgets().count()).toBe(0);
        workspace.selectDesk('Politic Desk');
        expect(dashboard.getWidgets().count()).toBe(1);
    });

    it('add multiple monitor widgets', () => {
        dashboard.showDashboardSettings();
        dashboard.addWidget('monitor');
        dashboard.addWidget('monitor');
        dashboard.doneAction();
        expect(dashboard.getWidgets().count()).toBe(2);
        expect(dashboard.getGroups(0).count()).toBe(6);

        expect(dashboard.getTextItem(0, 2, 0)).toBe('item5');
        expect(dashboard.getTextItem(0, 3, 2)).toBe('item6');
        expect(dashboard.getTextItem(1, 2, 0)).toBe('item5');
        expect(dashboard.getTextItem(1, 3, 2)).toBe('item6');

        dashboard.showMonitoringSettings(0);
        monitor.toggleDesk(0);
        monitor.toggleDesk(1);
        monitor.toggleStage(1, 2);
        monitor.toggleStage(1, 4);
        monitor.nextStages();
        monitor.nextSearches();
        monitor.nextReorder();
        monitor.saveSettings();

        // TODO
        // this second saving is needed for passing tests on CI,
        // I could reproduce this scenario locally once, so probably
        // there is can be issue with first saving...
        // Same thing was in line 74, so probably someone got this before too
        dashboard.showMonitoringSettings(0);
        monitor.saveSettings();

        expect(dashboard.getTextItem(0, 0, 0)).toBe('item3');
        expect(dashboard.getTextItem(0, 1, 0)).toBe('item4');
        expect(dashboard.getTextItem(1, 2, 0)).toBe('item5');
        expect(dashboard.getTextItem(1, 3, 2)).toBe('item6');
    });

    it('configure a label for the view', () => {
        dashboard.showDashboardSettings();
        dashboard.addWidget('monitor'); // the monitor widget
        dashboard.doneAction();

        dashboard.showMonitoringSettings(0);
        monitor.setLabel('test');
        monitor.nextStages();
        monitor.nextSearches();
        monitor.nextReorder();
        monitor.saveSettings();

        dashboard.showMonitoringSettings(0);
        monitor.saveSettings();

        expect(dashboard.getWidgetLabel(0)).toBe('test');
    });

    it('search in monitor widget', () => {
        dashboard.showDashboardSettings();
        dashboard.addWidget('monitor'); // the monitor widget
        dashboard.doneAction();
        expect(dashboard.getWidgets().count()).toBe(1);
        expect(dashboard.getGroupItems(0, 2).count()).toBe(4);
        dashboard.doSearch(0, 'item7');
        expect(dashboard.getGroupItems(0, 2).count()).toBe(1);
        expect(dashboard.getTextItem(0, 2, 0)).toBe('item7');
    });

    it('can display desk output in monitor widget when an item gets published', () => {
        monitor.openMonitoring();

        expect(monitor.getTextItem(3, 2)).toBe('item6');
        monitor.actionOnItem('Edit', 3, 2);
        authoring.publish();
        browser.sleep(300);

        dashboard.openDashboard();
        dashboard.showDashboardSettings();
        dashboard.addWidget('monitor'); // the monitor widget
        dashboard.doneAction();
        expect(dashboard.getTextItem(0, 5, 0)).toBe('item6');
    });

    it('can display \'not for publication\' state in monitor widget for such item', () => {
        monitor.openMonitoring();

        expect(monitor.getTextItem(3, 2)).toBe('item6');

        monitor.actionOnItem('Edit', 3, 2);
        authoring.showInfo();
        authoring.toggleNotForPublication();
        authoring.save();
        browser.sleep(300);

        dashboard.openDashboard();
        dashboard.showDashboardSettings();
        dashboard.addWidget('monitor'); // the monitor widget
        dashboard.doneAction();
        expect(dashboard.getTextItem(0, 3, 0)).toBe('item6');

        dashboard.getItem(0, 3, 0).click(); // click item to preview
        browser.sleep(100);
        expect(dashboard.getStateLabel('not-for-publication').isDisplayed()).toBe(true);
    });
});
