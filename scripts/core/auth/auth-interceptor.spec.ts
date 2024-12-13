import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';
import _ from 'lodash';

describe('auth interceptor', () => {
    beforeEach(window.module('superdesk.core.auth.interceptor'));

    beforeEach(window.module(($provide) => {
        $provide.constant('lodash', _);

        const testConfig: Partial<ISuperdeskGlobalConfig> = {server: {url: 'http://localhost:5000', ws: undefined}};

        Object.assign(appConfig, testConfig);
    }));

    it('should intercept 401 response, run auth and resend request',
        inject(($injector, $q, $rootScope, session, request, AuthExpiredInterceptor) => {
            var interceptor = AuthExpiredInterceptor,
                config = {method: 'GET', url: 'http://localhost:5000/test', headers: {}},
                response = {status: 401, config: config};

            spyOn(session, 'expire');
            spyOn(session, 'getIdentity').and.returnValue($q.when());
            spyOn(request, 'resend');

            interceptor.responseError(response);
            $rootScope.$digest();

            expect(session.expire).toHaveBeenCalled();
            expect(request.resend).toHaveBeenCalled();
        }));

    it('should intercept 401 response and reject the request if payload has credentials 1',
        (done) => inject(($q, $rootScope, session, request, AuthExpiredInterceptor) => {
            var interceptor = AuthExpiredInterceptor,
                config = {method: 'POST', url: 'http://localhost:5000/auth', headers: {}},
                response = {status: 401, config: config, data: {_issues: {credentials: 1}}};

            const onSuccess = jasmine.createSpy('onSuccess');

            spyOn(session, 'expire');
            spyOn(session, 'getIdentity').and.returnValue($q.when());
            spyOn(request, 'resend');

            interceptor.responseError(response).then(onSuccess, (result) => {
                expect(result.data._issues.credentials).toBe(1);
                expect(session.expire).not.toHaveBeenCalled();
                expect(request.resend).not.toHaveBeenCalled();
                expect(onSuccess).not.toHaveBeenCalled();

                done();
            });

            $rootScope.$digest();
        }));
});
