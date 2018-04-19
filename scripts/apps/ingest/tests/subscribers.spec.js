

describe('subscribers service', () => {
    beforeEach(window.module('superdesk.core.filters'));
    beforeEach(window.module('superdesk.apps.publish'));

    beforeEach(inject((subscribersService, $q, api) => {
        spyOn(api, 'query').and.returnValue($q.when({
            _items: [{name: 'sub-1', is_active: false},
                {name: 'sub-2', is_active: true, is_targetable: true},
                {name: 'sub-3', is_active: false},
                {name: 'sub-4', is_active: true, is_targetable: false},
                {name: 'sub-5', is_active: true}],
            _links: {},
        }));
    }));

    it('can get all subscribers', inject((subscribersService, api, $q, $rootScope) => {
        var allSubscribers;

        subscribersService.fetchSubscribers().then((subs) => {
            allSubscribers = subs;
        });

        $rootScope.$digest();
        expect(allSubscribers.length).toBe(5);
    }));

    it('can get all subscribers with criteria', inject((subscribersService, api, $q, $rootScope) => {
        subscribersService.fetchSubscribers({name: 'sub-2'});
        $rootScope.$digest();
        expect(api.query).toHaveBeenCalledWith('subscribers', {max_results: 200, page: 1, name: 'sub-2'});
    }));

    it('can get all active subscribers', inject((subscribersService, api, $q, $rootScope) => {
        var allSubscribers;

        subscribersService.fetchActiveSubscribers().then((subs) => {
            allSubscribers = subs;
        });

        $rootScope.$digest();
        expect(allSubscribers.length).toBe(3);
    }));

    it('can get all targetable subscribers', inject((subscribersService, api, $q, $rootScope) => {
        var allSubscribers;

        subscribersService.fetchTargetableSubscribers().then((subs) => {
            allSubscribers = subs;
        });

        $rootScope.$digest();
        expect(allSubscribers.length).toBe(2);
    }));
});
