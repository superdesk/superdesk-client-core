import _ from 'lodash';
import {IUser} from 'superdesk-interfaces/User';
import {IArticle} from 'superdesk-interfaces/Article';
import {IMonitoringGroupCompatibilityService} from '../services/MonitoringGroupCompatibilityService';

interface IScope extends ng.IScope {
    page: any;
    fetching: any;
    previewingBroadcast: any;
    loading: any;
    cacheNextItems: any;
    cachePreviousItems: any;
    viewColumn: any;
    showRefresh: any;
    items: any;
    selected: any;
    style: any;
    edit: any;
    select: any;
    preview: any;
    viewSingleGroup: any;
    currentGroup: any;
    newItemsCount: any;
    group: any;
    numItems: any;
    view: any;
    viewType: any;
    forceLimited: any;
    total: any;
    refreshGroup(): void;
    fetchNext(i: number): any;

    // support for providing custom data source
    monitoringGroupGetItem(item: IArticle): any;
    monitoringGroupGetItems(from: number, pageSize): any;
}

/**
 * @ngdoc directive
 * @module superdesk.apps.monitoring
 * @name sdMonitoringGroup
 *
 * @description
 *   A directive that generates group/section on stages of a desk or saved search.
 */
MonitoringGroup.$inject = [
    'cards',
    'authoringWorkspace',
    '$timeout',
    'superdesk',
    'session',
    'activityService',
    'search',
    'archiveService',
    'config',
    '$rootScope',
    'monitoringGroupCompatibilityService',
];
export function MonitoringGroup(
    cards,
    authoringWorkspace,
    $timeout,
    superdesk,
    session,
    activityService,
    search,
    archiveService,
    config,
    $rootScope,
    monitoringGroupCompatibilityService: IMonitoringGroupCompatibilityService,
) {
    let ITEM_HEIGHT = 57;
    let PAGE_SIZE = 25;
    let DEFAULT_GROUP_ITEMS = 10;

    return {
        templateUrl: 'scripts/apps/monitoring/views/monitoring-group.html',
        require: ['^sdMonitoringView'],
        scope: {
            monitoringGroupGetItem: '=',
            monitoringGroupGetItems: '=',
            group: '=',
            numItems: '=',
            view: '=',
            viewType: '=',
            forceLimited: '@',
        },
        link: function(scope: IScope, elem, attrs, ctrls) {
            if (typeof scope.monitoringGroupGetItem !== typeof scope.monitoringGroupGetItems) {
                throw new Error(
                    'Both values have to be either supplied or not. Supplying only one of them is not supported.',
                );
            }

            monitoringGroupCompatibilityService.initialize();

            var monitoring = ctrls[0];

            var containerElem = monitoring.viewColumn ? $(document).find('.content-list') : elem.find('.stage-content');

            ITEM_HEIGHT = search.singleLine ? 29 : 57;

            scope.page = 1;
            scope.fetching = false;
            scope.previewingBroadcast = false;
            scope.loading = false;
            scope.cacheNextItems = [];
            scope.cachePreviousItems = [];
            scope.viewColumn = monitoring.viewColumn;

            scope.$on('view:column', (event, data) => {
                scope.$applyAsync(() => {
                    scope.viewColumn = data.viewColumn;
                });
            });

            scope.style = {};

            scope.edit = edit;
            scope.select = select;
            scope.preview = preview;
            scope.viewSingleGroup = viewSingleGroup;

            scope.$watchCollection('group', () => {
                updateGroupStyle();
                scope.refreshGroup();
            });

            scope.$on('task:stage', scheduleQuery);
            scope.$on('item:spike', scheduleIfShouldUpdate);
            scope.$on('item:copy', scheduleQuery);
            scope.$on('item:unlink', scheduleQuery);
            scope.$on('item:duplicate', scheduleQuery);
            scope.$on('item:translate', scheduleQuery);
            scope.$on('broadcast:created', (event, args) => {
                scope.previewingBroadcast = true;
                queryItems();
                preview(args.item);
            });
            scope.$on('item:unspike', scheduleIfShouldUpdate);
            scope.$on('$routeUpdate', (event, data) => {
                if (scope.viewColumn) {
                    updateGroupStyle();
                }
            });
            scope.$on('broadcast:preview', (event, args) => {
                scope.previewingBroadcast = true;
                if (!_.isNil(args.item)) {
                    preview(args.item);
                } else {
                    monitoring.closePreview();
                }
            });

            scope.$on('item:highlights', scheduleQuery);
            scope.$on('item:marked_desks', scheduleQuery);
            scope.$on('content:update', scheduleIfShouldUpdate);

            if (scope.group.type === 'search' && search.doesSearchAgainstRepo(scope.group.search, 'ingest')) {
                scope.$on('ingest:update', (event, data) => {
                    if (!scope.showRefresh) {
                        scheduleQuery(event, data);
                    }
                });
            }

            // Determines if limited maxHeight style need to apply on group list
            function shouldLimited() {
                let limited = !(monitoring.singleGroup || scope.group.type === 'highlights'
                || scope.group.type === 'spike');

                if (!_.isNil(scope.forceLimited)) {
                    limited = JSON.parse(scope.forceLimited);
                }

                return limited;
            }

            function scheduleIfShouldUpdate(event, data) {
                if (data && data.from_stage && data.from_stage === scope.group._id) {
                    // item was moved from current stage
                    extendItem(data.item, {
                        gone: true,
                        _etag: data.from_stage, // this must change to make it re-render
                    });
                    scheduleQuery(event, data);
                } else if (scope.group.type === 'deskOutput' && data &&
                     scope.group._id === _.get(data, 'from_desk') + ':output') {
                    // item was moved to production desk, therefore it should comes in from_desk's output stage too
                    scheduleQuery(event, data);
                } else if (data && data.item && _.includes(['item:spike', 'item:unspike'], event.name)) {
                    // item was spiked/unspiked from the list
                    extendItem(data.item, {
                        gone: true,
                        _etag: data.item,
                    });
                    scheduleQuery(event, data);
                } else if (data && data.to_stage && data.to_stage === scope.group._id) {
                    // new item in current stage
                    scheduleQuery(event, data);
                } else if (data && cards.shouldUpdate(scope.group, data)) {
                    scheduleQuery(event, data);
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

            scope.$on('item:fetch', scheduleIfShouldUpdate);
            scope.$on('item:move', scheduleIfShouldUpdate);

            scope.$watch('selected', (newVal, oldVal) => {
                if (!newVal && scope.previewingBroadcast) {
                    scope.previewingBroadcast = false;
                }
            });

            /*
             * Change between single stage/desk view and monitoring grouped view
             *
             * @param {string} type - type is 'desk' or 'stage' to switch single view
             */
            function toggleMonitoringSingleView(type) {
                if (_.isNil(monitoring.singleGroup) && scope.selected) {
                    scope.$applyAsync(() => {
                        monitoring.viewSingleGroup(monitoring.selectedGroup, type);
                    });
                }

                // Returns back to monitoring view from single view
                if (monitoring.singleGroup) {
                    scope.$applyAsync(() => {
                        monitoring.viewMonitoringHome();
                    });
                }
            }

            /*
             * Change between single stage view and grouped view by keyboard
             * Keyboard shortcut: Ctrl + alt + j
             */
            scope.$on('key:ctrl:alt:j', (event, data) => {
                toggleMonitoringSingleView('stage');
            });

            // refreshes the list for matching group or view type only or if swimlane view is ON.
            scope.$on('refresh:list', (event, group) => {
                const currentScope: any = event.currentScope;
                const _viewType = currentScope.viewType || '';
                const viewTypeMatches = [
                    'highlights',
                    'spiked',
                    'single_monitoring',
                    'monitoring',
                    'deskOutput',
                    'personal',
                ].includes(_viewType);

                if ((group && group._id === scope.group._id) || (!group && viewTypeMatches)) {
                    scope.refreshGroup();
                }
            });

            scope.$on('render:next', (event) => {
                scope.$applyAsync(() => {
                    if (scope.items) {
                        scope.fetchNext(scope.items._items.length);
                    }
                });
            });

            /*
             * Change between single desk view and grouped view by keyboard
             * Keyboard shortcut: Ctrl + alt + g
             */
            scope.$on('key:ctrl:alt:g', () => {
                toggleMonitoringSingleView('desk');
            });

            // forced refresh on refresh button click or on refresh:list
            scope.refreshGroup = function() {
                monitoring.showRefresh = scope.showRefresh = false;
                scheduleQuery(null, {force: true});
            };

            function updateGroupStyle() {
                scope.style.maxHeight = null;
                if (scope.viewColumn) {
                    // maxHeight is not applicable for swimlane/column view, as each stages/column
                    // don't need to have scroll bars because container scroll bar of monitoring
                    // view will serve scrolling
                    $rootScope.$broadcast('resize:header');
                } else if (shouldLimited()) {
                    let groupItems = scope.group.max_items || DEFAULT_GROUP_ITEMS;
                    let scrollOffset = 0;

                    if (groupItems === PAGE_SIZE) {
                        scrollOffset = Math.round(ITEM_HEIGHT / 2);
                    }

                    scope.style.maxHeight = groupItems * ITEM_HEIGHT - scrollOffset;
                }
            }

            var queryTimeout;

            /**
             * Schedule content reload after some delay
             */
            function scheduleQuery(event, data) {
                if (!queryTimeout) {
                    queryTimeout = $timeout(() => {
                        queryItems(event, data, {auto: (data && data.force) ? 0 : 1});
                        scope.$applyAsync(() => {
                            // ignore any updates requested in current $digest
                            queryTimeout = null;
                        });
                    }, 1000, false);
                }
            }

            function edit(item) {
                if (item.state !== 'spiked') {
                    var intent = {action: 'list', type: undefined};

                    if (item._type === 'ingest') {
                        intent.type = 'ingest';
                        fetchAndEdit(intent, item, 'archive');
                    } else if (item._type === 'externalsource') {
                        intent.type = 'externalsource';
                        fetchAndEdit(intent, item, 'externalsource');
                    } else if (archiveService.isPublished(item)) {
                        authoringWorkspace.view(item);
                    } else {
                        authoringWorkspace.edit(item);
                    }
                }
            }

            /**
             * Perform fetch for an item via activity and then edit fetched item
             *
             * @param {Object} intent
             * @param {Object} item
             * @param {String} activityId
             */
            function fetchAndEdit(intent, item, activityId) {
                let activity = _.find(superdesk.findActivities(intent, item), {_id: activityId});

                if (!_.isNil(activity)) {
                    activityService.start(activity, {data: {item: item}})
                        .then((_item) => {
                            authoringWorkspace.edit(_item);
                        });
                }
            }

            function select(item) {
                scope.currentGroup = item.task ? item.task.stage : null;
                scope.selected = item;
                monitoring.selectedGroup = scope.group;
                monitoring.preview(item);
            }

            function preview(item) {
                if (item) {
                    // for items from external source or if type is undefined.
                    if (item._type === 'externalsource') {
                        select(item);
                        return;
                    }

                    scope.loading = true;

                    (
                        typeof scope.monitoringGroupGetItem === 'function'
                            ? scope.monitoringGroupGetItem(item)
                            : monitoringGroupCompatibilityService.getSingleItemCompat(
                                item,
                                PAGE_SIZE,
                                scope.group,
                                monitoring,
                            )
                    )
                        .then((completeItems) => {
                            let completeItem = search.mergeHighlightFields(completeItems._items[0]);

                            select(completeItem);
                        })
                        .finally(() => {
                            scope.loading = false;
                        });
                } else {
                    select(item);
                }

                if (scope.viewColumn) {
                    updateGroupStyle();
                }
            }

            // For highlight page return only highlights items, i.e, include only last version if item type is published
            function getOnlyHighlightsItems(items) {
                items._items = _.filter(items._items, (item) =>
                    item._type === 'published' && item.last_published_version || item._type !== 'published');
                return items;
            }

            // Determine if item is previewing for its respective view type.
            function isItemPreviewing() {
                if (scope.group.type === 'spike') {
                    return monitoring.previewItem &&
                        monitoring.previewItem.task.desk === scope.group._id;
                } else if (scope.group.type === 'highlights') {
                    return monitoring.previewItem &&
                        _.includes(monitoring.previewItem.highlights, monitoring.queryParam.highlight);
                } else if (scope.group.type === 'search') {
                    return !!monitoring.previewItem;
                }

                return monitoring.previewItem && monitoring.previewItem.task.stage === scope.group._id;
            }

            function queryItems(
                event?,
                data?: {force: boolean, items: any, item: any, item_id: string, user: IUser['_id']},
                params?,
            ) {
                const from = 0;

                (
                    typeof scope.monitoringGroupGetItems === 'function'
                        ? scope.monitoringGroupGetItems(from, PAGE_SIZE)
                        : monitoringGroupCompatibilityService.getItemsCompat(
                            from,
                            PAGE_SIZE,
                            scope.group,
                            monitoring,
                            scope.items,
                            scope.showRefresh,
                            event,
                            data,
                            params,
                            false,
                        )
                )
                    .then((items) => {
                        if (config.features.autorefreshContent && data != null) {
                            data.force = true;
                        }

                        if (!scope.showRefresh && data && !data.force && data.user !== session.identity._id) {
                            var itemPreviewing = isItemPreviewing();

                            var _data = {
                                newItems: items,
                                scopeItems: scope.items,
                                scrollTop: containerElem.scrollTop(),
                                isItemPreviewing: itemPreviewing,
                            };

                            monitoring.showRefresh = scope.showRefresh = search.canShowRefresh(_data);
                        }

                        if (!scope.showRefresh || data && data.force) {
                            scope.total = items._meta.total;
                            let onlyHighlighted = scope.group.type === 'highlights'
                                ? getOnlyHighlightsItems(items)
                                : items;

                            monitoring.totalItems = onlyHighlighted._meta.total;
                            scope.items = search.mergeItems(onlyHighlighted, scope.items, null, true);
                        } else {
                            // update scope items only with the matching fetched items
                            scope.items = search.updateItems(items, scope.items);
                        }
                    })
                    .finally(() => {
                        // update scroll position to top, when forced refresh
                        if (data && data.force) {
                            containerElem[0].scrollTop = 0;
                        }
                    });
            }

            scope.fetchNext = function(from) {
                const next = true;

                (
                    typeof scope.monitoringGroupGetItems === 'function'
                        ? scope.monitoringGroupGetItems(from, PAGE_SIZE)
                        : monitoringGroupCompatibilityService.getItemsCompat(
                            from,
                            PAGE_SIZE,
                            scope.group,
                            monitoring,
                            scope.items,
                            scope.showRefresh,
                            true,
                        )
                ).then((items) => {
                    scope.$applyAsync(() => {
                        if (scope.total !== items._meta.total) {
                            scope.total = items._meta.total;
                        }
                        let onlyHighlighted = scope.group.type === 'highlights' ? getOnlyHighlightsItems(items) : items;

                        scope.items = search.mergeItems(onlyHighlighted, scope.items, next);
                    });
                });
            };

            function viewSingleGroup(group, type) {
                monitoring.viewSingleGroup(group, type);
            }
        },
    };
}
