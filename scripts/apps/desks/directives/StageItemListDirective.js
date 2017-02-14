StageItemListDirective.$inject = [
    'search',
    'api',
    'superdesk',
    'desks',
    'cards',
    '$timeout',
    '$q',
    '$location',
    '$anchorScroll',
    'activityService',
    '$rootScope'
];

export function StageItemListDirective(search, api, superdesk, desks, cards, $timeout, $q,
    $location, $anchorScroll, activityService, $rootScope) {
    return {
        templateUrl: 'scripts/apps/desks/views/stage-item-list.html',
        scope: {
            stage: '=',
            total: '=',
            allowed: '=',
            showEmpty: '=?',
            maxItems: '=?',
            selected: '=?',
            action: '&',
            filter: '='
        },
        link: function(scope, elem) {
            var criteria;

            scope.page = 1;
            scope.fetching = false;
            scope.cache = [];

            /**
              * Generates Identifier to be used by track by expression.
              */
            scope.generateTrackByIdentifier = function(item) {
                return search.generateTrackByIdentifier(item);
            };

            scope.preview = function(item) {
                superdesk.intent('preview', 'item', item);
            };

            scope.edit = function(item) {
                if (item._type === 'ingest') {
                    var activity = superdesk.findActivities({action: 'list', type: 'ingest'}, item)[0];

                    activityService.start(activity, {data: {item: item}}).then((item) => {
                        initEdit(item);
                    });
                } else {
                    initEdit(item);
                }

                function initEdit(item) {
                    superdesk.intent('edit', 'item', item).then(null, () => {
                        superdesk.intent('view', 'item', item);
                    });
                }
            };

            function getProvider(criteria) {
                var provider = 'archive';

                if (scope.stage.type && (desks.isOutputType(scope.stage.type) || scope.stage.type === 'search')) {
                    provider = 'search';
                }

                if (criteria.repo && criteria.repo.indexOf(',') === -1) {
                    provider = criteria.repo;
                }

                return provider;
            }

            function queryItems(queryString) {
                criteria = cards.criteria(scope.stage, queryString);
                scope.loading = true;
                scope.items = scope.total = null;

                if (scope.page > 0 && criteria.source) {
                    criteria.source.from = (scope.page - 1) * criteria.source.size;
                }

                api(getProvider(criteria)).query(criteria)
                    .then((items) => {
                        scope.items = items._items;
                        scope.total = items._meta.total;
                        scope.cache = items._items;
                        setNextItems(criteria);
                    })
                    .finally(() => {
                        scope.loading = false;
                    });
            }

            scope.$watch('filter', queryItems);
            scope.$on('task:stage', (_e, data) => {
                if (scope.stage && (data.new_stage === scope.stage || data.old_stage === scope.stage)) {
                    scheduleQuery();
                }
            });

            scope.$on('content:update', (_e, data) => {
                if (cards.shouldUpdate(scope.stage, data)) {
                    scheduleQuery();
                }
            });

            scope.$on('item:move', (_e, data) => {
                if (data.to_desk && data.from_desk !== data.to_desk ||
                    data.to_stage && data.from_stage !== data.to_stage) {
                    scheduleQuery(2000); // smaller delay.
                }
            });

            scope.$on('content:expired', scheduleQuery);

            scope.$on('item:lock', (_e, data) => {
                _.each(scope.items, (item) => {
                    if (item._id === data.item) {
                        item.lock_user = data.user;
                    }
                });
            });

            scope.$on('item:unlock', (_e, data) => {
                _.each(scope.items, (item) => {
                    if (item._id === data.item) {
                        item.lock_user = null;
                    }
                });
            });

            var queryTimeout;

            /**
             * Schedule content reload after some delay
             *
             * In case it gets called multiple times it will query only once
             */
            function scheduleQuery(delay = 5000) {
                if (!queryTimeout) {
                    queryTimeout = $timeout(() => {
                        queryItems();
                        scope.$applyAsync(() => {
                            // ignore any updates requested in current $digest
                            queryTimeout = null;
                        });
                    }, delay, false);
                }
            }

            var container = elem[0];
            var offsetY = 0;
            var itemHeight = 0;
            var lastScrollTop = 0;

            elem.bind('scroll', (event) => {
                if (scope.fetching) { // ignore scrolling while fetching
                    event.preventDefault();
                    return false;
                }

                if (container.scrollTop + container.offsetHeight >= container.scrollHeight - 3 &&
                        lastScrollTop < container.scrollTop) {
                    lastScrollTop = container.scrollTop;
                    return scope.fetchNext().then(() => {
                        setFetching();
                        container.scrollTop -= 3;
                    });
                }

                if (container.scrollTop <= 2 && lastScrollTop > container.scrollTop) {
                    lastScrollTop = container.scrollTop;
                    return scope.fetchPrevious().then(() => {
                        setFetching();
                        offsetY = 2 - container.scrollTop;
                        container.scrollTop += offsetY;
                    });
                }
            });

            /**
             * This will ignore scrolling for a while, used before we trigger scrolling
             */
            function setFetching() {
                scope.fetching = true;
                $timeout(() => {
                    scope.$applyAsync(() => {
                        scope.fetching = false;
                    });
                }, 200, false);
            }

            /**
             * Populate items from cache for current from/size values
             */
            function sliceItems() {
                scope.items = scope.cache.slice(criteria.source.from, criteria.source.from + criteria.source.size);
            }

            /**
             * Test if we can get items from cache for current from/size values
             */
            function hasItemsInCache() {
                return criteria.source.from + criteria.source.size <= scope.cache.length;
            }

            /**
             * Use cache to finish next/prev handling
             */
            function useCache() {
                return $timeout(() => {
                    scope.$applyAsync(() => { // add apply to avoid full page digest via timeout
                        sliceItems();
                        scope.fetching = false;
                        scope.loading = false;
                    });
                }, 500, false);
            }

            scope.fetchNext = function() {
                if (!scope.fetching) {
                    scope.page += 1;
                    scope.fetching = scope.loading = true;
                    criteria.source.from = (scope.page - 1) * criteria.source.size;

                    if (hasItemsInCache()) {
                        return useCache();
                    }

                    return api(getProvider(criteria)).query(criteria)
                        .then(addItemsToCache)
                        .then(sliceItems)
                        .finally(() => {
                            scope.fetching = false;
                            scope.loading = false;
                        });
                }

                return $q.when(false);
            };

            scope.fetchPrevious = function() {
                if (!scope.fetching && scope.page > 1) {
                    scope.page -= 1;
                    scope.fetching = scope.loading = true;
                    criteria.source.from = (scope.page - 1) * criteria.source.size;

                    if (hasItemsInCache()) { // always true actually
                        return useCache();
                    }
                }

                return $q.when(false);
            };

            function setNextItems(criteria) {
                criteria.source.from = scope.page * criteria.source.size;
                return api(getProvider(criteria)).query(criteria)
                    .then(addItemsToCache);
            }

            /**
             * Add items to cache and filter out items which are there already
             */
            function addItemsToCache(items) {
                scope.cache = scope.cache.concat(items._items.filter((item) =>
                    !scope.cache.find((cacheItem) => cacheItem._id === item._id)
                ));
            }

            var UP = -1,
                DOWN = 1;

            var code;

            elem.on('keydown', (e) => {
                scope.$apply(() => {
                    if (e.keyCode) {
                        code = e.keyCode;
                    } else if (e.which) {
                        code = e.which;
                    }
                    if (code === 38) {
                        scope.move(UP, e);
                    }
                    if (code === 40) {
                        scope.move(DOWN, e);
                    }
                    if (code === 13 && scope.selected) {
                        scope.edit(scope.selected);
                    }
                });
            });

            scope.move = function(diff, event) {
                if (!_.isNil(scope.selected) && $rootScope.config.features.customMonitoringWidget && scope.items) {
                    var index = _.findIndex(scope.items, {_id: scope.selected._id});

                    if (!itemHeight) {
                        var containerItems = container.getElementsByTagName('li');

                        if (containerItems.length) {
                            itemHeight = containerItems[0].offsetHeight;
                        }
                    }
                    if (index === -1) { // selected not in current items, select first
                        container.scrollTop = 0;
                        clickItem(_.head(scope.items), event);
                    }
                    var nextIndex = _.max([0, _.min([scope.items.length - 1, index + diff])]);

                    if (nextIndex < 0) {
                        clickItem(_.last(scope.items), event);
                    }
                    if (index !== nextIndex) {
                        // scrolling in monitoring widget for ntb is done by keyboard
                        // when we select next item if item is out of focus (not visible) it will scroll down
                        if ((nextIndex + 2) * itemHeight > container.offsetHeight + container.scrollTop &&
                            nextIndex > index) {
                            container.scrollTop += itemHeight * 2;
                        }
                        // when we select previous item if item is out of focus (not visible) it will scroll up
                        if (nextIndex * itemHeight < container.scrollTop && nextIndex < index) {
                            container.scrollTop -= itemHeight * 2;
                        }
                        clickItem(scope.items[nextIndex], event);
                    } else if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                    }
                }
            };
            function clickItem(item, $event) {
                scope.select(item);
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $event.stopImmediatePropagation();
                }
            }
            scope.select = function(view) {
                this.selected = view;
            };
        }
    };
}
