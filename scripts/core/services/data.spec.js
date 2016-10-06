'use strict';

describe('DataService', function() {
    beforeEach(function() {
        window.module('superdesk.services.data');
        window.module('superdesk.services.entity');
        window.module('superdesk.services.server');
    });

    beforeEach(window.module(function($provide) {
        $provide.constant('config', {server: {url: 'http://localhost'}});
    }));

    var DataAdapter, httpBackend;

    beforeEach(inject(function($injector) {
        DataAdapter = $injector.get('DataAdapter');
        httpBackend = $injector.get('$httpBackend');
    }));

    it('cat query resource', function() {

        var data = new DataAdapter('users'),
            users = {_items: []},
            promise = data.query({max_results: 25});

        httpBackend
            .expectGET('http://localhost/users?max_results=25')
            .respond(200, users);

        promise.then(function(result) {
            expect(result).toEqual(users);
        });

        httpBackend.flush();

        expect(data._items.length).toBe(0);
    });
});
