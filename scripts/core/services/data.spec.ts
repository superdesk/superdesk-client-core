import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';

describe('DataService', () => {
    beforeEach(() => {
        window.module('superdesk.core.services.data');
        window.module('superdesk.core.services.entity');
        window.module('superdesk.core.services.server');
    });

    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            server: {url: 'http://localhost', ws: undefined},
        };

        Object.assign(appConfig, testConfig);
    });

    var DataAdapter, httpBackend;

    beforeEach(inject(($injector) => {
        DataAdapter = $injector.get('DataAdapter');
        httpBackend = $injector.get('$httpBackend');
    }));

    it('cat query resource', () => {
        var data = new DataAdapter('users'),
            users = {_items: [{_id: 'foo'}]},
            promise = data.query({max_results: 99});

        httpBackend
            .expectGET('http://localhost/users?max_results=99')
            .respond(200, users);

        promise.then((result) => {
            expect(result).toEqual(users);
        });

        httpBackend.flush();

        expect(data._items.length).toBe(1);
    });
});
