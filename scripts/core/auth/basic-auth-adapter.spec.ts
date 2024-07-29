import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';

/* jshint maxlen:false */
var SERVER_URL = 'http://localhost/resource',
    LOGIN_URL = SERVER_URL + '/auth_db',
    username = 'admin',
    password = 'admin',
    session = 'xyz';

describe('basic auth adapter', () => {
    var $httpBackend;

    beforeEach(window.module('superdesk.core.auth'));
    beforeEach(window.module('superdesk.core.menu'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(inject((_$httpBackend_) => {
        $httpBackend = _$httpBackend_;
    }));
    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            server: {
                url: '',
                ws: undefined,
            },
        };

        Object.assign(appConfig, testConfig);
    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('can login', (done) => inject((authAdapter, urls, $q) => {
        $httpBackend
            .expectPOST(LOGIN_URL, {username: username, password: password})
            .respond({token: session, user: '1'});

        spyOn(urls, 'resource').and.returnValue($q.when(LOGIN_URL));

        authAdapter.authenticate(username, password).then((identity) => {
            expect(urls.resource).toHaveBeenCalledWith('auth_db');
            expect(identity.token).toBe('Basic ' + btoa(session + ':'));

            done();
        });

        $httpBackend.flush();
    }));

    it('can reject on failed auth', (done) => inject((authAdapter, urls, $q) => {
        const onSuccess = jasmine.createSpy('onSuccess');


        spyOn(urls, 'resource').and.returnValue($q.when(LOGIN_URL));

        $httpBackend.expectPOST(LOGIN_URL).respond(400);

        authAdapter.authenticate(username, password)
            .then(onSuccess, () => {
                expect(onSuccess).not.toHaveBeenCalled();

                done();
            });

        $httpBackend.flush();
    }));
});
