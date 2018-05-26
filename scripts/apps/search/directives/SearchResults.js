import _ from 'lodash';

SearchResults.$inject = [
    '$location',
    'preferencesService',
    'packages',
    'asset',
    '$timeout',
    'api',
    'search',
    'session',
    '$rootScope',
    'config',
    'superdeskFlags',
    'notify',
];

const HEX_REG_EXP = /[a-f0-9]{24}/;

function isObjectId(value) {
    return value.length === 24 && HEX_REG_EXP.test(value);
}

/**
 * @ngdoc directive
 * @module superdesk.apps.search
 * @name sdSearchResults
 *
 * @requires $location
 * @requires preferencesService
 * @requires packages
 * @requires asset
 * @requires $timeout
 * @requires api
 * @requires search
 * @requires session
 * @requires $rootScope
 * @requires config
 *
 * @description Item list with sidebar preview
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
    $rootScope,
    config,
    superdeskFlags,
    notify
) { // uff - should it use injector instead?
    var preferencesUpdate = {
        'archive:view': {
            allowed: [
                'mgrid',
                'compact',
            ],
            category: 'archive',
            view: 'mgrid',
            default: 'mgrid',
            label: 'Users archive view format',
            type: 'string',
        },
    };

    return {
        require: '^sdSearchContainer',
        templateUrl: asset.templateUrl('apps/search/views/search-results.html'),
        link: function(scope, elem, attr, controller) {
            var containerElem = elem.find('.shadow-list-holder');
            var GRID_VIEW = 'mgrid',
                LIST_VIEW = 'compact';

            var projections = search.getProjectedFields();
            var multiSelectable = attr.multiSelectable !== undefined;

            scope.previewingBroadcast = false;
            superdeskFlags.flags.previewing = false;

            var criteria = search.query($location.search()).getCriteria(true),
                oldQuery = _.omit($location.search(), '_id');

            scope.flags = controller.flags;
            scope.selected = scope.selected || {};
            scope.showHistoryTab = true;

            scope.context = 'search';
            scope.$on('item:deleted:archived', itemDelete);
            scope.$on('item:fetch', queryItems);
            scope.$on('item:update', updateItem);
            scope.$on('item:deleted', scheduleIfShouldUpdate);
            scope.$on('item:unlink', queryItems);
            scope.$on('item:spike', scheduleIfShouldUpdate);
            scope.$on('item:unspike', scheduleIfShouldUpdate);
            scope.$on('item:duplicate', queryItems);
            scope.$on('item:translate', queryItems);

            scope.$on('ingest:update', (event, args) => {
                if (!scope.showRefresh) {
                    queryItems(event, args);
                }
            });

            scope.$on('content:update', queryItems);
            scope.$on('item:move', scheduleIfShouldUpdate);

            scope.$on('aggregations:changed', queryItems);

            scope.$on('broadcast:preview', (event, args) => {
                scope.previewingBroadcast = true;
                scope.preview(args.item);
            });

            scope.$on('broadcast:created', (event, args) => {
                scope.previewingBroadcast = true;
                queryItems();
                scope.preview(args.item);
            });

            scope.$watch('selected', (newVal, oldVal) => {
                if (!newVal && scope.previewingBroadcast) {
                    scope.previewingBroadcast = false;
                }
            });

            scope.$watch(function getSearchParams() {
                return _.omit($location.search(), ['_id', 'item', 'action']);
            }, (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    scope.refreshList();
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
                    if (scope.search.repo.search !== 'local' && !$location.search().q && !(data && data.force)) {
                        return; // ignore updates with external content
                    }

                    scope.loading = true;
                    nextUpdate = $timeout(() => {
                        _queryItems(event, data);
                        scope.$applyAsync(() => {
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
                var originalQuery;

                // when forced refresh or query then keep query size default as set 50 above.
                if (!(data && data.force)) {
                    // To compare current scope of items, consider fetching same number of items.
                    if (scope.items && scope.items._items.length > 50) {
                        criteria.source.size = scope.items._items.length;
                    }
                }

                if (data && (data.item || data.items || data.item_id) && scope.showRefresh && !data.force) {
                    // if we know the ids of the items then try to fetch those only
                    originalQuery = angular.extend({}, criteria.source.query);

                    let items = data.items || {};

                    if (data.item || data.item_id) {
                        items[data.item || data.item_id] = 1;
                    }

                    criteria.source.query = search.getItemQuery(data.items);
                } else {
                    criteria.aggregations = $rootScope.aggregations;
                }

                criteria.source.from = 0;
                scope.total = null;
                criteria.es_highlight = search.getElasticHighlight();
                criteria.projections = JSON.stringify(projections);
                return api.query(getProvider(criteria), criteria).then((items) => {
                    if (!scope.showRefresh && data && !data.force && data.user !== session.identity._id) {
                        var isItemPreviewing = !!scope.selected.preview;
                        var _data = {
                            newItems: items,
                            scopeItems: scope.items,
                            scrollTop: containerElem.scrollTop(),
                            isItemPreviewing: isItemPreviewing,
                        };

                        scope.showRefresh = search.canShowRefresh(_data);
                    }

                    if (!scope.showRefresh || data && data.force) {
                        scope.total = items._meta.total;
                        scope.$applyAsync(() => {
                            render(items, null, true);
                        });
                    } else {
                        // update scope items only with the matching fetched items
                        scope.items = search.updateItems(items, scope.items);
                    }
                }, (error) => {
                    notify.error(gettext('Failed to run the query!'));
                    console.error(error, getProvider(criteria));
                })
                    .finally(() => {
                        scope.loading = false;
                        if (originalQuery) {
                            criteria.source.query = originalQuery;
                        }

                        // update scroll position to top, when forced refresh
                        if (data && data.force) {
                            containerElem[0].scrollTop = 0;
                        }
                    });
            }

            function scheduleIfShouldUpdate(event, data) {
                if (data && data.item && _.includes(['item:spike', 'item:unspike', 'item:deleted'], event.name)) {
                    // item was spiked/unspikes from the list
                    extendItem(data.item, {
                        gone: true,
                        _etag: data.item,
                    });
                    queryItems(event, data);
                } else if (data && data.from_stage) {
                    // item was moved from current stage
                    extendItem(data.item, {
                        gone: true,
                        _etag: data.from_stage, // this must change to make it re-render
                    });
                    queryItems(event, data);
                }
            }

            function extendItem(itemId, updates) {
                scope.$apply(() => {
                    scope.items._items = scope.items._items.map((item) => {
                        if (item._id === itemId) {
                            return angular.extend(item, updates);
                        }

                        return item;
                    });

                    scope.items = angular.extend({}, scope.items); // trigger a watch
                });
            }

            scope.$on('refresh:list', (event, group) => {
                scope.refreshList();
            });

            scope.refreshList = function() {
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

                if (scope.search.repo.search && scope.search.repo.search !== 'local') {
                    provider = scope.search.repo.search;
                }

                if (isObjectId(provider)) {
                    criteria.repo = provider;
                    provider = 'search_providers_proxy';
                }

                if (provider === 'local') {
                    provider = 'search';
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
                    scope.loading = true;
                    criteria.source.from = (criteria.source.from || 0) + criteria.source.size;
                    criteria.source.size = 50;
                    criteria.projections = JSON.stringify(projections);

                    api
                        .query(getProvider(criteria), criteria)
                        .then(setScopeItems)
                        .finally(() => {
                            scope.loading = false;
                        });
                } else {
                    var query = _.omit($location.search(), '_id');

                    if (!_.isEqual(_.omit(query, 'page'), _.omit(oldQuery, 'page'))) {
                        $location.search('page', null);
                    }

                    criteria = search.query($location.search()).getCriteria(true);
                    criteria.source.from = 0;
                    criteria.source.size = 50;
                    criteria.aggregations = $rootScope.aggregations;
                    criteria.es_highlight = search.getElasticHighlight();
                    scope.loading = true;
                    criteria.projections = JSON.stringify(projections);

                    api
                        .query(getProvider(criteria), criteria)
                        .then(setScopeItems)
                        .finally(() => {
                            scope.loading = false;
                        });
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

                if (item) {
                    if (item._type === 'externalsource') {
                        processPreview(item);
                        return;
                    }

                    scope.loading = true;
                    let previewCriteria = search.getSingleItemCriteria(item);

                    api.query(getProvider(previewCriteria), previewCriteria).then((completeItems) => {
                        let completeItem = search.mergeHighlightFields(completeItems._items[0]);

                        processPreview(completeItem);
                    })
                        .finally(() => {
                            scope.loading = false;
                        });
                } else {
                    delete scope.selected.preview;
                    superdeskFlags.flags.previewing = false;
                    sendRowViewEvents();
                }
            };

            /**
             * @ngdoc method
             * @name sdSearchResults#sendRowViewEvents
             * @private
             * @param {Object} item
             * @description If singLine:view preference is set, an item is being previewed, config has narrowView list
             * then, sends rowview event
             */
            function sendRowViewEvents(item) {
                let sendEvent = scope.singleLine && superdeskFlags.flags.authoring && config.list
                    && config.list.narrowView;
                let evnt = item ? 'rowview:narrow' : 'rowview:default';

                if (sendEvent) {
                    $rootScope.$broadcast(evnt);
                }
            }

            /**
             * @ngdoc method
             * @name sdSearchResults#processPreview
             * @private
             * @param {Object} item
             * @description Sets the preview item
             */
            function processPreview(item) {
                scope.selected.preview = item;

                if (!_.isNil(scope.selected.preview)) {
                    scope.showHistoryTab = scope.selected.preview.state !== 'ingested' &&
                    !_.includes(['archived', 'externalsource'], scope.selected.preview._type);

                    superdeskFlags.flags.previewing = true;
                    sendRowViewEvents(item);
                }

                $location.search('_id', item ? item._id : null);
            }

            scope.openLightbox = function openLightbox() {
                scope.selected.view = scope.selected.preview;
            };

            scope.closeLightbox = function closeLightbox() {
                scope.selected.view = null;
            };

            scope.openSingleItem = function(packageItem) {
                packages.fetchItem(packageItem).then((item) => {
                    scope.selected.view = item;
                });
            };

            scope.setview = setView;

            var savedView;

            preferencesService.get('archive:view').then((result) => {
                savedView = result.view;
                scope.view = !!savedView && savedView !== 'undefined' ? savedView : 'mgrid';
            });

            scope.$on('key:v', toggleView);

            scope.$on('open:archived_kill', (evt, item, action) => {
                scope.selected.archived_kill = item;
                scope.selected.archived_kill_action = action;
            });

            scope.$on('open:resend', (evt, item) => {
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
            $rootScope.aggregations = 0;
            _queryItems();
        },
    };
}
