(function() {

    'use strict';

    angular.module('superdesk.monitoring', ['superdesk.api', 'superdesk.aggregate', 'superdesk.search', 'superdesk.ui'])
        .service('cards', CardsService)
        .controller('Monitoring', MonitoringController)
        .directive('sdMonitoringView', MonitoringViewDirective)
        .directive('sdMonitoringGroup', MonitoringGroupDirective)
        .directive('sdMonitoringGroupHeader', MonitoringGroupHeader)
        .directive('sdDeskNotifications', DeskNotificationsDirective)
        .directive('sdItemActionsMenu', ItemActionsMenu)
        .config(configureMonitoring)
        .config(configureSpikeMonitoring)
        .config(configurePersonal)
        .filter('splitText', SplitFilter)
        .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
            keyboardManager.register('Monitoring', 'ctrl + g', gettext('Switches between single/grouped stage view'));
            keyboardManager.register('Monitoring', 'ctrl + alt + g', gettext('Switches between single/grouped desk view'));
        }]);

    configureMonitoring.$inject = ['superdeskProvider'];
    function configureMonitoring(superdesk) {
        superdesk
            .activity('/workspace/monitoring', {
                label: gettext('Monitoring'),
                priority: 100,
                templateUrl: 'scripts/superdesk-monitoring/views/monitoring.html',
                topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
            });
    }

    configureSpikeMonitoring.$inject = ['superdeskProvider'];
    function configureSpikeMonitoring(superdesk) {
        superdesk
            .activity('/workspace/spike-monitoring', {
                label: gettext('Spike Monitoring'),
                priority: 100,
                templateUrl: 'scripts/superdesk-monitoring/views/spike-monitoring.html',
                topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
            });
    }

    /**
     * Configure personal option from left menu
     */
    configurePersonal.$inject = ['superdeskProvider'];
    function configurePersonal(superdesk) {
        superdesk
            .activity('/workspace/personal', {
                label: gettext('Personal'),
                priority: 100,
                templateUrl: 'scripts/superdesk-monitoring/views/personal.html',
                topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
            });
    }

    CardsService.$inject = ['api', 'search', 'session', 'desks', 'config'];
    function CardsService(api, search, session, desks, config) {
        this.criteria = getCriteria;
        this.shouldUpdate = shouldUpdate;

        /**
         * Get items criteria for given card
         *
         * Card can be stage/personal/saved search.
         * There can be also extra string search query
         *
         * @param {Object} card
         * @param {string} queryString
         */
        function getCriteria(card, queryString, queryParam) {
            var params = {};
            var criteria = {};

            if (card.type === 'search' && card.search && card.search.filter.query) {
                angular.copy(card.search.filter.query, params);
                if (card.query) {
                    if (card.search.filter.query.q) {
                        params.q = '(' + card.query + ') ' + card.search.filter.query.q;
                    } else {
                        params.q = '(' + card.query + ') ';
                    }
                }
            } else {
                params.q = card.query;
                criteria.es_highlight = params.q ? search.getElasticHighlight() : 0;
            }

            params.spike = (card.type === 'spike' || card.type === 'spike-personal' ||
                (card.type === 'search' && params.spike === true));

            var query = search.query(search.setFilters(params));

            switch (card.type) {
            case 'search':
                break;

            case 'spike-personal':
            case 'personal':
                query.filter({bool: {
                    must: {term: {original_creator: session.identity._id}},
                    must_not: {exists: {field: 'task.desk'}}
                }});
                break;

            case 'spike':
                query.filter({term: {'task.desk': card._id}});
                break;

            case 'highlights':
                query.filter({and: [
                    {term: {'highlights': queryParam.highlight}}
                ]});
                break;

            case 'deskOutput':
                var desk_id = card._id.substring(0, card._id.indexOf(':'));
                var desk = desks.deskLookup ? desks.deskLookup[desk_id] : null;
                var states = ['scheduled', 'published', 'corrected', 'killed'];
                if (config.monitoring && config.monitoring.scheduled) {
                    states = ['published', 'corrected', 'killed'];
                }
                if (desk) {
                    if (desk.desk_type === 'authoring') {
                        query.filter({or: [
                            {term: {'task.last_authoring_desk': desk_id}},
                            {and: [
                                {term: {'task.desk': desk_id}},
                                {terms: {state: states}}
                            ]}
                        ]});
                    } else if (desk.desk_type === 'production') {
                        query.filter({and: [
                            {term: {'task.desk': desk_id}},
                            {terms: {state: states}}
                        ]});
                    }
                }
                break;

            case 'scheduledDeskOutput':
                desk_id = card._id.substring(0, card._id.indexOf(':'));
                query.filter({and: [
                    {term: {'task.desk': desk_id}},
                    {term: {state: 'scheduled'}}
                ]});
                break;

            default:
                if (card.singleViewType != null && card.singleViewType === 'desk') {
                    query.filter({term: {'task.desk': card.deskId}});
                } else {
                    query.filter({term: {'task.stage': card._id}});
                }
                break;
            }

            if (card.fileType) {
                var termsHighlightsPackage = {and: [
                    {bool: {must: {'exists':{'field': 'highlight'}}}},
                    {terms: {'type': ['composite']}}
                ]};

                var termsTakesPackage = {and: [
                    {term: {'package_type': 'takes'}},
                    {term: {'type': ['composite']}}
                ]};

                var termsFileType = {terms: {'type': JSON.parse(card.fileType)}};

                // Normal package
                if (_.contains(JSON.parse(card.fileType), 'composite')) {
                    termsFileType = {and: [
                        {bool: {must_not: {'exists':{'field': 'highlight'}}}},
                        {bool: {must_not: {term: {'package_type': 'takes'}}}},
                        {terms: {'type': JSON.parse(card.fileType)}}
                    ]};
                }

                if (_.contains(JSON.parse(card.fileType), 'highlightsPackage') &&
                    _.contains(JSON.parse(card.fileType), 'takesPackage')) {
                    query.filter({or: [
                        termsHighlightsPackage,
                        termsTakesPackage,
                        termsFileType
                    ]});
                } else if (_.contains(JSON.parse(card.fileType), 'takesPackage')) {
                    query.filter({or: [
                        termsTakesPackage,
                        termsFileType
                    ]});
                } else if (_.contains(JSON.parse(card.fileType), 'highlightsPackage')) {
                    query.filter({or: [
                        termsHighlightsPackage,
                        termsFileType
                    ]});
                } else {
                    query.filter(termsFileType);
                }
            }

            if (queryString) {
                query.filter({query: {query_string: {query: queryString, lenient: false}}});
                criteria.es_highlight = search.getElasticHighlight();
            }

            criteria.source = query.getCriteria();
            if (card.type === 'search' && card.search && card.search.filter.query.repo) {
                criteria.repo = card.search.filter.query.repo;
            } else if (desks.isPublishType(card.type)) {
                criteria.repo = 'archive,published';
            }

            criteria.source.from = 0;
            criteria.source.size = card.max_items || 25;
            return criteria;
        }

        function shouldUpdate(card, data) {
            switch (card.type) {
            case 'stage':
                // refresh stage if it matches updated stage
                return data.stages && !!data.stages[card._id];
            case 'personal':
                return data.user === session.identity._id;
            case 'deskOutput':
            case 'scheduledDeskOutput':
                var desk_id = card._id.substring(0, card._id.indexOf(':'));
                if (desk_id) {
                    return data.desks && !!data.desks[desk_id];
                }
                return false;
            default:
                // no way to determine if item should be visible, refresh
                return true;
            }
        }
    }

    function SplitFilter() {
        return function(input) {
            input = input || '';
            var out = '';
            for (var i = 0; i < input.length; i++) {
                if (input.charAt(i) === input.charAt(i).toUpperCase()) {
                    out = out + ' ';
                }

                out = out + input.charAt(i);
            }

            return out;
        };
    }

    MonitoringController.$inject = ['$location', 'desks'];
    function MonitoringController($location, desks) {
        this.state = {};

        this.preview = preview;
        this.closePreview = closePreview;
        this.previewItem = null;

        this.selectedGroup = null;
        this.bindedItems = [];

        this.singleGroup = null;
        this.viewSingleGroup = viewSingleGroup;
        this.viewMonitoringHome = viewMonitoringHome;

        this.queryParam = $location.search();

        this.edit = edit;
        this.editItem = null;

        this.totalItems = '';

        this.isDeskChanged = function () {
            return desks.changeDesk;
        };

        this.highlightsDeskChanged = function () {
            if (desks.changeDesk) {
                $location.url('/workspace/monitoring');
            }
        };

        var vm = this;

        function preview(item) {
            vm.previewItem = item;
            vm.state['with-preview'] = !!item;
        }

        function closePreview() {
            preview(null);
        }

        function edit(item) {
            vm.editItem = item;
            vm.state['with-authoring'] = !!item;
        }

        function viewSingleGroup(group, type) {
            group.singleViewType = type;
            vm.singleGroup = group;
        }

        function viewMonitoringHome() {
            vm.singleGroup.singleViewType = null;
            vm.singleGroup = null;
        }
    }

    /**
     * Main monitoring view - list + preview
     *
     * it's a directive so that it can be put together with authoring into some container directive
     */
    MonitoringViewDirective.$inject = ['$rootScope', 'authoringWorkspace'];
    function MonitoringViewDirective($rootScope, authoringWorkspace) {
        return {
            templateUrl: 'scripts/superdesk-monitoring/views/monitoring-view.html',
            controller: 'Monitoring',
            controllerAs: 'monitoring',
            scope: {
                type: '=',
                state: '='
            },
            link: function(scope, elem) {
                var containerElem = elem.find('.content-list');
                containerElem.on('scroll', handleContainerScroll);

                function handleContainerScroll() {
                    if ($rootScope.itemToogle) {
                        scope.$applyAsync(function() {
                            $rootScope.itemToogle(false);
                            $rootScope.itemToogle = null;
                        });
                    }
                }

                scope.$on('$destroy', function() {
                    containerElem.off('scroll');
                });

                scope.$watch(function() {
                    return authoringWorkspace.item;
                }, function(item) {
                    if (item) {
                        scope.monitoring.closePreview();
                    }
                });
            }
        };
    }

    function MonitoringGroupHeader() {
        return {
            templateUrl: 'scripts/superdesk-monitoring/views/monitoring-group-header.html'
        };
    }

    MonitoringGroupDirective.$inject = ['cards', 'api', 'authoringWorkspace', '$timeout', 'superdesk',
        'activityService', 'workflowService', 'keyboardManager', 'desks', 'search', 'multi', 'archiveService', '$rootScope'];
    function MonitoringGroupDirective(cards, api, authoringWorkspace, $timeout, superdesk, activityService,
            workflowService, keyboardManager, desks, search, multi, archiveService, $rootScope) {

        var ITEM_HEIGHT = 57;

        return {
            templateUrl: 'scripts/superdesk-monitoring/views/monitoring-group.html',
            require: ['^sdMonitoringView'],
            scope: {
                group: '=',
                numItems: '=',
                viewType: '='
            },
            link: function(scope, elem, attrs, ctrls) {

                var monitoring = ctrls[0];

                scope.view = 'compact';
                scope.page = 1;
                scope.fetching = false;
                scope.previewingBroadcast = false;
                scope.loading = false;
                scope.cacheNextItems = [];
                scope.cachePreviousItems = [];
                scope.limited = (monitoring.singleGroup || scope.group.type === 'highlights') ? false : true;

                scope.style = {};
                if (scope.limited) {
                    updateGroupStyle();
                }

                scope.edit = edit;
                scope.select = select;
                scope.preview = preview;
                scope.renderNew = renderNew;
                scope.viewSingleGroup = viewSingleGroup;

                scope.$watchCollection('group', function() {
                    if (scope.limited) {
                        updateGroupStyle();
                    }
                    queryItems();
                });

                scope.$on('task:stage', scheduleQuery);
                scope.$on('item:spike', scheduleQuery);
                scope.$on('item:copy', scheduleQuery);
                scope.$on('item:duplicate', scheduleQuery);
                scope.$on('broadcast:created', function(event, args) {
                    scope.previewingBroadcast = true;
                    queryItems();
                    preview(args.item);
                });
                scope.$on('item:unspike', scheduleQuery);
                scope.$on('item:move', scheduleQuery);
                scope.$on('$routeUpdate', scheduleQuery);
                scope.$on('broadcast:preview', function(event, args) {
                    scope.previewingBroadcast = true;
                    if (args.item != null) {
                        preview(args.item);
                    } else {
                        monitoring.closePreview();
                    }
                });

                scope.$on('item:highlight', scheduleQuery);
                scope.$on('content:update', scheduleIfShouldUpdate);

                if (scope.group.type !== 'stage') {
                    scope.$on('ingest:update', scheduleQuery);
                }

                function scheduleIfShouldUpdate(event, data) {
                    if (data.from_stage && data.from_stage === scope.group._id) {
                        // item was moved from current stage
                        extendItem(data.item, {
                            gone: true,
                            _etag: data.from_stage // this must change to make it re-render
                        });
                    } else if (data.to_stage && data.to_stage === scope.group._id) {
                        // new item in current stage
                        scheduleQuery();
                    } else if (data && cards.shouldUpdate(scope.group, data)) {
                        scheduleQuery();
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

                scope.$on('item:fetch', scheduleIfShouldUpdate);
                scope.$on('item:move', scheduleIfShouldUpdate);

                scope.$on('$destroy', unbindActionKeyShortcuts);

                scope.$watch('selected', function(newVal, oldVal) {
                    if (!newVal && scope.previewingBroadcast) {
                        scope.previewingBroadcast = false;
                    }
                });

                /*
                 * Change between single stage view and grouped view by keyboard
                 * Keyboard shortcut: Ctrl + g
                 */
                scope.$on('key:ctrl:g', function () {
                    if (scope.selected) {
                        if (monitoring.singleGroup == null) {
                            monitoring.viewSingleGroup(monitoring.selectedGroup, 'stage');
                        } else {
                            monitoring.viewMonitoringHome();
                        }
                    }
                });

                /*
                 * Change between single desk view and grouped view by keyboard
                 * Keyboard shortcut: Ctrl + g
                 */
                scope.$on('key:ctrl:alt:g', function () {
                    if (scope.selected) {
                        if (monitoring.singleGroup == null) {
                            monitoring.viewSingleGroup(monitoring.selectedGroup, 'desk');
                        } else {
                            monitoring.viewMonitoringHome();
                        }
                    }
                });

                function updateGroupStyle() {
                    scope.style.maxHeight = scope.group.max_items ? scope.group.max_items * ITEM_HEIGHT : null;
                }
                /*
                 * Bind item actions on keyboard shortcuts
                 * Keyboard shortcuts are defined with actions
                 *
                 * @param {Object} item
                 */
                function bindActionKeyShortcuts(item) {
                    // First unbind all binded shortcuts
                    if (monitoring.bindedItems.length) {
                        unbindActionKeyShortcuts();
                    }

                    var intent = {action: 'list'};
                    superdesk.findActivities(intent, item).forEach(function (activity) {
                        if (activity.keyboardShortcut && workflowService.isActionAllowed(item, activity.action)) {
                            monitoring.bindedItems.push(scope.$on('key:' + activity.keyboardShortcut.replace('+', ':'), function () {
                                if (activity._id === 'mark.item') {
                                    bindMarkItemShortcut();
                                } else {
                                    activityService.start(activity, {data: {item: scope.selected}});
                                }
                            }));
                        }
                    });
                }

                /*
                 * Bind highlight dropdown action
                 * Keyboard shortcut is defined with action
                 *
                 * @param {Object} item
                 */
                function bindMarkItemShortcut() {
                    elem.find('.active .more-activity-toggle').click();
                    var highlightDropdown = angular.element('.more-activity-menu.open .dropdown-noarrow');

                    highlightDropdown.addClass('open');
                    if (highlightDropdown.find('button').length > 0) {
                        highlightDropdown.find('button:not([disabled])')[0].focus();

                        keyboardManager.push('up', function () {
                            highlightDropdown.find('button:focus').parent('li').prev().children('button').focus();
                        });
                        keyboardManager.push('down', function () {
                            highlightDropdown.find('button:focus').parent('li').next().children('button').focus();
                        });
                    }
                }

                /*
                 * Unbind all item actions
                 */
                function unbindActionKeyShortcuts() {
                    monitoring.bindedItems.forEach(function (func) {
                        func();
                    });
                    monitoring.bindedItems = [];
                }

                var queryTimeout;

                /**
                 * Schedule content reload after some delay
                 *
                 * In case it gets called multiple times it will query only once
                 */
                function scheduleQuery() {
                    if (!queryTimeout) {
                        queryTimeout = $timeout(function() {
                            queryItems();
                            scope.$applyAsync(function() {
                                // ignore any updates requested in current $digest
                                queryTimeout = null;
                            });
                        }, 1000, false);
                    }
                }

                var criteria;

                function edit(item) {
                    if (item.state !== 'spiked'){
                        if (item._type === 'ingest') {
                            var intent = {action: 'list', type: 'ingest'},
                            activity = superdesk.findActivities(intent, item)[0];

                            activityService.start(activity, {data: {item: item}})
                                .then(function (item) {
                                    authoringWorkspace.edit(item);
                                });
                        } else if (item.type === 'composite' && item.package_type === 'takes') {
                            authoringWorkspace.view(item);
                        } else if (archiveService.isPublished(item)) {
                            authoringWorkspace.view(item);
                        } else {
                            authoringWorkspace.edit(item);
                        }
                    }
                }

                function select(item) {
                    scope.selected = item;
                    monitoring.selectedGroup = scope.group;
                    monitoring.preview(item);
                    bindActionKeyShortcuts(item);
                }

                function preview(item) {
                    select(item);
                }

                // For highlight page return only highlights items, i.e, include only last version if item type is published
                function getOnlyHighlightsItems(items) {
                    items._items = _.filter(items._items, function(item) {
                        return ((item._type === 'published' && item.last_published_version) || item._type !== 'published');
                    });
                    return items;
                }

                function queryItems() {
                    criteria = cards.criteria(scope.group, null, monitoring.queryParam);
                    criteria.source.from = 0;
                    criteria.source.size = 25;

                    if (desks.changeDesk) {
                        desks.changeDesk = false;
                        monitoring.singleGroup = null;
                        multi.reset();
                    }

                    return apiquery().then(function(items) {
                        scope.total = items._meta.total;
                        items = scope.group.type === 'highlights' ? getOnlyHighlightsItems(items) : items;
                        monitoring.totalItems = items._meta.total;
                        scope.items = merge(items);
                    });
                }

                function render(next) {
                    return apiquery().then(function(items) {
                        scope.$applyAsync(function() {
                            if (scope.total !== items._meta.total) {
                                scope.total = items._meta.total;
                            }
                            items = scope.group.type === 'highlights' ? getOnlyHighlightsItems(items) : items;
                            scope.items = merge(items, next);
                        });
                    });
                }

                scope.fetchNext = function(from) {
                    criteria.source.from = from;
                    render(true);
                };

                /**
                 * Request the data on search or archive endpoints
                 * return {promise} list of items
                 */
                function apiquery() {
                    var provider = 'search';
                    if (scope.group.type === 'search' || desks.isPublishType(scope.group.type)) {
                        if (criteria.repo && criteria.repo.indexOf(',') === -1) {
                            provider = criteria.repo;
                            if (!angular.isDefined(criteria.source.size)) {
                                criteria.source.size = 25;
                            }
                        }
                    } else {
                        provider = 'archive';
                    }

                    return api.query(provider, criteria);
                }

                function renderNew() {
                    scope.total += scope.newItemsCount;
                    scope.newItemsCount = 0;
                    render();
                }

                function viewSingleGroup(group, type) {
                    monitoring.viewSingleGroup(group, type);
                }

                function merge(items, next) {
                    return search.mergeItems(items, scope.items, next);
                }
            }
        };
    }

    /**
     * Displays the notifications of the desk of a given stage
     *
     */
    DeskNotificationsDirective.$inject = ['desks', 'deskNotifications', 'authoringWorkspace', '$timeout'];
    function DeskNotificationsDirective(desks, deskNotifications, authoringWorkspace, $timeout) {
        return {
            scope: {stage: '=stage'},
            templateUrl: 'scripts/superdesk-monitoring/views/desk-notifications.html',
            link: function(scope) {

                function init() {
                    // Update the figures if there's a desk mention message
                    init_notifications();
                    if (scope.default_incoming) {
                        scope.$on('desk:mention', function() {$timeout(reload, 5000, true);});
                    }
                }

                function init_notifications () {
                    scope.desk = desks.stageLookup[scope.stage].desk;
                    scope.notifications = deskNotifications.getNotifications(scope.desk);
                    scope.default_incoming = desks.stageLookup[scope.stage].default_incoming;
                    scope.notificationCount = deskNotifications.getUnreadCount(scope.desk) || 0;
                    scope.deskLookup = desks.deskLookup;
                    scope.stageLookup = desks.stageLookup;
                }

                function reload() {
                    deskNotifications.reload();
                    init_notifications();
                }

                /**
                 * Opens the story in the notification
                 * and updates the notification as read
                 *
                 * @param {object} notification The notification to be checked
                 */
                scope.open = function(notification) {
                    authoringWorkspace.view(notification.item);
                };

                /**
                 * Updates the notification as read
                 *
                 * @param {object} notification The notification to be checked
                 */
                scope.acknowledge = function(notification) {
                    deskNotifications.markAsRead(notification, scope.desk);
                    $timeout(reload, 5000);
                };

                function getRecipient(notification) {
                    return _.find(notification.recipients, {'desk_id': scope.desk});
                }

                /**
                 * Checks if the given notification is read
                 *
                 * @param {object} notification The notification to be checked
                 * @return {boolean} True if the notification is read by any user
                 */
                scope.isRead = function(notification) {
                    var recipient = getRecipient(notification);
                    return recipient && recipient.read;
                };

                /**
                 * Returns the name of the user who read the notification
                 *
                 * @param {object} notification The notification to be checked
                 * @return {string} Display name of the user
                 */
                scope.readBy = function(notification) {
                    var recipient = getRecipient(notification);
                    if (recipient && recipient.read) {
                        return desks.userLookup[recipient.user_id].display_name;
                    }
                };

                init();
            }
        };
    }

    ItemActionsMenu.$inject = ['superdesk', 'activityService', 'workflowService', 'archiveService', '$rootScope'];
    function ItemActionsMenu(superdesk, activityService, workflowService, archiveService, $rootScope) {
        return {
            scope: {
                item: '=',
                active: '='
            },
            templateUrl: 'scripts/superdesk-monitoring/views/item-actions-menu.html',
            link: function(scope) {
                /**
                 * Populate scope actions when dropdown is opened.
                 *
                 * @param {boolean} isOpen
                 */
                scope.toggleActions = function(isOpen) {
                    scope.actions = isOpen ? getActions(scope.item) : scope.actions;
                    scope.open = isOpen;

                    if (!isOpen) {
                        // After close, return focus to parent of selected element
                        angular.element('.media-text.selected').parents('li').focus();
                        angular.element('.dropdown-noarrow.open').removeClass('open');
                    } else {
                        $rootScope.itemToogle = scope.toggleActions;
                    }
                };

                /*
                 * If the item gets locked by another user when the activity menu is open then close the menu
                 * as the actions for locked and unlocked are different.
                 */
                scope.$on('item:lock', function(_e, data) {
                    if (scope.open && scope.item && scope.item._id === data.item) {
                        scope.open = false;
                    }
                });

                /**
                 * Stope event propagation so that click on dropdown menu
                 * won't select that item for preview/authoring.
                 *
                 * @param {Event} event
                 */
                scope.stopEvent = function(event) {
                    event.stopPropagation();
                };

                scope.run = function(activity) {
                    $rootScope.$broadcast('broadcast:preview', {'item': null}); // closes preview if already opened
                    return activityService.start(activity, {data: {item: scope.item}});
                };

                /**
                 * Get available actions for given item.
                 *
                 * This is not context aware, it will return everything.
                 *
                 * @param {object} item
                 * @return {object}
                 */
                function getActions(item) {
                    var intent = {action: 'list', type: getType(item)};
                    var groups = {};
                    superdesk.findActivities(intent, item).forEach(function(activity) {
                        if (workflowService.isActionAllowed(scope.item, activity.action)) {
                            var group = activity.group || 'default';
                            groups[group] = groups[group] || [];
                            groups[group].push(activity);
                        }
                    });
                    return groups;
                }

                /**
                 * Get actions type based on item state. Used with activity filter.
                 *
                 * @param {Object} item
                 * @return {string}
                 */
                function getType(item) {
                    return archiveService.getType(item);
                }
            }
        };
    }
})();
