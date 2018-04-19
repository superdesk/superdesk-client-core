
describe('Reload Service', () => {
    beforeEach(window.module('superdesk.apps.notification'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.core.preferences'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    var USER_URL = '/users/1';
    var USER = {
        _links: {self: {href: USER_URL}},
        _etag: '2',
        _id: '1',
    };

    var rootScope, reloadService, msg;

    beforeEach(() => {
        inject(($rootScope, _reloadService_, session, $q, api, preferencesService, desks, $window) => {
            rootScope = $rootScope;
            reloadService = _reloadService_;
            session.start({}, USER);

            spyOn(session, 'getIdentity').and.returnValue($q.when({_links: {self: {href: USER_URL}}}));
            spyOn(desks, 'fetchUserDesks').and.returnValue($q.when([
                {_id: '5567ff31102454c7bac47644', name: 'Desk One'},
                {_id: '55394997102454b5ea111bd5', name: 'Desk Two'},
            ]));
            spyOn(preferencesService, 'get').and.returnValue($q.when([]));
            spyOn(preferencesService, 'update');

            desks.fetchCurrentUserDesks().then((_userDesks) => {
                reloadService.userDesks = _userDesks;
            });

            rootScope.$apply();
            expect(reloadService.userDesks.length).toBe(2);
        });
    });

    it('can check reloadEvents on raised event for desk', inject(() => {
        msg = {
            event: 'desk_membership_revoked',
            extra: {
                desk_id: '5567ff31102454c7bac47644',
                user_ids: ['1'],
            },
        };

        var reload = spyOn(reloadService, 'reload');

        rootScope.$broadcast('reload', msg);
        expect(reload).toHaveBeenCalledWith(Object({reload: true, message: 'User removed from desk'}));
        expect(reloadService.result.reload).toBe(true);
    }));

    it('can check reloadEvents on raised event for stage', inject(() => {
        msg = {
            event: 'stage',
            extra: {
                desk_id: '5567ff31102454c7bac47644',
                user_ids: ['1'],
            },
        };
        reloadService.activeDesk = '5567ff31102454c7bac47644';

        var reload = spyOn(reloadService, 'reload');

        rootScope.$broadcast('reload', msg);
        expect(reload).toHaveBeenCalledWith(Object({
            reload: true,
            message: 'Stage is created/updated/deleted',
        }));
        expect(reloadService.result.reload).toBe(true);
    }));
});

describe('Notify Connection Service', () => {
    beforeEach(window.module('superdesk.apps.notification'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    var rootScope, msg;

    beforeEach(() => {
        inject(($rootScope) => {
            rootScope = $rootScope;
        });
    });

    it('can show disconnection message when websocket disconnected', inject((notifyConnectionService) => {
        msg = 'Disconnected from Notification Server!';
        rootScope.$broadcast('disconnected');
        rootScope.$digest();
        expect(notifyConnectionService.message).toEqual(msg);
    }));

    it('can show success message when websocket connected', inject((notifyConnectionService) => {
        msg = 'Connected to Notification Server!';
        rootScope.$broadcast('connected');
        rootScope.$digest();
        expect(notifyConnectionService.message).toEqual(msg);
    }));
});
