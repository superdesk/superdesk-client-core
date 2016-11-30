describe('url resolver', () => {
    var SERVER_URL = 'http://localhost:5000/api',
        USERS_URL = '/users',
        RESOURCES = {_links: {child: [{title: 'users', href: USERS_URL}]}};

    beforeEach(window.module('superdesk.core.api'));

    beforeEach(window.module(($provide) => {
        // $provide.service('urls', URLResolver);
        $provide.constant('config', {server: {url: SERVER_URL}});
    }));

    it('can resolve resource urls', inject((urls, $httpBackend, $rootScope) => {
        $httpBackend.expectGET(SERVER_URL).respond(RESOURCES);

        var url;

        urls.resource('users').then((_url) => {
            url = _url;
        });

        $httpBackend.flush();
        $rootScope.$digest();

        expect(url).toBe(SERVER_URL + USERS_URL);
    }));

    it('can resolve item urls', inject((urls) => {
        expect(urls.item('/users/1')).toBe(SERVER_URL + '/users/1');
    }));

    it('can warn if there is missing endpoint', inject((urls, $log, $httpBackend, $rootScope) => {
        $httpBackend.expectGET(SERVER_URL).respond(RESOURCES);

        urls.resource('foo');
        $httpBackend.flush();
        $rootScope.$digest();

        expect($log.warn.logs.length).toBe(1);
        expect($log.warn.logs[0]).toEqual(['resource url not found', 'foo']);
    }));
});
