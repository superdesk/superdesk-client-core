describe('saved search service', () => {
    beforeEach(window.module('superdesk.apps.search'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    it('can reset searches on event', inject((savedSearch, $rootScope, $q, api) => {
        spyOn(api, 'query').and.returnValue($q.when({_items: [{_id: 'foo', name: 'Foo'}], _links: {}}));

        savedSearch.getAllSavedSearches();
        $rootScope.$digest();

        savedSearch.getAllSavedSearches();
        $rootScope.$digest();

        expect(api.query.calls.count()).toBe(1);
        expect(savedSearch.savedSearches.length).toBe(1);

        $rootScope.$broadcast('savedsearch:update');
        $rootScope.$digest();

        savedSearch.getAllSavedSearches();
        $rootScope.$digest();

        expect(api.query.calls.count()).toBe(2);
    }));
});
