import {COMPACT_LIST_VIEW, GRID_VIEW} from 'apps/archive/utils';

describe('Preferences Service', () => {
    beforeEach(window.module('superdesk.core.preferences'));

    var preferencesService,
        testPreferences = {
            active_privileges: {privilege1: 1, privilege2: 0},
            user_preferences: {
                'archive:view': {
                    default: GRID_VIEW,
                    label: 'Users archive view format',
                    type: 'string',
                    category: 'archive',
                    allowed: [
                        GRID_VIEW,
                        COMPACT_LIST_VIEW,
                    ],
                    view: GRID_VIEW,
                },
                'feature:preview': {
                    default: false,
                    type: 'bool',
                    category: 'feature',
                    enabled: true,
                    label: 'test',
                },
                'email:notification': {
                    default: true,
                    category: 'notifications',
                    enabled: true,
                    type: 'bool',
                    label: 'Send notifications via email',
                },
            },
            session_preferences: {
                'desk:items': [],
                'pinned:items': [],
            },
        };

    var testUncachedPreferences = {user_preferences: {'feature:preview': {enabled: false}}};

    var update = {
        'feature:preview': {
            default: false,
            enabled: false,
            label: 'Test Label',
            type: 'bool',
            category: 'feature',
        },
    };

    beforeEach(inject(($injector, $q, session, api) => {
        spyOn(api, 'find').and.callFake((resource, id, params, cache) => {
            if (cache) {
                return $q.when(testPreferences);
            }

            return $q.when(testUncachedPreferences);
        });
        spyOn(api, 'save').and.returnValue($q.when({user_preferences: update}));

        preferencesService = $injector.get('preferencesService');
        spyOn(session, 'getIdentity').and.returnValue($q.when({sessionId: 1}));
        session.sessionId = 1;

        // preferences.get could be called already due to other services using it
        preferencesService.reset();
    }));

    it('can get user preferences', (done) => inject((api, $rootScope) => {
        preferencesService.get();
        $rootScope.$digest();

        preferencesService.get().then((preferences) => {
            expect(preferences).not.toBe(null);
            expect(preferences['archive:view'].view).toBe(GRID_VIEW);
            expect(api.find).toHaveBeenCalledWith('preferences', 1, null, true);

            done();
        });

        $rootScope.$digest();
    }));

    it('can get user preferences by key', (done) => inject(($rootScope) => {
        preferencesService.get();
        $rootScope.$digest();


        preferencesService.get('archive:view').then((preferences) => {
            expect(preferences.view).toBe(GRID_VIEW);

            done();
        });

        $rootScope.$digest();
    }));

    it('can get user preferences by key bypass the cache', (done) => inject(($rootScope) => {
        preferencesService.get('feature:preview', true).then((preferences) => {
            expect(preferences.enabled).toBe(false);

            done();
        });

        $rootScope.$digest();
    }));

    it('update user preferences by key', (done) => inject((api, $rootScope) => {
        preferencesService.get();
        $rootScope.$digest();

        preferencesService.update(update, 'feature:preview');
        preferencesService.update({'workspace:active': {workspace: ''}}, 'workspace:active');
        $rootScope.$digest();
        expect(api.save.calls.count()).toBe(1);

        preferencesService.get('feature:preview').then((preferences) => {
            expect(preferences.enabled).toBe(false);

            done();
        });

        $rootScope.$digest();
    }));

    it('can get all active privileges', (done) => inject(($rootScope) => {
        preferencesService.get();
        $rootScope.$digest();

        preferencesService.getPrivileges().then((privileges) => {
            expect(privileges.privilege1).toBe(1);

            done();
        });

        $rootScope.$digest();
    }));
});

describe('preferences error handling', () => {
    beforeEach(window.module('superdesk.core.preferences'));

    beforeEach(inject((session, urls, $q, $httpBackend, preferencesService) => {
        spyOn(session, 'getIdentity').and.returnValue($q.when());
        session.sessionId = 'sess1';
        $httpBackend.expectGET('http://localhost:5000/preferences/sess1').respond(404, {});
        $httpBackend.expectGET('http://localhost:5000/preferences/sess2').respond({});

        preferencesService.reset();
    }));

    it('can reload on session expiry', (done) => inject((preferencesService, session, $rootScope, $httpBackend) => {
        var error = jasmine.createSpy('error');

        preferencesService.get().then(() => {
            expect(error).not.toHaveBeenCalled();

            done();
        }, error);
        $rootScope.$digest();
        session.sessionId = 'sess2';
        $httpBackend.flush();
    }));

    afterEach(inject(($httpBackend) => {
        $httpBackend.verifyNoOutstandingExpectation();
    }));
});
