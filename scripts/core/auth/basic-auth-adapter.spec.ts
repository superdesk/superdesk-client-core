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
    beforeEach(window.module('superdesk.apps.extension-points'));
    beforeEach(inject((_$httpBackend_) => {
        $httpBackend = _$httpBackend_;
    }));

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('can login', inject((authAdapter, urls, $q) => {
        $httpBackend
            .expectPOST(LOGIN_URL, {username: username, password: password})
            .respond({token: session, user: '1'});

        spyOn(urls, 'resource').and.returnValue($q.when(LOGIN_URL));

        var identity;

        authAdapter.authenticate(username, password).then((_identity) => {
            identity = _identity;
        });

        $httpBackend.flush();

        expect(urls.resource).toHaveBeenCalledWith('auth_db');
        expect(identity.token).toBe('Basic ' + btoa(session + ':'));
    }));

    it('can reject on failed auth', inject((authAdapter, urls, $q) => {
        var resolved = false, rejected = false;

        spyOn(urls, 'resource').and.returnValue($q.when(LOGIN_URL));

        $httpBackend.expectPOST(LOGIN_URL).respond(400);

        authAdapter.authenticate(username, password)
            .then(() => {
                resolved = true;
            }, () => {
                rejected = true;
            });

        $httpBackend.flush();

        expect(resolved).toBe(false);
        expect(rejected).toBe(true);
    }));
});
