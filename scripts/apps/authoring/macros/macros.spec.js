

describe('macros', () => {
    let allMacros = [
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
            let groupedMacros = _.groupBy(_.filter(allMacros, 'group'), 'group');

            let $scope = $rootScope.$new();

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
            let withoutGroupMacros = _.filter(allMacros, (o) => o.group === undefined);

            let $scope = $rootScope.$new();

            macros.macros = withoutGroupMacros;
            $controller('Macros', {$scope: $scope});
            $scope.$digest();

            expect($scope.macros).toEqual(withoutGroupMacros);
            expect($scope.groupedMacros).toBe(null);
            expect($scope.groupedList).toBe(false);
        }));
});
