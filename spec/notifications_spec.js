

var authoring = require('./helpers/authoring'),
    monitoring = require('./helpers/monitoring'),
    desks = require('./helpers/desks');

var Login = require('./helpers/pages').login;
var logout = require('./helpers/pages').logout;

describe('notifications', () => {
    beforeEach(() => {
        monitoring.openMonitoring();
    });

    fit('create a new user mention', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.showComments();
        authoring.writeTextToComment('@admin1 hello');

        var comments = element.all(by.repeater('comment in comments'));

        browser.wait(() => comments.count(), 2000);

        expect(comments.count()).toBe(1);
        expect(element(by.id('unread-count')).getText()).toBe('3');

        logout();
        var modal = new Login();

        modal.login('admin1', 'admin');

        expect(element(by.id('unread-count')).getText()).toBe('4');
        element(by.css('button.current-user')).click();
        expect(element(by.id('unread-count')).getText()).toBe('');
    });

    it('create a new desk mention', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');

        desks.openDesksSettings();
        desks.showMonitoringSettings('POLITIC DESK');
        monitoring.turnOffDeskWorkingStage(0, false);

        monitoring.toggleDesk(1);
        monitoring.toggleStage(1, 0);
        monitoring.nextStages();
        monitoring.nextSearches();
        monitoring.nextReorder();
        monitoring.saveSettings();

        monitoring.openMonitoring();

        monitoring.actionOnItem('Edit', 1, 0);
        authoring.showComments();
        authoring.writeTextToComment('#Politic_Desk hello');
        browser.sleep(200);
        expect(element(by.id('deskNotifications')).getText()).toBe('1');
    });
});
