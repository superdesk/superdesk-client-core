
import {element, browser, by} from 'protractor';

import {monitoring} from './helpers/monitoring';
import {authoring} from './helpers/authoring';
import {desks} from './helpers/desks';
import {LoginModal, logout} from './helpers/pages';
import {click} from './helpers/utils';

describe('notifications', () => {
    beforeEach(() => {
        monitoring.openMonitoring();
    });

    it('create a new user mention', () => {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.showComments();
        authoring.writeTextToComment('@admin1 hello');

        const comments = element.all(by.repeater('comment in comments'));
        const unreadCount = element(by.id('unread-count'));

        browser.wait(() => comments.count(), 2000);

        expect(comments.count()).toBe(1);
        expect(unreadCount.getText()).toBe('');

        logout();
        var modal = new LoginModal();

        modal.login('admin1', 'admin');

        expect(unreadCount.getText()).toBe('1');

        click(element(by.id('unread-count')));

        expect(unreadCount.getText()).toBe('');
    });
});
