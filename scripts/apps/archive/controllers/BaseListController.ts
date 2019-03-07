import _ from 'lodash';

export class BaseListController {
    lastQueryParams: any;
    $location: any;
    search: any;
    desks: any;

    constructor($scope, $location, search, desks) {
        this.lastQueryParams = {};
        this.$location = $location;
        this.search = search;
        this.desks = desks;

        $scope.selected = {};

        $scope.fetchNext = (from) => {
            const source = this.getQuery(null, $scope.repo.archive || false);

            source.from = from;
            this.fetchItems(this.getCriteria(source));
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

    fetchItems(criteria, next?) {
        console.warn('No API defined.');
    }

    fetchItem(id) {
        console.warn('no api defined');
        return new Promise((r) => r());
    }

    refresh(filterDesk) {
        var query = this.getQuery(_.omit(this.$location.search(), '_id'), filterDesk);

        this.fetchItems(this.getCriteria(query));
    }

    getCriteria(source) {
        const params = this.$location.search().params ? JSON.parse(this.$location.search().params) : {};

        return {source, params};
    }
}

BaseListController.$inject = ['$scope', '$location', 'search', 'desks'];
