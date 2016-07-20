/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

(function() {

    'use strict';

    /**
     * Service for highlights with caching.
     */
    HighlightsService.$inject = ['api', '$q', '$cacheFactory', 'packages', 'privileges'];
    function HighlightsService(api, $q, $cacheFactory, packages, privileges) {
        var service = {};
        var promise = {};
        var cache = $cacheFactory('highlightList');

        /**
         * Get cached value for given key
         *
         * @param {string} key
         * @return {Object}
         */
        service.getSync = function(key) {
            return cache.get(key);
        };

        /**
         * Fetches and caches highlights, or returns from the cache.
         */
        service.get = function(desk) {
            var DEFAULT_CACHE_KEY = '_nodesk';
            var key = desk || DEFAULT_CACHE_KEY;
            var value = service.getSync(key);

            if (value) {
                return $q.when(value);
            } else if (promise[key]) {
                return promise[key];
            } else {
                var criteria = {};
                if (desk) {
                    criteria = {where: {'$or': [
                                                {'desks': desk},
                                                {'desks': {'$size': 0}}
                                               ]
                                        }
                                };
                }

                promise[key] = api('highlights').query(criteria)
                    .then(function(result) {
                        setLabel(result._items);
                        cache.put(key, result);
                        promise[key] = null;
                        return $q.when(result);
                    });

                return promise[key];
            }
        };

        function setLabel(objItems) {
            _.forEach(objItems, function (item) {
                item.label = item.desks.length ? item.name : item.name + ' ' + gettext('(Global)');
            });
        }

        /**
         * Clear user cache
         */
        service.clearCache = function() {
            cache.removeAll();
            promise = {};
        };

        /**
         * Saves highlight configuration
         */
        service.saveConfig = function(config, configEdit) {
            return api.highlights.save(config, configEdit).then(function(item) {
                service.clearCache();
                return item;
            });
        };

        /**
         * Removes highlight configuration
         */
        service.removeConfig = function(config) {
            return api.highlights.remove(config).then(function() {
                service.clearCache();
            });
        };

        /**
         * Mark an item for a highlight
         */
        service.markItem = function(highlight, marked_item) {
            return api.save('marked_for_highlights', {highlights: highlight, marked_item: marked_item.guid});
        };

        /**
         * Create empty highlight package
         */
        service.createEmptyHighlight = function(highlight) {
            var pkg_defaults = {
                headline: highlight.name,
                highlight: highlight._id
            };

            var group = null;

            if (highlight.groups && highlight.groups.length > 0) {
                group =  highlight.groups[0];
            }
            if (highlight.task) {
                pkg_defaults.task = highlight.task;
            }

            return packages.createEmptyPackage(pkg_defaults, group);
        };

        /**
         * Get single highlight by its id
         *
         * @param {string} _id
         * @return {Promise}
         */
        service.find = function(_id) {
            return api.find('highlights', _id);
        };

        service.hasMarkItemPrivilege = function() {
            return !!privileges.privileges.mark_for_highlights;
        };

        /**
         * Checks if the hourDifference falls in the
         * defined range in highlight
         *
         * @param {string} highlight id
         * @param {int} hourDifference
         * @return {bool}
         */
        service.isInDateRange =  function(highlight, hourDifference) {
            if (highlight) {
                if (highlight.auto_insert === 'now/d') {
                    return hourDifference <= 24;
                } else if (highlight.auto_insert === 'now/w') {
                    return hourDifference <= 168; //24*7
                } else if (_.startsWith(highlight.auto_insert, 'now-')) {
                    var trimmedValue = _.trimLeft(highlight.auto_insert, 'now-');
                    trimmedValue = _.trimRight(highlight.auto_insert, 'h');
                    return hourDifference <= _.parseInt(trimmedValue);
                }
            }

            // If non matches then return false
            return false;
        };

        return service;
    }

    MarkHighlightsDropdownDirective.$inject = ['desks', 'highlightsService', '$timeout'];
    function MarkHighlightsDropdownDirective(desks, highlightsService, $timeout) {
        return {
            templateUrl: 'scripts/superdesk-highlights/views/mark_highlights_dropdown_directive.html',
            link: function(scope) {

                scope.markItem = function(highlight) {
                    scope.item.multiSelect = false;
                    highlightsService.markItem(highlight._id, scope.item);
                };

                scope.isMarked = function(highlight) {
                    return scope.item && scope.item.highlights && scope.item.highlights.indexOf(highlight._id) >= 0;
                };

                highlightsService.get(desks.getCurrentDeskId()).then(function(result) {
                    scope.highlights = result._items;
                    $timeout(function () {
                        var highlightDropdown = angular.element('.more-activity-menu.open .dropdown-noarrow');
                        var buttons = highlightDropdown.find('button:not([disabled])');
                        if (buttons.length > 0) {
                            buttons[0].focus();
                        }
                    });
                });
            }
        };
    }

    MultiMarkHighlightsDropdownDirective.$inject = ['desks', 'highlightsService', 'multi'];
    function MultiMarkHighlightsDropdownDirective(desks, highlightsService, multi) {
        return {
            templateUrl: 'scripts/superdesk-highlights/views/mark_highlights_dropdown_directive.html',
            link: function(scope) {

                scope.multiMark = true;
                scope.markItem = function(highlight) {
                    angular.forEach(multi.getItems(), function(item) {
                        item.multiSelect = true;
                        if (!_.includes(item.highlights, highlight._id)) {
                            highlightsService.markItem(highlight._id, item);
                        }
                    });
                    multi.reset();
                };

                scope.isMarked = function(highlight) {
                    var result = _.find(multi.getItems(), function(item) {
                        return !item.highlights || item.highlights.indexOf(highlight._id) === -1;
                    });
                    return !result;
                };

                highlightsService.get(desks.getCurrentDeskId()).then(function(result) {
                    scope.highlights = result._items;
                });
            }
        };
    }

    HighlightsInfoDirective.$inject = [];
    function HighlightsInfoDirective() {
        return {
            scope: {
                item: '=item'
            },
            templateUrl: 'scripts/superdesk-highlights/views/highlights_info_directive.html'
        };
    }

    HighlightsTitleDirective.$inject = ['highlightsService', '$timeout', 'authoring'];
    function HighlightsTitleDirective(highlightsService, $timeout, authoring) {
        return {
            scope: {
                item: '=item'
            },
            templateUrl: 'scripts/superdesk-highlights/views/highlights_title_directive.html',
            // todo(petr): refactor to use popover-template once angular-bootstrap 0.13 is out
            link: function(scope, elem) {

                /*
                 * Toggle 'open' class on dropdown menu element
                 * @param {string} isOpen
                 */
                scope.toggleClass = function (isOpen) {
                    scope.open = isOpen;
                };

                scope.hasMarkItemPrivilege = authoring.itemActions(scope.item).mark_item;

                scope.$on('item:highlight', function($event, data) {
                    var highlights = scope.item.highlights || [];
                    if (scope.item._id === data.item_id) {
                        scope.$apply(function() {
                            if (data.marked) {
                                scope.item.highlights = highlights.concat(data.highlight_id);
                            } else {
                                scope.item.highlights = _.without(highlights, data.highlight_id);
                            }
                        });
                    }
                });

                scope.$watch('item.highlights', function(items) {
                    if (items) {
                        highlightsService.get().then(function(result) {
                            scope.highlights = _.filter(result._items, function(highlight) {
                                return items.indexOf(highlight._id) >= 0;
                            });
                        });
                    }
                });

                var closeTimeout, self;

                elem.on({
                    click: function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    },
                    mouseenter: function (e) {
                        self = $(this).find('.highlights-list');
                        self.not('.open').children('.dropdown-toggle').click();

                        angular.element('.highlights-list-menu.open').on({
                            mouseenter: function () {
                                $timeout.cancel(closeTimeout);
                            },
                            mouseleave: function () {
                                self.filter('.open').children('.dropdown-toggle').click();
                            }
                        });

                    },
                    mouseleave: function () {
                        closeTimeout = $timeout(function () {
                            self.filter('.open').children('.dropdown-toggle').click();
                        }, 100, false);
                    }
                });

                /*
                 * Removing highlight from an item
                 * @param {string} highlight
                 */
                scope.unmarkHighlight = function (highlight) {
                    highlightsService.markItem(highlight, scope.item).then(function() {
                        scope.item.highlights = _.without(scope.item.highlights, highlight);
                    });
                };
            }
        };
    }

    SearchHighlightsDirective.$inject = ['highlightsService'];
    function SearchHighlightsDirective(highlightsService) {
        return {
            scope: {highlight_id: '=highlight'},
            templateUrl: 'scripts/superdesk-highlights/views/search_highlights_dropdown_directive.html',
            link: function(scope) {
                scope.selectHighlight = function(highlight) {
                    scope.highlight_id = null;
                    if (highlight) {
                        scope.highlight_id = highlight._id;
                    }
                };

                scope.hasHighlights = function() {
                    return _.size(scope.highlights) > 0;
                };

                highlightsService.get().then(function(result) {
                    scope.highlights = result._items;
                });
            }
        };
    }

    PackageHighlightsDropdownDirective.$inject = ['desks', 'highlightsService', '$location', '$route'];
    function PackageHighlightsDropdownDirective(desks, highlightsService, $location, $route) {
        return {
            scope: true,
            templateUrl: 'scripts/superdesk-highlights/views/package_highlights_dropdown_directive.html',
            link: function(scope) {
                scope.$watch(function() {
                    return desks.active;
                }, function(active) {
                    scope.selected = active;
                    highlightsService.get(desks.getCurrentDeskId()).then(function(result) {
                        scope.highlights = result._items;
                        scope.hasHighlights = _.size(scope.highlights) > 0;
                    });
                });

                scope.listHighlight = function(highlight) {
                    $location.url('workspace/highlights?highlight=' + highlight._id);
                    $route.reload();
                };
            }
        };
    }

    HighlightLabelDirective.$inject = ['desks', 'highlightsService'];
    function HighlightLabelDirective(desks, highlightsService) {
        return {
            scope: {highlight_id: '=highlight', totalItems: '=total'},
            template: '<span translate>{{ highlightItem.label }} ({{ totalItems }} items)</span>',
            link: function(scope) {
                highlightsService.get(desks.getCurrentDeskId()).then(function(result) {
                    scope.highlightItem =  _.find(result._items, {_id: scope.highlight_id});
                });
            }
        };
    }

    CreateHighlightsButtonDirective.$inject = ['highlightsService', 'authoringWorkspace', 'privileges'];
    function CreateHighlightsButtonDirective(highlightsService, authoringWorkspace, privileges) {
        return {
            scope: {highlight_id: '=highlight'},
            templateUrl: 'scripts/superdesk-highlights/views/create_highlights_button_directive.html',
            link: function(scope) {
                /**
                 * Create new highlight package for current highlight and start editing it
                 */
                scope.createHighlight = function() {
                    highlightsService.find(scope.highlight_id)
                        .then(highlightsService.createEmptyHighlight)
                        .then(authoringWorkspace.edit);
                };

                scope.hasMarkItemPrivilege = privileges.privileges.mark_for_highlights;
            }
        };
    }

    HighlightsSettingsController.$inject = ['$scope', 'api', 'desks'];
    function HighlightsSettingsController($scope, api, desks) {
        desks.initialize().then(function() {
            $scope.desks = desks.deskLookup;
        });

        api.query('content_templates', {where: {'template_type': 'highlights'}}).then(function(result) {
            $scope.templates = result._items || [];
        });

        $scope.hours = _.range(1, 25);
        $scope.auto = {day: 'now/d', week: 'now/w'};
    }

    HighlightsConfigController.$inject = ['$scope', 'highlightsService', 'desks', 'api', 'gettext', 'notify', 'modal'];
    function HighlightsConfigController($scope, highlightsService, desks, api, gettext, notify, modal) {

        highlightsService.get().then(function(items) {
            $scope.configurations = items;
        });

        $scope.configEdit = {};
        $scope.modalActive = false;

        var limits = {
            group: 45,
            highlight: 40
        };

        $scope.limits = limits;

        var _config;

        $scope.edit = function(config) {
            clearErrorMessages();
            $scope.modalActive = true;
            $scope.configEdit = _.create(config);
            $scope.assignedDesks = deskList(config.desks);
            _config = config;
            if (!$scope.configEdit.auto_insert) {
                $scope.configEdit.auto_insert = 'now/d'; // today
            }
        };

        $scope.cancel = function() {
            $scope.modalActive = false;
        };

        $scope.save = function() {
            var _new = !_config._id;
            $scope.configEdit.desks = assignedDesks();
            $scope.configEdit.groups = ['main'];

            highlightsService.saveConfig(_config, $scope.configEdit).then(function(item) {
                $scope.message = null;
                if (_new) {
                    $scope.configurations._items.unshift(item);
                }
                $scope.modalActive = false;
            }, function(response) {
                errorMessage(response);
            });

            function errorMessage(response) {
                if (response.data && response.data._issues && response.data._issues.name && response.data._issues.name.unique) {
                    $scope._errorUniqueness = true;
                } else {
                    $scope.message = gettext('There was a problem while saving highlights configuration');
                }
            }

        };

        $scope.remove = function(config) {
            modal.confirm(gettext('Are you sure you want to delete configuration?'))
            .then(function() {
                highlightsService.removeConfig(config).then(function() {
                    _.remove($scope.configurations._items, config);
                    notify.success(gettext('Configuration deleted.'), 3000);
                });
            });
        };

        $scope.getHourVal = function(hour) {
            return 'now-' + hour + 'h';
        };

        function deskList(arr) {
            return _.map($scope.desks, function(d) {
                return {
                    _id: d._id,
                    name: d.name,
                    included: isIncluded(arr, d._id)
                };
            });
        }

        function isIncluded(arr, id) {
            return _.findIndex(arr, function(c) { return c === id; }) > -1;
        }

        function assignedDesks() {
            return _.map(_.filter($scope.assignedDesks, {included: true}),
                function(desk) {
                    return desk._id;
                });
        }

        $scope.handleEdit = function($event) {
            clearErrorMessages();
            if ($scope.configEdit.name != null) {
                $scope._errorLimits = $scope.configEdit.name.length > $scope.limits.highlight ? true : null;
            }
        };

        function clearErrorMessages() {
            if ($scope._errorUniqueness || $scope._errorLimits) {
                $scope._errorUniqueness = null;
                $scope._errorLimits = null;
            }
            $scope.message = null;
        }
    }

    var app = angular.module('superdesk.highlights', [
        'superdesk.desks',
        'superdesk.packaging',
        'superdesk.activity',
        'superdesk.api'
    ]);

    app
    .service('highlightsService', HighlightsService)
    .directive('sdCreateHighlightsButton', CreateHighlightsButtonDirective)
    .directive('sdMarkHighlightsDropdown', MarkHighlightsDropdownDirective)
    .directive('sdMultiMarkHighlightsDropdown', MultiMarkHighlightsDropdownDirective)
    .directive('sdPackageHighlightsDropdown', PackageHighlightsDropdownDirective)
    .directive('sdHighlightsInfo', HighlightsInfoDirective)
    .directive('sdHighlightsTitle', HighlightsTitleDirective)
    .directive('sdSearchHighlights', SearchHighlightsDirective)
    .directive('sdHighlightsConfig', function() {
        return {
            controller: HighlightsConfigController
        };
    })
    .directive('sdHighlightsConfigModal', function() {
        return {
            require: '^sdHighlightsConfig',
            templateUrl: 'scripts/superdesk-highlights/views/highlights_config_modal.html',
            link: function(scope, elem, attrs, ctrl) {
            }
        };
    })
    .directive('sdHighlightLabel', HighlightLabelDirective)
    .config(['superdeskProvider', function(superdesk) {
        superdesk
        .activity('mark.item', {
            label: gettext('Mark for highlight'),
            priority: 30,
            icon: 'star',
            dropdown: ['item', 'className', 'highlightsService', 'desks', 'gettext', 'translatedLabel',
            function(item, className, highlightsService, desks, gettext, translatedLabel) {
                var highlights = highlightsService.getSync(desks.getCurrentDeskId()) || {_items: []};

                var HighlightBtn = React.createClass({
                    markHighlight: function(event) {
                        event.stopPropagation();
                        highlightsService.markItem(this.props.highlight._id, this.props.item);
                    },
                    render: function() {
                        var item = this.props.item;
                        var highlight = this.props.highlight;
                        var isMarked = item.highlights && item.highlights.indexOf(highlight._id) >= 0;
                        return React.createElement(
                            'button',
                            {disabled: isMarked, onClick: this.markHighlight},
                            React.createElement('i', {className: 'icon-star'}),
                            highlight.label
                        );
                    }
                });

                var createHighlightItem = function(highlight) {
                    return React.createElement(
                        'li',
                        {key: 'highlight-' + highlight._id},
                        React.createElement(HighlightBtn, {item: item, highlight: highlight})
                    );
                };

                var noHighlights = function() {
                    return React.createElement(
                        'li',
                        {},
                        React.createElement(
                            'button',
                            {disabled: true},
                            translatedLabel)
                    );
                };

                return React.createElement(
                    'ul',
                    {className: className},
                    highlights._items.length ? highlights._items.map(createHighlightItem) : React.createElement(noHighlights)
                );
            }],
            keyboardShortcut: 'ctrl+shift+d',
            templateUrl: 'scripts/superdesk-highlights/views/mark_highlights_dropdown.html',
            filters: [
                {action: 'list', type: 'archive'}
            ],
            additionalCondition:['authoring', 'item', function(authoring, item) {
                return authoring.itemActions(item).mark_item;
            }],
            group: 'packaging'
        })
        .activity('/settings/highlights', {
            label: gettext('Highlights'),
            controller: HighlightsSettingsController,
            templateUrl: 'scripts/superdesk-highlights/views/settings.html',
            category: superdesk.MENU_SETTINGS,
            priority: -800,
            privileges: {highlights: 1}
        }).
        activity('/workspace/highlights', {
            label: gettext('Highlights View'),
            priority: 100,
            templateUrl: 'scripts/superdesk-monitoring/views/highlights-view.html',
            topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
        });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('highlights', {
            type: 'http',
            backend: {rel: 'highlights'}
        });
        apiProvider.api('markForHighlights', {
            type: 'http',
            backend: {rel: 'marked_for_highlights'}
        });
        apiProvider.api('generate_highlights', {
            type: 'http',
            backend: {rel: 'generate_highlights'}
        });
    }]);

    return app;
})();
