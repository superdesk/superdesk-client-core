
/**
* Module with tests for the WorldClockController
*
* @module WorldClockController tests
*/
describe('WorldClockController', () => {
    var ctrl,
        getTzdataDeferred,
        fakeTzdata,
        scope;

    beforeEach(window.module('superdesk.apps.dashboard.world-clock'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject(($controller, $rootScope, $q) => {
        scope = $rootScope.$new();

        getTzdataDeferred = $q.defer();
        fakeTzdata = {
            $promise: getTzdataDeferred.promise,
            zones: {},
            links: {},
        };

        ctrl = $controller('WorldClockController', {
            $scope: scope,
            tzdata: fakeTzdata,
        });
    }));

    it('adds time zone data to Moment library on initialization', () => {
        var serverTzdata = {
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

        spyOn(ctrl._moment.tz, 'add');
        getTzdataDeferred.resolve(serverTzdata);
        scope.$digest();

        expect(ctrl._moment.tz.add).toHaveBeenCalledWith(serverTzdata);
    });
});
