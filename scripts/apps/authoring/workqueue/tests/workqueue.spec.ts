
describe('workqueue', () => {
    var USER_ID = 'u1';

    angular.module('mock.route', ['ngRoute'])
        .config(($routeProvider) => {
            $routeProvider.when('/mock', {
                template: '',
            });
        });

    beforeEach(window.module('mock.route'));
    beforeEach(window.module('superdesk.apps.authoring.workqueue'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject((session, $q) => {
        spyOn(session, 'getIdentity').and.returnValue($q.when({_id: USER_ID}));
    }));

    it('loads locked items of current user', inject((workqueue, api, session, $q, $rootScope) => {
        var items;
        const query = {
            source: {
                query: {
                    bool: {
                        must: [
                            {term: {lock_user: USER_ID}},
                            {terms: {lock_action: ['edit', 'correct', 'kill']}},
                        ],
                    },
                },
            },
            auto: 1,
        };

        spyOn(api, 'query').and.returnValue($q.when({_items: [{}]}));

        workqueue.fetch().then(() => {
            items = workqueue.items;
        });

        $rootScope.$apply();

        expect(items.length).toBe(1);
        expect(items).toBe(workqueue.items);
        expect(api.query).toHaveBeenCalledWith('workqueue', query);
        expect(session.getIdentity).toHaveBeenCalled();
    }));

    it('can update single item', inject((workqueue, api, $q, $rootScope) => {
        spyOn(api, 'find').and.returnValue($q.when({_etag: 'xy'}));

        workqueue.items = [{_id: '1'}];
        workqueue.updateItem('1');

        $rootScope.$digest();

        expect(api.find).toHaveBeenCalledWith('archive', '1');
        expect(workqueue.items[0]._etag).toBe('xy');
    }));

    it('can get active item from url', inject(
        (api, $location, $controller, $q, $rootScope, workqueue) => {
            spyOn(api, 'query').and.returnValue($q.when({_items: [{_id: 'foo'}]}));
            $location.path('/mock');
            $location.search('item', 'foo');
            $rootScope.$digest();

            var scope = $rootScope.$new();

            $controller('Workqueue', {$scope: scope});
            $rootScope.$digest();
            expect(scope.active._id).toBe('foo');
        }));

    it('can confirm before closing autosaved or not autosaved, but dirty active item', inject(
        (api, $location, $controller, $q, $rootScope, autosave, confirm) => {
        // first get active item from url.
            spyOn(api, 'query').and.returnValue($q.when({_items: [{_id: 'foo'}]}));
            $location.path('/mock');
            $location.search('item', 'foo');
            $rootScope.$digest();

            var scope = $rootScope.$new();

            $controller('Workqueue', {$scope: scope});
            $rootScope.$digest();
            expect(scope.active._id).toBe('foo');

            var confirmDefer;

            confirmDefer = $q.defer();
            // Spy On autosave.get(), testing first call would return with success and second with error.
            spyOn(autosave, 'get').and.returnValues($q.when(scope.active), $q.reject({statusText: 'NOT FOUND'}));
            spyOn(confirm, 'reopen').and.returnValue(confirmDefer.promise);

            // call for success, i.e. gets autosaved.
            scope.closeItem(scope.active);
            $rootScope.$digest();
            expect(confirm.reopen).toHaveBeenCalled();

            // call for error, i.e. not gets autosaved.
            confirm.dirty = true; // current item is dirty
            scope.closeItem(scope.active);
            $rootScope.$digest();
            expect(confirm.reopen).toHaveBeenCalled();
        }));
});
