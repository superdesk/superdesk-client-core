import {BaseListController} from './BaseListController';
import _ from 'lodash';

export class ArchiveListController extends BaseListController {
    constructor($scope, $injector, $location, $q, $timeout, superdesk, session, api, desks, content,
        StagesCtrl, notify, multi, search) {
        super($scope, $location, search, desks);

        var resource,
            self = this;

        $scope.currentModule = 'archive';
        $scope.stages = new StagesCtrl($scope);
        $scope.content = content;
        $scope.type = 'archive';
        $scope.repo = {
            ingest: false,
            archive: true,
            search: 'local',
        };
        $scope.loading = false;
        $scope.spike = !!$location.search().spike;
        $scope.published = !!$location.search().published;

        $scope.togglePublished = function togglePublished() {
            if ($scope.spike) {
                $scope.toggleSpike();
            }

            $scope.published = !$scope.published;
            $location.search('published', $scope.published ? '1' : null);
            $location.search('_id', null);
            $scope.stages.select(null);
        };

        $scope.toggleSpike = function toggleSpike() {
            if ($scope.published) {
                $scope.togglePublished();
            }

            $scope.spike = !$scope.spike;
            $location.search('spike', $scope.spike ? 1 : null);
            $location.search('_id', null);
            $scope.stages.select(null);
        };

        $scope.stageSelect = function(stage) {
            if ($scope.spike) {
                $scope.toggleSpike();
            }

            if ($scope.published) {
                $scope.togglePublished();
            }

            $scope.stages.select(stage);
            multi.reset();
        };

        this.fetchItems = function fetchItems(criteria, next) {
            if (_.isNil(resource)) {
                return;
            }
            $scope.loading = true;
            criteria.aggregations = 1;
            criteria.es_highlight = search.getElasticHighlight();
            return resource.query(criteria).then((items) => {
                $scope.loading = false;
                $scope.items = search.mergeItems(items, $scope.items, next);
                $scope.total = items._meta.total;
            }, () => {
                $scope.loading = false;
            });
        };

        this.fetchItem = function fetchItem(id) {
            if (_.isNil(resource)) {
                return $q.reject(id);
            }

            return resource.getById(id);
        };

        var refreshPromise,
            refreshItems = function() {
                $timeout.cancel(refreshPromise);
                refreshPromise = $timeout(_refresh, 100, false);
            };

        function _refresh() {
            if (desks.active.desk) {
                if ($scope.published) {
                    resource = api('published');
                } else {
                    resource = api('archive');
                }
            } else {
                resource = api('user_content', session.identity);
            }
            self.refresh(true);
        }

        function reset(event, data) {
            if (data && data.item) {
                if ($location.search()._id === data.item) {
                    $location.search('_id', null);
                }
            }
            refreshItems();
        }

        $scope.$on('task:stage', (_e, data) => {
            if ($scope.stages.selected && (
                $scope.stages.selected._id === data.new_stage ||
                $scope.stages.selected._id === data.old_stage)) {
                refreshItems();
            }
        });

        $scope.$on('media_archive', refreshItems);
        $scope.$on('item:fetch', refreshItems);
        $scope.$on('item:copy', refreshItems);
        $scope.$on('item:take', refreshItems);
        $scope.$on('item:duplicate', refreshItems);
        $scope.$on('item:translate', refreshItems);
        $scope.$on('content:update', refreshItems);
        $scope.$on('item:deleted', refreshItems);
        $scope.$on('item:highlights', refreshItems);
        $scope.$on('item:unlink', refreshItems);
        $scope.$on('item:marked_desks', refreshItems);
        $scope.$on('item:spike', reset);
        $scope.$on('item:unspike', reset);

        desks.fetchCurrentUserDesks().then(() => {
            // only watch desk/stage after we get current user desk
            $scope.$watch(() => desks.active, (active) => {
                $scope.selected = active;
                if ($location.search().page) {
                    $location.search('page', null);
                    return; // will reload via $routeUpdate
                }

                refreshItems();
            });
        });

        // reload on route change if there is still the same _id
        var oldQuery = _.omit($location.search(), '_id', 'fetch');

        $scope.$on('$routeUpdate', (e, route) => {
            var query = _.omit($location.search(), '_id', 'fetch');

            if (!angular.equals(oldQuery, query)) {
                refreshItems();
            }
            oldQuery = query;
        });
    }
}

ArchiveListController.$inject = [
    '$scope', '$injector', '$location', '$q', '$timeout', 'superdesk',
    'session', 'api', 'desks', 'content', 'StagesCtrl', 'notify', 'multi', 'search',
];
