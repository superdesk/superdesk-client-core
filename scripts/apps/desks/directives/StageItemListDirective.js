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
            scope.cacheNextItems = [];
            scope.cachePreviousItems = [];

            /**
              * Generates Identifier to be used by track by expression.
              */
            scope.generateTrackByIdentifier = function(item) {
                return search.generateTrackByIdentifier(item);
            };

            scope.preview = function(item) {
                superdesk.intent('preview', 'item', item);
            };

            scope.edit = function (item) {
                if (item._type === 'ingest') {
                    var activity = superdesk.findActivities({action: 'list', type: 'ingest'}, item)[0];
                    activityService.start(activity, {data: {item: item}}).then(function (item) {
                        initEdit(item);
                    });
                } else {
                    initEdit(item);
                }

                function initEdit(item) {
                    superdesk.intent('edit', 'item', item).then(null, function () {
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

                api(getProvider(criteria)).query(criteria).then(function(items) {
                    scope.items = items._items;
                    scope.total = items._meta.total;

                    scope.cachePreviousItems = items._items;
                    setNextItems(criteria);
                })['finally'](function() {
                    scope.loading = false;
                });
            }

            scope.$watch('filter', queryItems);
            scope.$on('task:stage', function(_e, data) {
                if (scope.stage && (data.new_stage === scope.stage || data.old_stage === scope.stage)) {
                    scheduleQuery();
                }
            });

            scope.$on('content:update', function(_e, data) {
                if (cards.shouldUpdate(scope.stage, data)) {
                    scheduleQuery();
                }
            });

            scope.$on('item:move', function(_e, data) {
                if ((data.to_desk && data.from_desk !== data.to_desk) ||
                    (data.to_stage && data.from_stage !== data.to_stage))  {
                    scheduleQuery(2000); // smaller delay.
                }
            });

            scope.$on('content:expired', scheduleQuery);

            scope.$on('item:lock', function(_e, data) {
                _.each(scope.items, function(item) {
                    if (item._id === data.item) {
                        item.lock_user = data.user;
                    }
                });
            });

            scope.$on('item:unlock', function(_e, data) {
                _.each(scope.items, function(item) {
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
                    queryTimeout = $timeout(function() {
                        queryItems();
                        scope.$applyAsync(function() {
                            // ignore any updates requested in current $digest
                            queryTimeout = null;
                        });
                    }, delay, false);
                }
            }

            var container = elem[0];
            var offsetY = 0;
            var itemHeight = 0;
            elem.bind('scroll', function() {
                scope.$apply(function() {
                    if (container.scrollTop + container.offsetHeight >= container.scrollHeight - 3) {
                        container.scrollTop -= 3;
                        scope.fetchNext();
                    }
                    if (container.scrollTop <= 2) {
                        offsetY = 2 - container.scrollTop;
                        container.scrollTop += offsetY;
                        scope.fetchPrevious();
                    }
                });
            });
            scope.fetchNext = function() {
                if (!scope.fetching) {
                    if (scope.cacheNextItems.length > 0) {
                        scope.fetching = true;
                        scope.page += 1;

                        criteria.source.from = (scope.page) * criteria.source.size;
                        scope.loading = true;

                        if (scope.items.length > criteria.source.size){
                            scope.cachePreviousItems = _.slice(scope.items, 0, criteria.source.size);
                            scope.items.splice(0, criteria.source.size);
                        }
                        $timeout(function() {
                            if (!_.isEqual(scope.items, scope.cacheNextItems)) {
                                scope.items = scope.items.concat(scope.cacheNextItems);
                            }
                            scope.fetching = false;
                        }, 100);

                        api(getProvider(criteria)).query(criteria)
                        .then(function(items) {
                            scope.cacheNextItems = items._items;
                        })
                        ['finally'](function() {
                            scope.loading = false;
                        });
                    }
                } else {
                    return $q.when(false);
                }
            };
            scope.fetchPrevious = function() {
                if (!scope.fetching && scope.page > 2) {
                    scope.fetching = true;
                    scope.page -= 1;
                    criteria.source.from = scope.page > 3 ? (scope.page - 3) * criteria.source.size : 0;
                    scope.loading = true;

                    if (scope.items.length > criteria.source.size) {
                        scope.cacheNextItems = _.slice(scope.items, criteria.source.size, scope.items.length);
                        scope.items.splice(criteria.source.size, scope.items.length - criteria.source.size);
                    }

                    $timeout(function() {
                        scope.items.unshift.apply(scope.items, scope.cachePreviousItems);
                        scope.fetching = false;
                    }, 100)
                    .then($timeout(function() {
                        // when load previous items, scroll back to focus selected item
                        container.scrollTop += scope.cachePreviousItems.length * itemHeight;
                    }, 100));

                    api(getProvider(criteria)).query(criteria)
                    .then(function(items) {
                        scope.cachePreviousItems = items._items;
                    })
                    ['finally'](function() {
                        scope.loading = false;
                    });
                } else {
                    return $q.when(false);
                }
            };
            function setNextItems(criteria) {
                criteria.source.from = scope.page * criteria.source.size;
                return api(getProvider(criteria)).query(criteria)
                    .then(function(items) {
                        scope.cacheNextItems = items._items;
                    });
            }

            var UP = -1,
                DOWN = 1;

            var code;
            elem.on('keydown', function(e) {
                scope.$apply(function() {
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

            scope.move = function (diff, event) {
                if (scope.selected != null && $rootScope.config.features.customMonitoringWidget) {
                    if (scope.items) {
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
                        } else {
                            if (event) {
                                event.preventDefault();
                                event.stopPropagation();
                                event.stopImmediatePropagation();
                            }
                        }
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
