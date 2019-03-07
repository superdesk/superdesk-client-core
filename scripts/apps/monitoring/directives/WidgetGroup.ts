import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import {WidgetItemList as WidgetItemListComponent} from 'apps/search/components';

WidgetGroup.$inject = [
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
    '$rootScope',
    'datetime',
    'metadata',
];

export function WidgetGroup(search, api, superdesk, desks, cards, $timeout, $q,
    $location, $anchorScroll, activityService, $rootScope, datetime, metadata) {
    const services = {
        search: search,
        api: api,
        superdesk: superdesk,
        desks: desks,
        cards: cards,
        $timeout: $timeout,
        $q: $q,
        $location: $location,
        $anchorScroll: $anchorScroll,
        activityService: activityService,
        $rootScope: $rootScope,
        datetime: datetime,
        metadata: metadata,
    };

    return {
        scope: {
            stage: '=',
            total: '=',
            allowed: '=',
            showEmpty: '=?',
            maxItems: '=?',
            selected: '=?',
            action: '&',
            filter: '=',
        },
        link: function(scope, elem) {
            var criteria;

            scope.page = 1;
            scope.fetching = false;
            scope.itemIds = [];
            scope.itemsById = {};

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

            function queryItems(queryString?, params?) {
                if (!scope.fetching) {
                    // page reload disabled when the user scrolls
                    if (container.scrollTop > 20) {
                        return;
                    }
                    scope.page = 1;
                    scope.itemIds = [];
                    scope.itemsById = {};
                }

                criteria = cards.criteria(scope.stage, queryString);

                if (scope.page > 0 && criteria.source) {
                    criteria.source.from = (scope.page - 1) * criteria.source.size;
                }

                if (params) {
                    angular.extend(criteria, params);
                }

                api.query(getProvider(criteria), criteria)
                    .then((items) => {
                        items._items.forEach((item) => {
                            var itemId = search.generateTrackByIdentifier(item);

                            if (!scope.itemsById[itemId]) {
                                scope.itemIds.push(itemId);
                            }
                            scope.itemsById[itemId] = item;
                        });
                        scope.total = items._meta.total;
                    })
                    .finally(() => {
                        scope.fetching = false;

                        if ($rootScope.config.features.customMonitoringWidget &&
                            !scope.selected && scope.itemIds && scope.itemIds.length) {
                            scope.selected = scope.itemsById[(_.head(scope.itemIds) as string)];
                            scope.action({item: scope.selected});
                        }

                        scope.updateList({
                            itemIds: scope.itemIds,
                            itemsById: scope.itemsById,
                            loading: false,
                            selected: scope.selected,
                        });
                    });
            }


            scope.updateItem = function(item, gone, schedule) {
                var itemId;

                if (!item) {
                    if (schedule) {
                        scheduleQuery();
                        return;
                    }
                    return;
                }

                itemId = search.generateTrackByIdentifier(item);

                if (scope.itemsById[itemId]) {
                    angular.extend(item, {
                        gone: gone,
                    });
                    scope.itemsById[itemId] = item;
                    scope.updateList({
                        itemIds: scope.itemIds,
                        itemsById: scope.itemsById,
                    });
                } else if (schedule) {
                    scheduleQuery();
                }
            };

            scope.$on('item:spike', scheduleQuery);
            scope.$on('item:unspike', scheduleQuery);
            scope.$on('item:copy', scheduleQuery);
            scope.$on('item:unlink', scheduleQuery);
            scope.$on('item:duplicate', scheduleQuery);
            scope.$on('item:translate', scheduleQuery);
            scope.$on('item:highlights', scheduleQuery);
            scope.$on('item:marked_desks', scheduleQuery);

            if (scope.stage.type === 'search' && search.doesSearchAgainstRepo(scope.stage.search, 'ingest')) {
                scope.$on('ingest:update', scheduleQuery);
            }

            scope.$watch('filter', (query) => {
                container.scrollTop = 0;
                queryItems(query);
            });

            scope.$on('task:stage', (_e, data) => {
                if (scope.stage && (data.new_stage === scope.stage._id || data.old_stage === scope.stage._id)) {
                    scope.updateItem(getItem(data.item), data.new_stage !== scope.stage._id, true);
                }
            });

            scope.$on('content:update', (_e, data) => {
                if (data && cards.shouldUpdate(scope.stage, data)) {
                    scheduleQuery();
                }
            });

            scope.$on('item:fetch', (_e, data) => {
                if (cards.shouldUpdate(scope.stage, data)) {
                    scheduleQuery();
                }
            });

            scope.$on('item:move', (_e, data) => {
                if (data.to_desk && data.from_desk !== data.to_desk ||
                    data.to_stage && data.from_stage !== data.to_stage) {
                    scope.updateItem(getItem(data.item), scope.stage._id !== data.to_stage, true);
                }
            });

            scope.$on('content:expired', (_e, data) => {
                scope.updateItem(getItem(data.item), true, false);
            });

            scope.$on('item:lock', (_e, data) => {
                var item = getItem(data.item);

                if (!item) {
                    return;
                }
                item.lock_user = data.user;
                scope.updateItem(item, false, false);
            });

            scope.$on('item:unlock', (_e, data) => {
                var item = getItem(data.item);

                if (!item) {
                    return;
                }
                item.lock_user = null;
                scope.updateItem(item, false, false);
            });

            function getItem(itemId) {
                var result;

                _.forOwn(scope.itemsById, (item, key) => {
                    if (item._id === itemId) {
                        result = item;
                    }
                });

                return result;
            }

            var queryTimeout;

            /**
             * Schedule content reload after some delay
             *
             * In case it gets called multiple times it will query only once
             */
            function scheduleQuery(delay = 5000) {
                if (!queryTimeout) {
                    queryTimeout = $timeout(() => {
                        queryItems(null, {auto: 1});
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
                        lastScrollTop <= container.scrollTop) {
                    lastScrollTop = container.scrollTop;
                    return scope.fetchNext().then(() => {
                        setFetching();
                        container.scrollTop -= 3;
                    });
                }

                if (container.scrollTop <= 2 && lastScrollTop >= container.scrollTop) {
                    lastScrollTop = container.scrollTop;
                    offsetY = 2 - container.scrollTop;
                    container.scrollTop += offsetY;
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

            scope.fetchNext = function() {
                if (!scope.fetching) {
                    scope.page += 1;
                    scope.fetching = true;
                    queryItems();
                }

                return $q.when(false);
            };

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
                if (!_.isNil(scope.selected) && $rootScope.config.features.customMonitoringWidget && scope.itemIds) {
                    var itemId = scope.generateTrackByIdentifier(scope.selected);
                    var index = scope.itemIds.findIndex((x) => x === itemId);

                    if (!itemHeight) {
                        var containerItems = container.getElementsByTagName('li');

                        if (containerItems.length) {
                            itemHeight = containerItems[0].offsetHeight;
                        }
                    }
                    if (index === -1) { // selected not in current items, select first
                        container.scrollTop = 0;
                        clickItem(scope.itemsById[(_.head(scope.itemIds) as any)], event);
                    }
                    var nextIndex = _.max([0, _.min([scope.itemIds.length - 1, index + diff])]);

                    if (nextIndex < 0) {
                        clickItem(scope.itemsById[(_.last(scope.itemIds) as any)], event);
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
                        clickItem(scope.itemsById[scope.itemIds[nextIndex]], event);
                    } else if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                    }
                }
            };

            function clickItem(item, $event) {
                scope.select(item, false);
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $event.stopImmediatePropagation();
                }
            }

            scope.select = function(item, apply = true) {
                scope.action({item: item});
                scope.updateList({selected: item});
                if (apply) {
                    scope.$apply();
                }
            };

            scope.setLoading = function(loading) {
                scope.updateList({
                    loading: loading,
                });
            };

            scope.getUpdateCallback = function(updateCallback) {
                scope.updateList = updateCallback;
            };

            var itemList = React.createElement(WidgetItemListComponent,
                {
                    allowed: scope.allowed,
                    customMonitoringWidget: $rootScope.config.features.customMonitoringWidget,
                    svc: services,
                    preview: scope.preview,
                    select: scope.select,
                    edit: scope.edit,
                    updateCallback: scope.getUpdateCallback,
                }
            );

            ReactDOM.render(itemList, elem[0]);

            // remove react elem on destroy
            scope.$on('$destroy', () => {
                elem.off();
                ReactDOM.unmountComponentAtNode(elem[0]);
            });
        },
    };
}
