describe('archive-history', () => {
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.apps.highlights'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.authoring.versioning.history'));
    beforeEach(window.module('superdesk.apps.extension-points'));

    beforeEach(inject((highlightsService, desks, $q, api, archiveService) => {
        const deskList = {
            123: {_id: '123', name: 'desk1'},
            456: {_id: '456', name: 'desk2'},
        };

        const userList = {
            1: {_id: '1', display_name: 'John'},
            2: {_id: '2', display_name: 'Smith'},
        };

        const version = {
            _current_version: 1,
            creator: 'John',
            state: 'corrected',
            operation: 'create',
            _id_document: 123,
        };

        spyOn(highlightsService, 'get').and.returnValue($q.when({_items: [
            {_id: '1', name: 'Spotlight'},
            {_id: '2', name: 'New'},
        ]}));

        spyOn(desks, 'initialize').and.returnValue($q.when({}));

        desks.deskLookup = deskList;
        desks.userLookup = userList;

        spyOn(api('legal_archive_history'), 'query').and.returnValue($q.when({}));
        spyOn(archiveService, 'getVersions').and.returnValue($q.when([version]));
    }));

    it('calls archive history for non-legal story', inject(($controller, $rootScope, api, $q) => {
        spyOn(api, 'query').and.returnValue($q.when({_items: [{version: 1}]}));

        var scope = $rootScope.$new();

        scope.item = {_id: 123, _type: 'archive'};
        $controller('HistoryWidgetCtrl', {$scope: scope});

        $rootScope.$digest();
        expect(api.query).toHaveBeenCalledWith('archive_history', {
            where: {item_id: 123},
            max_results: 200,
            sort: '[(\'_created\', 1)]'});
        expect(api.query).not.toHaveBeenCalledWith('legal_archive_history');
    }));

    it('calls legal archive history for legal story', inject(($controller, $rootScope, api, $q) => {
        spyOn(api, 'query').and.returnValue($q.when({_items: [{version: 1}]}));

        var scope = $rootScope.$new();

        scope.item = {_id: 123, _type: 'legal_archive'};
        $controller('HistoryWidgetCtrl', {$scope: scope});

        $rootScope.$digest();
        expect(api.query).toHaveBeenCalledWith('legal_archive_history', {
            where: {item_id: 123},
            max_results: 200,
            sort: '[(\'_created\', 1)]'});
        expect(api.query).not.toHaveBeenCalledWith('archive_history');
    }));

    it('calls versions if no history', inject(($controller, $rootScope, api, $q, archiveService) => {
        spyOn(api, 'query').and.returnValue($q.when({_items: []}));

        var scope = $rootScope.$new();

        scope.item = {_id: 123, _type: 'archive'};
        $controller('HistoryWidgetCtrl', {$scope: scope});

        $rootScope.$digest();
        expect(scope.historyItems.length).toBe(1);
        expect(scope.historyItems[0].displayName).toBe('John');
    }));

    it('merges history into versions if no history',
        inject(($controller, $rootScope, api, $q, archiveService, desks) => {
            const historyItem = {
                version: 2,
                user_id: 2,
                item_id: 123,
            };

            spyOn(api, 'query').and.returnValue($q.when({_items: [historyItem]}));

            var scope = $rootScope.$new();

            scope.item = {_id: 123, _type: 'archive'};
            $controller('HistoryWidgetCtrl', {$scope: scope});

            $rootScope.$digest();
            expect(scope.historyItems.length).toBe(2);
            expect(scope.historyItems[0].displayName).toBe('John');
            expect(scope.historyItems[1].displayName).toBe('Smith');
        }));

    it('returns history if history starts from version 1',
        inject(($controller, $rootScope, api, $q, archiveService, desks) => {
            const historyItem = {
                version: 1,
                user_id: 2,
                item_id: 123,
            };

            spyOn(api, 'query').and.returnValue($q.when({_items: [historyItem]}));

            var scope = $rootScope.$new();

            scope.item = {_id: 123, _type: 'archive'};
            $controller('HistoryWidgetCtrl', {$scope: scope});

            $rootScope.$digest();
            expect(scope.historyItems.length).toBe(1);
            expect(scope.historyItems[0].displayName).toBe('Smith');
        }));

    it('returns System as user if no user in history',
        inject(($controller, $rootScope, api, $q, archiveService, desks) => {
            const historyItem = {
                version: 1,
                item_id: 123,
            };

            spyOn(api, 'query').and.returnValue($q.when({_items: [historyItem]}));

            var scope = $rootScope.$new();

            scope.item = {_id: 123, _type: 'archive'};
            $controller('HistoryWidgetCtrl', {$scope: scope});

            $rootScope.$digest();
            expect(scope.historyItems.length).toBe(1);
            expect(scope.historyItems[0].displayName).toBe('System');
        }));

    it('ignores lock history entries',
        inject(($controller, $rootScope, api, $q, archiveService, desks) => {
            const historyItems = [{
                version: 1,
                item_id: 123,
                operation: 'create',
            }, {
                version: 1,
                item_id: 123,
                operation: 'item_lock',
            }, {
                version: 1,
                item_id: 123,
                operation: 'update',
            }, {
                version: 1,
                item_id: 123,
                operation: 'item_unlock',
            }];

            spyOn(api, 'query').and.returnValue($q.when({_items: historyItems}));

            var scope = $rootScope.$new();

            scope.item = {_id: 123, _type: 'archive'};
            $controller('HistoryWidgetCtrl', {$scope: scope});

            $rootScope.$digest();
            expect(scope.historyItems.length).toBe(2);
            expect(scope.historyItems[0].operation).toBe('create');
            expect(scope.historyItems[1].operation).toBe('update');
        }));
});
