/* eslint-disable react/no-render-return-value */
// TODO(*): Fix above?

import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import {ItemList as ItemListComponent} from 'apps/search/components';

ItemList.$inject = [
    '$location',
    '$timeout',
    '$injector',
    '$filter',
    'search',
    'datetime',
    'superdesk',
    'workflowService',
    'archiveService',
    'activityService',
    'multi',
    'desks',
    'familyService',
    'Keys',
    'dragitem',
    'highlightsService',
    'TranslationService',
    'monitoringState',
    'authoringWorkspace',
    '$rootScope',
    'config',
    '$interpolate',
    'metadata',
    'storage',
    'keyboardManager',
    'session',
    'content',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.ItemList
 * @name sdItemList
 *
 * @requires $location
 * @requires $timeout
 * @requires $injector
 * @requires $filter
 * @requires search
 * @requires datetime
 * @requires superdesk
 * @requires workflowService
 * @requires archiveService
 * @requires activityService
 * @requires multi
 * @requires desks
 * @requires familyService
 * @requires Keys
 * @requires dragitem
 * @requires highlightsService
 * @requires TranslationService
 * @requires monitoringState
 * @requires authoringWorkspace
 * @requires $rootScope
 * @requires config
 * @requires $interpolate
 * @requires metadata
 * @requires storage
 * @requires keyboardManager
 * @requires session
 *
 * @description Handles the functionality displaying list of items from repos (archive, ingest, publish,
 * external, content api, archived)
 */

export function ItemList(
    $location,
    $timeout,
    $injector,
    $filter,
    search,
    datetime,
    superdesk,
    workflowService,
    archiveService,
    activityService,
    multi,
    desks,
    familyService,
    Keys,
    dragitem,
    highlightsService,
    TranslationService,
    monitoringState,
    authoringWorkspace,
    $rootScope,
    config,
    $interpolate,
    metadata,
    storage,
    keyboardManager,
    session,
    content,
) {
    // contains all the injected services to be passed down to child
    // components via props
    const services = {
        $location: $location,
        $timeout: $timeout,
        $injector: $injector,
        $filter: $filter,
        search: search,
        datetime: datetime,
        superdesk: superdesk,
        workflowService: workflowService,
        archiveService: archiveService,
        activityService: activityService,
        multi: multi,
        desks: desks,
        familyService: familyService,
        Keys: Keys,
        dragitem: dragitem,
        highlightsService: highlightsService,
        TranslationService: TranslationService,
        monitoringState: monitoringState,
        authoringWorkspace: authoringWorkspace,
        $rootScope: $rootScope,
        config: config,
        $interpolate: $interpolate,
        metadata: metadata,
        storage: storage,
        keyboardManager: keyboardManager,
        session: session,
        content: content,
    };

    return {
        link: function(scope, elem) {
            elem.attr('tabindex', 0);

            var groupId = scope.$id;
            var groups = monitoringState.state.groups || [];

            monitoringState.setState({
                groups: groups.concat(scope.$id),
                activeGroup: monitoringState.state.activeGroup || groupId,
            });

            scope.$watch(() => monitoringState.state.activeGroup, (activeGroup) => {
                if (activeGroup === groupId) {
                    elem.focus();
                }
            });

            monitoringState.init().then(() => {
                var itemList = React.createElement(ItemListComponent,
                    angular.extend({
                        svc: services,
                        scope: scope,
                        hideActionsForMonitoringItems: scope.hideActionsForMonitoringItems,
                        onMonitoringItemSelect: scope.onMonitoringItemSelect,
                        onMonitoringItemDoubleClick: scope.onMonitoringItemDoubleClick,
                        disableMonitoringMultiSelect: scope.disableMonitoringMultiSelect,
                    }, monitoringState.state));

                var listComponent = ReactDOM.render(itemList, elem[0]);

                /**
                 * Test if item a equals to item b
                 *
                 * @param {Object} a
                 * @param {Object} b
                 * @return {Boolean}
                 */
                function isSameVersion(a, b) {
                    return a._etag === b._etag && a._current_version === b._current_version &&
                        a._updated === b._updated && isSameElasticHighlights(a, b);
                }

                /**
                 * Test if item a and item b have same elastic highlights
                 *
                 * @param {Object} a
                 * @param {Object} b
                 * @return {Boolean}
                 */
                function isSameElasticHighlights(a, b) {
                    if (!a.es_highlight && !b.es_highlight) {
                        return true;
                    }

                    if (!a.es_highlight && b.es_highlight || a.es_highlight && !b.es_highlight) {
                        return false;
                    }

                    function getEsHighlight(item) {
                        return item[0];
                    }

                    return _.map(a.es_highlight, getEsHighlight).join('-') ===
                        _.map(b.es_highlight, getEsHighlight).join('-');
                }

                /**
                 * Test if archive_item of a equals to archive_item of b
                 *
                 * @param {Object} a
                 * @param {Object} b
                 * @return {Boolean}
                 */
                function isArchiveItemSameVersion(a, b) {
                    if (!a.archive_item && !b.archive_item) {
                        return true;
                    }

                    if (a.archive_item && b.archive_item) {
                        if (b.archive_item.takes) {
                            return false; // take package of the new item might have changed
                        }

                        return a.archive_item._current_version === b.archive_item._current_version &&
                        a.archive_item._updated === b.archive_item._updated;
                    }

                    return false;
                }

                /**
                 * @ngdoc method
                 * @name sdItemList#isContentApiItemAssociation
                 * @private
                 * @description
                 * @param {object} oldItem Existing scope item
                 * @param {object} newItem From search results
                 * @return {boolean} returns true if the id of the featuremedia is same
                 */
                function isContentApiItemAssociation(oldItem, newItem) {
                    if (_.get(oldItem, '_type') !== 'items' || _.get(newItem, '_type') !== 'items') {
                        return true;
                    }

                    if (oldItem && newItem) {
                        return _.get(oldItem, 'associations.featuremedia._id') ===
                                _.get(newItem, 'associations.featuremedia._id');
                    }

                    return false;
                }

                scope.$watch('items', (items) => {
                    if (!items || !items._items) {
                        return;
                    }

                    var itemsList = [];
                    var currentItems = {};
                    var itemsById = angular.extend({}, listComponent.state.itemsById);

                    items._items.forEach((item) => {
                        var itemId = search.generateTrackByIdentifier(item);
                        var oldItem = itemsById[itemId] || null;

                        if (!oldItem || !isSameVersion(oldItem, item) ||
                            !isArchiveItemSameVersion(oldItem, item) ||
                            !isContentApiItemAssociation(oldItem, item)) {
                            itemsById[itemId] = angular.extend({}, oldItem, item);
                        }

                        if (!currentItems[itemId]) { // filter out possible duplicates
                            currentItems[itemId] = true;
                            itemsList.push(itemId);
                        }
                    });

                    listComponent.setState({
                        itemsList: itemsList,
                        itemsById: itemsById,
                        view: scope.view,
                    }, () => {
                        scope.rendering = scope.loading = false;
                    });
                }, true);

                scope.$watch('view', (newValue, oldValue) => {
                    if (newValue !== oldValue) {
                        listComponent.setState({view: newValue});
                    }
                });

                scope.$watch('viewColumn', (newValue, oldValue) => {
                    if (newValue !== oldValue) {
                        scope.$applyAsync(() => {
                            listComponent.setState({swimlane: newValue});
                            scope.refreshGroup();
                        });
                    }
                });

                scope.$on('item:lock', (_e, data) => {
                    var itemId = search.getTrackByIdentifier(data.item, data.item_version);

                    listComponent.updateItem(itemId, {
                        lock_user: data.user,
                        lock_session: data.lock_session,
                        lock_time: data.lock_time,
                        _etag: data._etag,
                    });
                });

                scope.$on('item:unlock', (_e, data) => {
                    listComponent.updateAllItems(data.item, {
                        lock_user: null,
                        lock_session: null,
                        lock_time: null,
                        _etag: data._etag,
                    });
                });

                scope.$on('item:unselect', () => {
                    listComponent.setState({selected: null});
                    listComponent.unbindActionKeyShortcuts();
                });

                scope.$on('item:expired', (_e, data) => {
                    var itemsById = angular.extend({}, listComponent.state.itemsById);
                    var shouldUpdate = false;

                    _.forOwn(itemsById, (item, key) => {
                        if (data.items[item._id]) {
                            itemsById[key] = angular.extend({gone: true}, item);
                            shouldUpdate = true;
                        }
                    });

                    if (shouldUpdate) {
                        listComponent.setState({itemsById: itemsById});
                    }
                });

                scope.$on('item:unlink', (_e, data) => {
                    listComponent.updateAllItems(data.item, {
                        sequence: null,
                        anpa_take_key: null,
                        takes: undefined,
                    });
                });

                scope.$on('item:highlights', (_e, data) => updateMarkedItems('highlights', data));
                scope.$on('item:marked_desks', (_e, data) => updateMarkedItems('marked_desks', data));

                function updateMarkedItems(field, data) {
                    var item = listComponent.findItemByPrefix(data.item_id);

                    function filterMark(mark) {
                        return mark !== data.mark_id;
                    }

                    if (item) {
                        var itemId = search.generateTrackByIdentifier(item);
                        var markedItems = item[field] || [];

                        if (field === 'marked_desks' && item[field]) {
                            markedItems = _.isString(markedItems[0]) ? markedItems : _.map(markedItems, 'desk_id');
                        }

                        if (data.marked) {
                            markedItems = markedItems.concat([data.mark_id]);
                        } else {
                            markedItems = markedItems.filter(filterMark);
                        }

                        listComponent.updateItem(itemId, {[field]: markedItems});
                    }
                }

                scope.$on('multi:reset', (e, data) => {
                    var ids = data.ids || [];
                    var shouldUpdate = false;
                    var itemsById = angular.extend({}, listComponent.state.itemsById);

                    _.forOwn(itemsById, (value, key) => {
                        ids.forEach((id) => {
                            if (_.startsWith(key, id)) {
                                shouldUpdate = true;
                                itemsById[key] = angular.extend({}, value, {selected: null});
                            }
                        });
                    });

                    if (shouldUpdate) {
                        listComponent.setState({itemsById: itemsById});
                    }
                });

                scope.singleLine = search.singleLine;

                scope.$on('rowview:narrow', () => {
                    listComponent.setNarrowView(true);
                });

                scope.$on('rowview:default', () => {
                    listComponent.setNarrowView(false);
                });

                var updateTimeout;

                /**
                 * Function for creating small delay,
                 * before activating render function
                 */
                function handleScroll($event) {
                    // force refresh the group or list, if scroll bar hits the top of list.
                    if (elem[0].scrollTop === 0) {
                        $rootScope.$broadcast('refresh:list', scope.group);
                    }

                    if (scope.rendering) { // ignore
                        $event.preventDefault();
                        return;
                    }

                    // only scroll the list, not its parent
                    $event.stopPropagation();

                    listComponent.closeActionsMenu();
                    $timeout.cancel(updateTimeout);

                    if (!scope.noScroll) {
                        updateTimeout = $timeout(renderIfNeeded, 100, false);
                    }
                }

                /**
                 * Trigger render in case user scrolls to the very end of list
                 */
                function renderIfNeeded() {
                    if (!scope.items) {
                        return; // automatic scroll after removing items
                    }

                    if (isListEnd(elem[0]) && !scope.rendering) {
                        scope.rendering = scope.loading = true;
                        scope.fetchNext(listComponent.state.itemsList.length);
                    }
                }

                /**
                 * Check if we reached end of the list elem
                 *
                 * @param {Element} elem
                 * @return {Boolean}
                 */
                function isListEnd(element) {
                    return element.scrollTop + element.offsetHeight + 200 >= element.scrollHeight;
                }

                elem.on('keydown', listComponent.handleKey);

                elem.on('scroll', handleScroll);

                // remove react elem on destroy
                scope.$on('$destroy', () => {
                    elem.off();
                    listComponent.unbindActionKeyShortcuts();
                    ReactDOM.unmountComponentAtNode(elem[0]);
                });
            });
        },
    };
}
