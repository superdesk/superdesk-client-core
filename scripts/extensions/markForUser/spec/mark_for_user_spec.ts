import {browser} from 'protractor';
import {el, els, ECE, login, articleList, workspace} from 'end-to-end-testing-helpers';

describe('mark for user extension', () => {
    it('persists changing marked user from authoring topbar in read-only mode', () => {
        login();

        workspace.navigateTo('Monitoring');
        articleList.executeContextMenuAction(els(['article-item']).get(0), 'Mark for user');

        el(['mark-for-user-modal', 'modal-body', 'select-user-dropdown', 'dropdown-button']).click();
        els(['mark-for-user-modal', 'modal-body', 'select-user-dropdown', 'option']).get(1).click();
        el(['mark-for-user-modal', 'modal-footer', 'confirm']).click();

        // open marked item in read-only mode from "marked for me" dropdown
        browser.wait(ECE.textToBePresentInElement(el(['marked-for-me-dropdown', 'toggle-button', 'badge']), '1'));
        el(['marked-for-me-dropdown', 'toggle-button']).click();
        els(['marked-for-me-dropdown', 'item']).get(0).click();
        expect(
            el(['authoring-topbar', 'marked-for-user', 'user-avatar']).getAttribute('title'),
        ).toBe(Promise.resolve('first name last name'));

        // change marked user
        el(['authoring-topbar', 'marked-for-user', 'user-avatar']).click();
        el(['mark-for-user-modal', 'modal-body', 'select-user-dropdown', 'dropdown-button']).click();
        els(['mark-for-user-modal', 'modal-body', 'select-user-dropdown', 'option']).get(3).click();
        el(['mark-for-user-modal', 'modal-footer', 'confirm']).click();

        browser.sleep(3000); // wait for a network request to finish before reloading the page

        // check if marked user change is persisted after reload
        browser.refresh();
        browser.wait(ECE.presenceOf(el(['authoring-topbar', 'marked-for-user', 'user-avatar'])));
        expect(
            el(['authoring-topbar', 'marked-for-user', 'user-avatar']).getAttribute('title'),
        ).toBe(Promise.resolve('first name2 last name2'));
    });
});
