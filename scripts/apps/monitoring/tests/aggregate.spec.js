describe('aggregate widget', () => {
    beforeEach(window.module('superdesk.apps.aggregate'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    describe('aggregate widget controller', () => {
        var scope, ctrl;

        beforeEach(inject(($rootScope, $controller) => {
            scope = $rootScope.$new();
            ctrl = $controller('AggregateCtrl', {$scope: scope});
        }));
        it('can fetch the saved expanded state on init', inject((storage) => {
            storage.clear();
            expect(ctrl.state.expanded).toEqual({});
        }));
        it('can assume unset expanded state is true', inject((storage) => {
            storage.clear();
            expect(ctrl.getExpandedState('test')).toBe(true);
        }));
        it('can switch expanded state', inject((storage) => {
            storage.clear();
            ctrl.switchExpandedState('test');
            expect(ctrl.getExpandedState('test')).toBe(false);
            ctrl.switchExpandedState('test');
            expect(ctrl.getExpandedState('test')).toBe(true);
        }));
        it('can remember expanded state', inject(($rootScope, $controller) => {
            ctrl.switchExpandedState('test');
            expect(ctrl.getExpandedState('test')).toBe(false);

            scope = $rootScope.$new();
            ctrl = $controller('AggregateCtrl', {$scope: scope});

            expect(ctrl.getExpandedState('test')).toBe(false);
        }));
        it('can set solo group', inject((storage) => {
            storage.clear();
            ctrl.setSoloGroup({_id: 'test'});
            expect(ctrl.state.solo._id).toBe('test');
        }));
        it('can remember solo group', inject(() => {
            expect(ctrl.state.solo._id).toBe('test');
        }));
    });

    describe('Aggregate Widget', () => {
        var fakeEndpoints = {};
        var queryDeferred;

        beforeEach(window.module('superdesk.apps.aggregate'));
        beforeEach(window.module('superdesk.apps.vocabularies'));

        beforeEach(window.module(($provide) => {
            function fakeApi() {
                function apiMock(endpointName) {
                    return fakeEndpoints[endpointName];
                }
                return apiMock;
            }

            $provide.service('api', fakeApi);

            var fakeCards = {
                criteria: function(card, queryString) {
                    return {card: card, query: queryString};
                },
                shouldUpdate: function() {
                    return true;
                }
            };

            $provide.value('cards', fakeCards);
        }));

        beforeEach(inject(($q) => {
            queryDeferred = $q.defer();
            fakeEndpoints.archive = {
                query: jasmine.createSpy('archive_query').and.returnValue(queryDeferred.promise)
            };
        }));

        it('it responds to changes query', inject(($rootScope, $controller, $compile, api, cards) => {
            var scope = $rootScope.$new();

            $rootScope.config.features = {customMonitoringWidget: true};

            scope.agg = {
                total: 1,
                cards: [
                    {_id: 1, max_items: 10, query: null, fileType: null,
                        header: 'Test Group', subheader: 'Sub header', type: 'stage'}
                ]
            };

            var elemStr = [
                '<div ng-repeat="group in agg.cards">',
                '<div sd-widget-group data-stage="group" data-filter="group.query" data-total="total"></div>',
                '</div>'
            ].join('');

            $compile(elemStr)(scope);
            scope.$digest();
            expect(fakeEndpoints.archive.query).toHaveBeenCalledWith({card: scope.agg.cards[0], query: null});
            scope.agg.cards[0].query = 'Test';
            scope.$digest();
            expect(fakeEndpoints.archive.query).toHaveBeenCalledWith({card: scope.agg.cards[0], query: 'Test'});
        }));
    });
});
