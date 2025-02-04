import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

const SERVER_URL = 'http://localhost/api';

describe('superdesk.config', () => {
    angular.module('test.config', ['superdesk.config']);

    let prevConfig;

    beforeEach(window.module('test.config'));

    beforeEach(() => {
        prevConfig = appConfig.server;

        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            server: {url: SERVER_URL, ws: undefined},
        };

        Object.assign(appConfig, testConfig);
    });

    afterEach(() => {
        appConfig.server = prevConfig;
    });

    describe('deployConfig service', () => {
        it('can provide config', (done) => inject((deployConfig, $rootScope, $httpBackend) => {
            $httpBackend.expectGET(SERVER_URL).respond({});

            deployConfig.config = {foo: 1, bar: 2, baz: 'x'};

            deployConfig.get('foo').then((result1) => {
                expect(result1).toEqual(1);

                deployConfig.all({x: 'foo', y: 'baz'}).then((result2) => {
                    expect(result2).toEqual({x: 1, y: 'x'});

                    done();
                });
            });

            $rootScope.$digest();
        }));
    });
});
