import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';

describe('url resolver', () => {
    var SERVER_URL = 'http://localhost:5000/api',
        USERS_URL = '/users',
        RESOURCES = {_links: {child: [{title: 'users', href: USERS_URL}]}};

    beforeEach(window.module('superdesk.core.api'));

    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {server: {url: SERVER_URL, ws: undefined}};

        Object.assign(appConfig, testConfig);
    });

    it('can resolve resource urls', (done) => inject((urls, $httpBackend, $rootScope) => {
        $httpBackend.expectGET(SERVER_URL).respond(RESOURCES);

        urls.resource('users').then((url) => {
            expect(url).toBe(SERVER_URL + USERS_URL);

            done();
        });

        $httpBackend.flush();
        $rootScope.$digest();
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
