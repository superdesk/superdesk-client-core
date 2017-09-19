export class BaseListController {
    constructor($scope, $location, search, desks) {
        this.lastQueryParams = {};
        this.$location = $location;
        this.search = search;
        this.desks = desks;

        $scope.selected = {};

        $scope.fetchNext = (from) => {
            var criteria = this.getQuery();

            criteria.from = from;
            this.fetchItems({source: criteria}, true);
        };

        $scope.$on('$routeUpdate', (e, data) => {
            if (!$location.search()._id) {
                $scope.selected.preview = null;
            }
            if ($location.search().fetch) {
                this.fetchItem(decodeURIComponent($location.search().fetch))
                    .then((item) => {
                        $scope.selected.preview = null;
                        $scope.selected.fetch = item;
                    });
            }
            if (!$location.search().fetch) {
                $scope.selected.fetch = null;
            }
        });
    }

    buildQuery(params, filterDesk) {
        var query = this.search.query(params);

        if (filterDesk) {
            if (this.desks.active.stage) {
                query.filter({term: {'task.stage': this.desks.active.stage}});
            } else if (this.desks.active.desk) {
                query.filter({term: {'task.desk': this.desks.active.desk}});
            }
        }

        return query.getCriteria();
    }

    getQuery(params, filterDesk) {
        if (!_.isEqual(_.omit(params, 'page'), _.omit(this.lastQueryParams, 'page'))) {
            this.$location.search('page', null);
        }
        var query = this.buildQuery(params, filterDesk);

        this.lastQueryParams = params;
        return query;
    }

    fetchItems(criteria) {
        console.warn('No API defined.');
    }

    fetchItem(id) {
        console.warn('no api defined');
    }

    refresh(filterDesk) {
        var query = this.getQuery(_.omit(this.$location.search(), '_id'), filterDesk);

        this.fetchItems({source: query});
    }
}

BaseListController.$inject = ['$scope', '$location', 'search', 'desks'];
