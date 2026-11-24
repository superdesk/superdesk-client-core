import React from 'react';
import {shallow} from 'enzyme';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {store} from 'core/data';
import {LockInfo} from './lock-info';

describe('authoring-react LockInfo', () => {
    const article = {
        _id: 'article1',
        state: 'in_progress',
        lock_user: 'user-2',
        lock_session: 'session-2',
    } as IArticle;

    let unlockPrivilege: boolean;

    beforeEach(() => {
        spyOn(ng, 'get').and.callFake((service: string) => {
            switch (service) {
                case 'session':
                    return {sessionId: 'session-1', identity: {_id: 'user-1'}};
                case 'privileges':
                    return {userHasPrivileges: (required) => required.unlock === 1 && unlockPrivilege};
                default:
                    return null;
            }
        });
        spyOn(store, 'getState').and.returnValue({
            entities: {users: {'user-2': {_id: 'user-2', display_name: 'Sam Gamgee'}}},
        } as any);
    });

    function renderUnlockButton() {
        return shallow(
            <LockInfo
                article={article}
                unlock={() => undefined}
                isLockedInOtherSession={() => true}
            />,
        ).dive().find('[data-test-id="unlock"]');
    }

    it('offers Unlock to a user holding the unlock privilege', () => {
        unlockPrivilege = true;

        expect(renderUnlockButton().length).toBe(1);
    });

    it('offers no Unlock to a user without the unlock privilege', () => {
        unlockPrivilege = false;

        expect(renderUnlockButton().length).toBe(0);
    });
});
