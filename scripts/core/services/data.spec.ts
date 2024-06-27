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

    it('cat query resource', (done) => {
        const data = new DataAdapter('users');
        const users = {_items: [{_id: 'foo'}]};

        httpBackend
            .expectGET('http://localhost/users?max_results=99')
            .respond(200, users);

        data.query({max_results: 99}).then((result) => {
            expect(result).toEqual(users);
            expect(data._items.length).toBe(1);

            done();
        });

        httpBackend.flush();
    });
});
