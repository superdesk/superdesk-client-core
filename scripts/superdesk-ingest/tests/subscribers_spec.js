'use strict';

describe('subscribers service', function() {

    beforeEach(module('superdesk.filters'));
    beforeEach(module('superdesk.publish'));

    beforeEach(inject(function(subscribersService, $q, api) {
        spyOn(api, 'query').and.returnValue($q.when({
            _items: [{'name': 'sub-1', 'is_active': false},
            {'name': 'sub-2', 'is_active': true}, {'name': 'sub-3', 'is_active': false}],
            _links: {}
        }));
    }));

    it('can get all subscribers', inject(function(subscribersService, api, $q, $rootScope) {
        var allSubscribers;
        subscribersService.fetchSubscribers().then(function(subs) {
            allSubscribers = subs;
        });

        $rootScope.$digest();
        expect(allSubscribers.length).toBe(3);
    }));

    it('can get all subscribers with criteria', inject(function(subscribersService, api, $q, $rootScope) {
        subscribersService.fetchSubscribers({name: 'sub-2'});
        $rootScope.$digest();
        expect(api.query).toHaveBeenCalledWith('subscribers', {max_results: 200, page: 1, name: 'sub-2'});
    }));

    it('can get all active subscribers', inject(function(subscribersService, api, $q, $rootScope) {
        var allSubscribers;
        subscribersService.fetchActiveSubscribers().then(function(subs) {
            allSubscribers = subs;
        });

        $rootScope.$digest();
        expect(allSubscribers.length).toBe(1);
    }));

});
