describe('auth service', () => {
    beforeEach(() => {
        window.module('superdesk.core.preferences');
        window.module('superdesk.core.services.storage');
        window.module('superdesk.core.auth');
        window.module('superdesk.core.auth.session');
        window.module('superdesk.core.auth.basic');
        window.module('superdesk.core.menu');
        window.module('superdesk.apps.authoring');
        window.module('superdesk.apps.searchProviders');
        window.module('superdesk.apps.extension-points');
    });

    beforeEach(inject((session, preferencesService, authAdapter, urls, api, $q) => {
        session.clear();
        spyOn(preferencesService, 'get').and.returnValue($q.when({}));
        spyOn(urls, 'resource').and.returnValue($q.when('http://localhost:5000/api/auth'));
        spyOn(session, 'start').and.returnValue(true);
        spyOn(api.users, 'getById').and.returnValue($q.when({username: 'foo'}));
    }));

    it('can login', inject((auth, session, $httpBackend, $rootScope) => {
        const success = jasmine.createSpy('authenticated');

        $httpBackend.expectPOST('http://localhost:5000/api/auth').respond(200, {user: 'foo', token: 'bar'});

        expect(session.identity).toBe(null);
        expect(session.token).toBe(null);

        auth.login('admin', 'admin').then(success);

        $rootScope.$apply();
        $httpBackend.flush();
        $rootScope.$apply();

        expect(session.start).toHaveBeenCalled();
        expect(success).toHaveBeenCalled();
        $httpBackend.verifyNoOutstandingExpectation();
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

    it('handles oauth login', inject((auth, session, $http, $rootScope) => {
        auth.loginOAuth({data: {token: 'foo'}});
        expect($http.defaults.headers.common.Authorization)
            .toBe('Basic ' + btoa('foo:'));
        $rootScope.$digest();
        expect(session.start).toHaveBeenCalled();
    }));
});
