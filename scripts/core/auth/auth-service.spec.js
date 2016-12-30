describe('auth service', () => {
    beforeEach(() => {
        window.module('superdesk.core.preferences');
        window.module('superdesk.core.services.storage');
        window.module('superdesk.core.auth');
        window.module('superdesk.core.auth.session');
        window.module('superdesk.core.menu');
        window.module('superdesk.apps.authoring');
        window.module('superdesk.apps.searchProviders');
        window.module(($provide) => {
            $provide.service('api', function($q) {
                this.users = {
                    getById: function(id) {
                        return $q.when({username: 'foo'});
                    }
                };
            });
        });
    });
    beforeEach(inject((session, preferencesService, authAdapter, urls, $q) => {
        session.clear();
        spyOn(preferencesService, 'get').and.returnValue($q.when({}));
        spyOn(urls, 'resource').and.returnValue($q.when('http://localhost:5000/api/auth'));
        spyOn(session, 'start').and.returnValue(true);
    }));

    it('can login', inject((auth, session, $httpBackend, $rootScope) => {
        expect(session.identity).toBe(null);
        expect(session.token).toBe(null);

        var resolved = {};

        $httpBackend.expectPOST('http://localhost:5000/api/auth').respond(200, {
            user: 'foo'
        });

        auth.login('admin', 'admin').then((identity) => {
            expect(session.start).toHaveBeenCalled();
            resolved.login = true;
        }, () => {
            resolved.login = false;
        });

        $httpBackend.flush();
        $rootScope.$apply();

        expect(resolved.login).toBe(true);
    }));

    it('checks credentials', inject((auth, $httpBackend, $rootScope) => {
        var resolved = false, rejected = false;

        $httpBackend.expectPOST('http://localhost:5000/api/auth').respond(403, {});

        auth.login('wrong', 'credentials').then(() => {
            resolved = true;
        }, () => {
            rejected = true;
        });

        $httpBackend.flush();
        $rootScope.$apply();

        expect(resolved).toBe(false);
        expect(rejected).toBe(true);
    }));
});
