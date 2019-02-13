
describe('macros', () => {
    const allMacros = [
        {
            _etag: '1',
            description: 'Converts distance values from feet and inches to metric',
            group: 'area',
            label: 'Length feet-inches to metric',
            name: 'feet_inches_to_metric',
            order: 1,
        },
        {
            _etag: '2',
            description: 'Marco function to generate slugline story by desk',
            name: 'skeds_by_desk',
            label: 'Skeds By Desk',
        },
        {
            _etag: '3',
            description: 'Convert CNY to AUD.',
            group: 'currency',
            label: 'Currency CNY to AUD',
            name: 'yuan_to_aud',
            order: 2,
        },
    ];

    beforeEach(window.module(($provide) => {
        $provide.service('editorResolver', () => ({get: () => ({
            version: () => '3',
            getHtmlForTansa: () => null,
            setHtmlFromTansa: (html, simpleReplace) => null,
        })}));
    }));

    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.apps.authoring.macros'));
    beforeEach(window.module('superdesk.apps.authoring.autosave'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    var $controller;

    beforeEach(inject((_$controller_, macros, $q) => {
        $controller = _$controller_;
        spyOn(macros, 'get').and.returnValue($q.when([]));
    }));

    it('can trigger macro with diff', inject((macros, api, $q, $rootScope) => {
        var diff = {foo: 'bar'};
        var item = {_id: '1'};

        spyOn(api, 'save').and.returnValue($q.when({item: item, diff: diff}));
        macros.call('test', item);
        expect(api.save).toHaveBeenCalled();
        $rootScope.$digest();
    }));

    it('trigger macro with diff does not update item', inject((macros, $q, autosave, $rootScope) => {
        var diff = {foo: 'bar'};
        var item = {_id: '1'};
        var $scope = $rootScope.$new();

        spyOn(macros, 'call').and.returnValue($q.when({item: item, diff: diff}));
        spyOn($rootScope, '$broadcast');
        $scope.origItem = {};
        $scope.item = item;
        $scope.closeWidget = function() { /* no-op */ };
        $controller('Macros', {$scope: $scope});
        $scope.call('test');
        expect(macros.call).toHaveBeenCalled();
        $scope.$digest();
        expect($rootScope.$broadcast).toHaveBeenCalledWith('macro:diff', diff);
    }));

    it('can provide group list option when group is defined in any of macros',
        inject((macros, $q, autosave, $rootScope) => {
            // when group defined in any of macros
            const groupedMacros = _.groupBy(_.filter(allMacros, 'group'), 'group');

            const $scope = $rootScope.$new();

            macros.macros = allMacros;
            $controller('Macros', {$scope: $scope});
            $scope.$digest();

            expect($scope.macros).toEqual(allMacros);
            expect($scope.groupedMacros).toEqual(groupedMacros);
            expect($scope.groupedList).toBe(true);
        }));

    it('can hide group list option when group is undefined in all macros',
        inject((macros, $q, autosave, $rootScope) => {
            // consider, when group is not available in all macros
            const withoutGroupMacros = _.filter(allMacros, (o) => o.group === undefined);

            const $scope = $rootScope.$new();

            macros.macros = withoutGroupMacros;
            $controller('Macros', {$scope: $scope});
            $scope.$digest();

            expect($scope.macros).toEqual(withoutGroupMacros);
            expect($scope.groupedMacros).toBe(null);
            expect($scope.groupedList).toBe(false);
        }));

    it('can replace body html for editor 2', inject((macros, $q, autosave, $rootScope, editorResolver) => {
        let item = {
            _id: '1',
            body_html: 'this is test',
            abstract: 'test',
            genre: [{qcode: 'foo', name: 'bar'}],
            slugline: 'slugline',
            _etag: 'foo',
        };
        let macroItem = {
            _id: '1',
            body_html: 'body html',
            abstract: 'abstract',
            genre: [{qcode: 'zoo', name: 'zoo'}],
            _etag: 'bar',
        };
        let $scope = $rootScope.$new();

        spyOn(editorResolver, 'get').and.returnValue({version: () => '2'});
        spyOn(macros, 'call').and.returnValue($q.when({item: macroItem, diff: null}));
        spyOn($rootScope, '$broadcast');

        $scope.origItem = {};
        $scope.item = item;
        $scope.closeWidget = function() { /* no-op */ };
        $controller('Macros', {$scope: $scope});
        $scope.call('test');
        expect(macros.call).toHaveBeenCalled();
        $scope.$digest();

        expect($scope.item.body_html).toEqual('body html');
        expect($scope.item.abstract).toEqual('abstract');
        expect($scope.item.genre).toEqual([{qcode: 'zoo', name: 'zoo'}]);
        expect($scope.item._etag).toEqual('foo');
        expect($scope.item.slugline).toEqual('slugline');
        expect($rootScope.$broadcast).not.toHaveBeenCalled();
    }));

    it('can generate macro:refreshField event for editor 3', inject((macros, $q, autosave, $rootScope) => {
        let item = {
            _id: '1',
            body_html: 'this is test',
            abstract: 'test',
            genre: [{qcode: 'foo', name: 'bar'}],
            slugline: 'slugline',
        };
        let macroItem = {
            _id: '1',
            body_html: 'body html',
            abstract: 'new abstract',
            slugline: 'new slugline',
            genre: [{qcode: 'zoo', name: 'zoo'}],
        };
        let $scope = $rootScope.$new();

        spyOn(macros, 'call').and.returnValue($q.when({item: macroItem, diff: null}));
        spyOn($rootScope, '$broadcast');

        $scope.origItem = {};
        $scope.item = item;
        $scope.closeWidget = function() { /* no-op */ };
        $controller('Macros', {$scope: $scope});
        $scope.call('test');
        expect(macros.call).toHaveBeenCalled();
        $scope.$digest();

        expect($scope.item.body_html).toEqual('this is test');
        expect($scope.item.abstract).toEqual('test');
        expect($scope.item.genre).toEqual([{qcode: 'zoo', name: 'zoo'}]);
        expect($scope.item.slugline).toEqual('slugline');
        expect($rootScope.$broadcast.calls.allArgs())
            .toEqual([
                ['macro:refreshField', 'abstract', 'new abstract'],
                ['macro:refreshField', 'slugline', 'new slugline'],
            ]);
    }));
});
