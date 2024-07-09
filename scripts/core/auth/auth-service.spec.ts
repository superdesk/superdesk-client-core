import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

describe('auth service', () => {
    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            server: {
                url: '',
                ws: undefined,
            },
        };

        Object.assign(appConfig, testConfig);

        window.module('superdesk.core.preferences');
        window.module('superdesk.core.services.storage');
        window.module('superdesk.core.auth');
        window.module('superdesk.core.auth.session');
        window.module('superdesk.core.auth.basic');
        window.module('superdesk.core.menu');
        window.module('superdesk.apps.authoring');
        window.module('superdesk.apps.searchProviders');
    });

    beforeEach(inject((session, preferencesService, authAdapter, urls, api, $q) => {
        spyOn(preferencesService, 'get').and.returnValue($q.when({}));
        spyOn(urls, 'resource').and.returnValue($q.when('http://localhost:5000/api/auth'));
        spyOn(session, 'start').and.returnValue(true);
        spyOn(api.users, 'getById').and.returnValue($q.when({username: 'foo'}));
    }));

    it('can login', (done) => inject((auth, session, $httpBackend, $rootScope) => {
        $httpBackend.expectPOST('http://localhost:5000/api/auth').respond(200, {user: 'foo', token: 'bar'});

        expect(session.identity).toBe(null);
        expect(session.token).toBe(null);

        auth.login('admin', 'admin').then(() => {
            expect(session.start).toHaveBeenCalled();

            done();
        });

        $rootScope.$apply();
        $httpBackend.flush();
        $rootScope.$apply();

        $httpBackend.verifyNoOutstandingExpectation();
    }));

    it('checks credentials', (done) => inject((auth, $httpBackend, $rootScope) => {
        const onSuccess = jasmine.createSpy('onSuccess');

        $httpBackend.expectPOST('http://localhost:5000/api/auth').respond(403, {});

        auth.login('wrong', 'credentials').then(onSuccess, () => {
            expect(onSuccess).not.toHaveBeenCalled();

            done();
        });

        $httpBackend.flush();
        $rootScope.$apply();
    }));

    it('handles oauth login', inject((auth, session, $http, $rootScope) => {
        auth.loginOAuth({data: {token: 'foo'}});
        expect($http.defaults.headers.common.Authorization)
            .toBe('Basic ' + btoa('foo:'));
        $rootScope.$digest();
        expect(session.start).toHaveBeenCalled();
    }));
});
