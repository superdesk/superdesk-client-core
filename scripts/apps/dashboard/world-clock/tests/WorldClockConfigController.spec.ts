
/**
* Module with tests for the WorldClockConfigController
*
* @module WorldClockConfigController tests
*/
describe('WorldClockConfigController', () => {
    var getTzdataDeferred,
        fakeTzdata,
        scope;

    beforeEach(window.module('superdesk.apps.dashboard.world-clock'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject(($controller, $rootScope, $q) => {
        scope = $rootScope.$new();
        scope.configuration = {};

        getTzdataDeferred = $q.defer();
        fakeTzdata = {
            $promise: getTzdataDeferred.promise,
            zones: {},
            links: {},
        };

        $controller('WorldClockConfigController', {
            $scope: scope,
            tzdata: fakeTzdata,
        });
    }));

    it('initializes the list of available time zone in scope', () => {
        var expectedList,
            serverTzdata;

        scope.availableZones = []; // make sure it is initially empty

        serverTzdata = {
            zones: {
                'Europe/Rome': ['1 - CET'],
                'Australia/Sydney': ['10 ADN EST'],
            },
            links: {
                'Foo/Bar': [],
            },
        };

        fakeTzdata.zones = serverTzdata.zones;
        fakeTzdata.links = serverTzdata.links;
        fakeTzdata.getTzNames = function() {
            return ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar'];
        };

        getTzdataDeferred.resolve(serverTzdata);
        scope.$digest();

        expectedList = ['Australia/Sydney', 'Europe/Rome', 'Foo/Bar'];
        expect(scope.availableZones).toEqual(expectedList);
    });
});
