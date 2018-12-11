/* eslint-disable react/no-render-return-value */
// TODO(*): Fix above?

import React from 'react';
import ReactDOM from 'react-dom';

import {get, map, forOwn, isString, startsWith} from 'lodash';
import {closeAnyActionsMenu} from '../helpers';

import {ItemList as ItemListComponent} from 'apps/search/components';
import {IArticleIdWithTrackByIdentifier, IArticle} from 'superdesk-interfaces/Article';

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

    return map(a.es_highlight, getEsHighlight).join('-') ===
        map(b.es_highlight, getEsHighlight).join('-');
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
    if (get(oldItem, '_type') !== 'items' || get(newItem, '_type') !== 'items') {
        return true;
    }

    if (oldItem && newItem) {
        return get(oldItem, 'associations.featuremedia._id') ===
                get(newItem, 'associations.featuremedia._id');
    }

    return false;
}

/**
 * Check if we reached end of the list elem
 *
 * @param {Element} elem
 * @return {Boolean}
 */
function isListEnd(elem) {
    return elem.scrollTop + elem.offsetHeight + 200 >= elem.scrollHeight;
}

ItemList.$inject = [
    '$location',
    '$timeout',
    '$injector',
    '$filter',
    'search',
    'datetime',
    'gettext',
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
    'gettextCatalog',
    '$rootScope',
    'config',
    '$interpolate',
    'metadata',
    'storage',
    'keyboardManager',
    'session',
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
 * @requires gettext
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
 * @requires gettextCatalog
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

interface IState {
    narrow: boolean;
    itemsList: Array<IArticleIdWithTrackByIdentifier>;
    itemsById: Dictionary<IArticleIdWithTrackByIdentifier, IArticle>;
    view: 'compact' | 'photogrid';
    swimlane: any;
}

export function ItemList(
    $location,
    $timeout,
    $injector,
    $filter,
    search,
    datetime,
    gettext,
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
    gettextCatalog,
    $rootScope,
    config,
    $interpolate,
    metadata,
    storage,
    keyboardManager,
    session,
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
        gettext: gettext,
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
        gettextCatalog: gettextCatalog,
        $rootScope: $rootScope,
        config: config,
        $interpolate: $interpolate,
        metadata: metadata,
        storage: storage,
        keyboardManager: keyboardManager,
        session: session,
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
                class ItemsListDirective extends React.Component<any, IState> {
                    _child: any;
                    updateTimeout: any;

                    constructor(props) {
                        super(props);

                        this.state = {
                            narrow: false,
                            itemsList: [],
                            itemsById: {},
                            view: 'compact',
                            swimlane: undefined,
                        };

                        this._child = null;
                        this.updateTimeout = undefined;

                        this.updateAllItems = this.updateAllItems.bind(this);
                        this.updateItem = this.updateItem.bind(this);
                        this.updateMarkedItems = this.updateMarkedItems.bind(this);
                        this.findItemByPrefix = this.findItemByPrefix.bind(this);
                        this.handleItemsChange = this.handleItemsChange.bind(this);
                        this.handleScroll = this.handleScroll.bind(this);
                        this.renderIfNeeded = this.renderIfNeeded.bind(this);
                    }
                    getChild() {
                        return this._child;
                    }
                    updateItem(itemId, changes) {
                        const item = this.state.itemsById[itemId] || null;

                        if (item) {
                            const itemsById = angular.extend({}, this.state.itemsById);

                            itemsById[itemId] = angular.extend({}, item, changes);
                            this.setState({itemsById: itemsById});
                        }
                    }
                    updateAllItems(itemId, changes) {
                        const itemsById = angular.extend({}, this.state.itemsById);

                        forOwn(itemsById, (value, key) => {
                            if (startsWith(key, itemId)) {
                                itemsById[key] = angular.extend({}, value, changes);
                            }
                        });

                        this.setState({itemsById: itemsById});
                    }
                    findItemByPrefix(prefix) {
                        let item;

                        forOwn(this.state.itemsById, (val, key) => {
                            if (startsWith(key, prefix)) {
                                item = val;
                            }
                        });

                        return item;
                    }
                    updateMarkedItems(field, data) {
                        var item = this.findItemByPrefix(data.item_id);

                        function filterMark(mark) {
                            return mark !== data.mark_id;
                        }

                        if (item) {
                            var itemId = search.generateTrackByIdentifier(item);
                            var markedItems = item[field] || [];

                            if (field === 'marked_desks' && item[field]) {
                                markedItems = isString(markedItems[0]) ? markedItems : map(markedItems, 'desk_id');
                            }

                            if (data.marked) {
                                markedItems = markedItems.concat([data.mark_id]);
                            } else {
                                markedItems = markedItems.filter(filterMark);
                            }

                            this.updateItem(itemId, {[field]: markedItems});
                        }
                    }
                    handleScroll($event) {
                        /**
                         * Function for creating small delay,
                         * before activating render function
                         */

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

                        closeAnyActionsMenu();
                        $timeout.cancel(this.updateTimeout);

                        if (!scope.noScroll) {
                            this.updateTimeout = $timeout(this.renderIfNeeded, 100, false);
                        }
                    }
                    renderIfNeeded() {
                        /**
                        * Trigger render in case user scrolls to the very end of list
                        */
                        if (!scope.items) {
                            return; // automatic scroll after removing items
                        }

                        if (isListEnd(elem[0]) && !scope.rendering) {
                            scope.rendering = scope.loading = true;
                            scope.fetchNext(this.state.itemsList.length);
                        }
                    }
                    componentDidMount() {
                        scope.$on('rowview:narrow', () => {
                            this.setState({narrow: true});
                        });

                        scope.$on('rowview:default', () => {
                            this.setState({narrow: false});
                        });

                        scope.$watch('items', (items) => {
                            if (!items || !items._items) {
                                return;
                            }

                            var itemsList = [];
                            var currentItems = {};
                            var itemsById = angular.extend({}, this.state.itemsById);

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

                            this.setState({
                                itemsList: itemsList,
                                itemsById: itemsById,
                                view: scope.view,
                            }, () => {
                                scope.rendering = scope.loading = false;
                            });
                        }, true);

                        scope.$watch('view', (newValue, oldValue) => {
                            if (newValue !== oldValue) {
                                this.setState({view: newValue});
                            }
                        });

                        scope.$on('item:expired', (_e, data) => {
                            var itemsById = angular.extend({}, this.state.itemsById);
                            var shouldUpdate = false;

                            forOwn(itemsById, (item, key) => {
                                if (data.items[item._id]) {
                                    itemsById[key] = angular.extend({gone: true}, item);
                                    shouldUpdate = true;
                                }
                            });

                            if (shouldUpdate) {
                                this.setState({itemsById: itemsById});
                            }
                        });

                        scope.$watch('viewColumn', (newValue, oldValue) => {
                            if (newValue !== oldValue) {
                                scope.$applyAsync(() => {
                                    this.setState({swimlane: newValue});
                                    scope.refreshGroup();
                                });
                            }
                        });

                        scope.$on('multi:reset', (e, data) => {
                            var ids = data.ids || [];
                            var shouldUpdate = false;
                            var itemsById = angular.extend({}, this.state.itemsById);

                            forOwn(itemsById, (value, key) => {
                                ids.forEach((id) => {
                                    if (startsWith(key, id)) {
                                        shouldUpdate = true;
                                        itemsById[key] = angular.extend({}, value, {selected: null});
                                    }
                                });
                            });

                            if (shouldUpdate) {
                                this.setState({itemsById: itemsById});
                            }
                        });

                        scope.$on('item:lock', (_e, data) => {
                            var itemId = search.getTrackByIdentifier(data.item, data.item_version);

                            this.updateItem(itemId, {
                                lock_user: data.user,
                                lock_session: data.lock_session,
                                lock_time: data.lock_time,
                                _etag: data._etag,
                            });
                        });

                        scope.$on('item:unlock', (_e, data) => {
                            this.updateAllItems(data.item, {
                                lock_user: null,
                                lock_session: null,
                                lock_time: null,
                                _etag: data._etag,
                            });
                        });

                        scope.$on('item:unlink', (_e, data) => {
                            this.updateAllItems(data.item, {
                                sequence: null,
                                anpa_take_key: null,
                                takes: undefined,
                            });
                        });

                        scope.$on('item:highlights', (_e, data) => this.updateMarkedItems('highlights', data));
                        scope.$on('item:marked_desks', (_e, data) => this.updateMarkedItems('marked_desks', data));

                        elem.on('scroll', this.handleScroll);
                    }
                    componentWillUnmount() {
                        elem.off('scroll', this.handleScroll);
                        elem.off();
                    }
                    handleItemsChange(itemsById) {
                        this.setState({itemsById: itemsById});
                    }
                    render() {
                        const props = angular.extend({
                            svc: services,
                            scope: scope,
                        }, monitoringState.state);

                        return (
                            <ItemListComponent
                                {...props}
                                narrow={this.state.narrow}
                                swimlane={this.state.swimlane || storage.getItem('displaySwimlane')}
                                handleItemsChange={this.handleItemsChange}
                                itemsList={this.state.itemsList}
                                itemsById={this.state.itemsById}
                                view={this.state.view}
                                ref={(el) => {
                                    this._child = el;
                                }}
                            />
                        );
                    }
                }

                ReactDOM.render(
                    <ItemsListDirective />,
                    elem[0],
                ).getChild();

                scope.singleLine = search.singleLine;

                // remove react elem on destroy
                scope.$on('$destroy', () => {
                    ReactDOM.unmountComponentAtNode(elem[0]);
                });
            });
        },
    };
}
