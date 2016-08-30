SearchResults.$inject = [
    '$location',
    'preferencesService',
    'packages',
    'asset',
    '$timeout',
    'api',
    'search',
    'session',
    'moment',
    'gettext',
    'superdesk',
    'workflowService',
    'archiveService',
    'activityService',
    'multi',
    'desks',
    'familyService'
];

/**
 * Item list with sidebar preview
 */
export function SearchResults(
    $location,
    preferencesService,
    packages,
    asset,
    $timeout,
    api,
    search,
    session,
    moment,
    gettext,
    superdesk,
    workflowService,
    archiveService,
    activityService,
    multi,
    desks,
    familyService
) { // uff - should it use injector instead?
    var preferencesUpdate = {
        'archive:view': {
            'allowed': [
                'mgrid',
                'compact'
            ],
            'category': 'archive',
            'view': 'mgrid',
            'default': 'mgrid',
            'label': 'Users archive view format',
            'type': 'string'
        }
    };

    return {
        require: '^sdSearchContainer',
        templateUrl: asset.templateUrl('superdesk-search/views/search-results.html'),
        link: function(scope, elem, attr, controller) {

            var GRID_VIEW = 'mgrid',
                LIST_VIEW = 'compact';

            var multiSelectable = (attr.multiSelectable === undefined) ? false : true;

            scope.previewingBroadcast = false;
            scope.shouldRefresh = true;

            var criteria = search.query($location.search()).getCriteria(true),
                oldQuery = _.omit($location.search(), '_id');

            scope.flags = controller.flags;
            scope.selected = scope.selected || {};

            scope.repo = {
                ingest: true, archive: true,
                published: true, archived: true,
                search: 'local'
            };

            if ($location.search().repo &&
                !_.intersection($location.search().repo.split(','),
                    ['archive', 'published', 'ingest', 'archived']).length) {
                scope.repo.search = $location.search().repo;
            }

            scope.context = 'search';
            scope.$on('item:deleted:archived', itemDelete);
            scope.$on('item:fetch', queryItems);
            scope.$on('item:update', updateItem);
            scope.$on('item:deleted', scheduleIfShouldUpdate);
            scope.$on('item:spike', scheduleIfShouldUpdate);
            scope.$on('item:unspike', scheduleIfShouldUpdate);
            scope.$on('item:duplicate', queryItems);
            scope.$on('ingest:update', queryItems);
            scope.$on('content:update', queryItems);
            scope.$on('item:move', scheduleIfShouldUpdate);

            scope.$on('$routeUpdate', function(event, data) {
                if (scope.shouldRefresh) {
                    scope.scrollTop = 0;
                    data.force = true;
                    scope.showRefresh = false;
                    queryItems(event, data);
                } else {
                    scope.shouldRefresh = true;
                }
            });

            scope.$on('broadcast:preview', function(event, args) {
                scope.previewingBroadcast = true;
                scope.preview(args.item);
            });

            scope.$on('broadcast:created', function(event, args) {
                scope.previewingBroadcast = true;
                queryItems();
                scope.preview(args.item);
            });

            scope.$watch('selected', function(newVal, oldVal) {
                if (!newVal && scope.previewingBroadcast) {
                    scope.previewingBroadcast = false;
                }
            });

            scope.$watch(function getSearchParams() {
                return _.omit($location.search(), '_id');
            }, function(newValue, oldValue) {
                if (newValue !== oldValue) {
                    queryItems();
                }
            }, true);

            // public api - called by list when needed
            scope.fetchNext = function() {
                render(null, true);
            };

            var nextUpdate;

            function updateItem(e, data) {
                var item = _.find(scope.items._items, {_id: data.item._id});
                if (item) {
                    angular.extend(item, data.item);
                }
            }

            /**
             * Schedule an update if it's not there yet
             */
            function queryItems(event, data) {
                if (!nextUpdate) {
                    nextUpdate = $timeout(function() {
                        _queryItems(event, data);
                        scope.$applyAsync(function() {
                            nextUpdate = null; // reset for next $digest
                        });
                    }, 1000, false);
                }
            }

            /**
             * Function for fetching total items and filling scope for the first time.
             */
            function _queryItems(event, data) {
                criteria = search.query($location.search()).getCriteria(true);
                criteria.source.size = 50;

                // To compare current scope of items, consider fetching same number of items.
                if (scope.items && scope.items._items.length > 50) {
                    criteria.source.size = scope.items._items.length;
                }
                criteria.source.from = 0;
                scope.total = null;
                criteria.aggregations = 1;
                criteria.es_highlight = search.getElasticHighlight();
                return api.query(getProvider(criteria), criteria).then(function (items) {
                    if (!scope.showRefresh && data && !data.force && (data.user !== session.identity._id)) {

                        var isItemPreviewing = !!scope.selected.preview;
                        var _data = {
                            newItems: items,
                            scopeItems: scope.items,
                            scrollTop: scope.scrollTop,
                            isItemPreviewing: isItemPreviewing
                        };

                        scope.showRefresh = search.canShowRefresh(_data);
                    }

                    if (!scope.showRefresh || (data && data.force)) {
                        scope.total = items._meta.total;
                        scope.$applyAsync(function() {
                            render(items, null, (data && data.force));
                        });
                    } else {
                        // update scope items only with the matching fetched items
                        scope.items = search.updateItems(items, scope.items);
                    }
                });
            }

            function scheduleIfShouldUpdate(event, data) {
                if (data && data.item && _.includes(['item:spike', 'item:unspike', 'item:deleted'], event.name)) {
                    // item was spiked/unspikes from the list
                    extendItem(data.item, {
                        gone: true,
                        _etag: data.item
                    });
                    queryItems(event, data);
                } else if (data && data.from_stage) {
                    // item was moved from current stage
                    extendItem(data.item, {
                        gone: true,
                        _etag: data.from_stage // this must change to make it re-render
                    });
                    queryItems(event, data);
                }
            }

            function extendItem(itemId, updates) {
                scope.$apply(function() {
                    scope.items._items = scope.items._items.map(function(item) {
                        if (item._id === itemId) {
                            return angular.extend(item, updates);
                        }

                        return item;
                    });

                    scope.items = angular.extend({}, scope.items); // trigger a watch
                });
            }

            scope.$on('refresh:list', function(event, group) {
                scope.refreshList();
            });

            scope.refreshList = function() {
                scope.$applyAsync(function () {
                    scope.scrollTop = 0;
                });
                scope.showRefresh = false;
                queryItems(null, {force: true});
            };

            /*
             * Function to get the search endpoint name based on the criteria
             *
             * @param {Object} criteria
             * @returns {string}
             */
            function getProvider(criteria) {
                var provider = 'search';
                if (criteria.repo && criteria.repo.indexOf(',') === -1) {
                    provider = criteria.repo;
                }
                if (scope.repo.search && scope.repo.search !== 'local') {
                    provider = scope.repo.search;
                }
                return provider;
            }

            /*
             * Function for fetching the elements from the database
             *
             * @param {items}
             */
            function render(items, next, force) {
                scope.loading = true;
                if (items) {
                    setScopeItems(items, force);
                } else if (next) {
                    criteria.source.from = (criteria.source.from || 0) + criteria.source.size;
                    api.query(getProvider(criteria), criteria).then(setScopeItems);
                } else {
                    var query = _.omit($location.search(), '_id');

                    if (!_.isEqual(_.omit(query, 'page'), _.omit(oldQuery, 'page'))) {
                        $location.search('page', null);
                    }

                    criteria = search.query($location.search()).getCriteria(true);
                    criteria.source.from = 0;
                    criteria.source.size = 50;
                    criteria.aggregations = 1;
                    criteria.es_highlight = search.getElasticHighlight();
                    api.query(getProvider(criteria), criteria).then(setScopeItems);
                    oldQuery = query;
                }

                function setScopeItems(items, force) {
                    scope.items = search.mergeItems(items, scope.items, next, force);
                    scope.total_records = items._meta.total;
                    scope.loading = false;
                }
            }

            /*
             * Function for updating list
             * after item has been deleted
             */
            function itemDelete(e, data) {
                if (session.identity._id === data.user) {
                    queryItems();
                }
            }

            scope.preview = function preview(item) {
                if (multiSelectable) {
                    if (_.findIndex(scope.selectedList, {_id: item._id}) === -1) {
                        scope.selectedList.push(item);
                    } else {
                        _.remove(scope.selectedList, {_id: item._id});
                    }
                }
                scope.selected.preview = item;
                scope.shouldRefresh = false; // prevents $routeUpdate to refresh, just on preview changes.
                $location.search('_id', item ? item._id : null);
            };

            scope.openLightbox = function openLightbox() {
                scope.selected.view = scope.selected.preview;
            };

            scope.closeLightbox = function closeLightbox() {
                scope.selected.view = null;
            };

            scope.openSingleItem = function (packageItem) {
                packages.fetchItem(packageItem).then(function(item) {
                    scope.selected.view = item;
                });
            };

            scope.setview = setView;

            var savedView;
            preferencesService.get('archive:view').then(function(result) {
                savedView = result.view;
                scope.view = (!!savedView && savedView !== 'undefined') ? savedView : 'mgrid';
            });

            scope.$on('key:v', toggleView);

            scope.$on('open:archived_kill', function(evt, item) {
                scope.selected.archived_kill = item;
            });

            scope.$on('open:resend', function(evt, item) {
                scope.selected.resend = item;
            });

            function setView(view) {
                scope.view = view || 'mgrid';
                preferencesUpdate['archive:view'].view = view || 'mgrid';
                preferencesService.update(preferencesUpdate, 'archive:view');
            }

            function toggleView() {
                var nextView = scope.view === LIST_VIEW ? GRID_VIEW : LIST_VIEW;
                return setView(nextView);
            }

            /**
             * Generates Identifier to be used by track by expression.
             */
            scope.uuid = function(item) {
                return search.generateTrackByIdentifier(item);
            };

            // init
            _queryItems();
        }
    };
}
