import {BaseListController} from 'apps/archive/controllers';

export class IngestListController extends BaseListController {
    constructor($scope, $injector, $location, api, $rootScope, search, desks) {
        super($scope, $location, search, desks);

        $scope.type = 'ingest';
        $scope.loading = false;
        $scope.repo = {
            ingest: true,
            archive: false
        };
        $scope.api = api.ingest;
        $rootScope.currentModule = 'ingest';

        this.fetchItems = function(criteria, next) {
            $scope.loading = true;
            criteria.aggregations = 1;
            criteria.es_highlight = search.getElasticHighlight();
            api.query('ingest', criteria).then((items) => {
                $scope.items = search.mergeItems(items, $scope.items, next);
                $scope.total = items._meta.total;
            })
                .finally(() => {
                    $scope.loading = false;
                });
        };

        this.fetchItem = function(id) {
            return api.ingest.getById(id);
        };

        var oldQuery = _.omit($location.search(), '_id');
        var update = angular.bind(this, function searchUpdated() {
            var newquery = _.omit($location.search(), '_id');

            if (!_.isEqual(_.omit(newquery, 'page'), _.omit(oldQuery, 'page'))) {
                $location.search('page', null);
            }
            var query = this.getQuery($location.search());

            this.fetchItems({source: query});
            oldQuery = newquery;
        });

        $scope.$on('ingest:update', update);
        $scope.$on('item:fetch', update);
        $scope.$on('item:deleted', update);
        $scope.$watchCollection(function getSearchWithoutId() {
            return _.omit($location.search(), '_id');
        }, update);
    }
}

IngestListController.$inject = ['$scope', '$injector', '$location', 'api', '$rootScope', 'search', 'desks'];
