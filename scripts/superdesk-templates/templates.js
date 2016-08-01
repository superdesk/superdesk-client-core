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

    function notifySaveError(response, notify) {
        if (angular.isDefined(response.data._issues) &&
                angular.isDefined(response.data._issues['validator exception'])) {
            notify.error(gettext('Error: ' + response.data._issues['validator exception']));

        } else if (angular.isDefined(response.data._issues) &&
                angular.isDefined(response.data._issues.template_name)) {
            notify.error(gettext('Error: ' + response.data._issues.template_name));

        } else if (angular.isDefined(response.data._message)) {
            notify.error(gettext(response.data._message));
        } else {
            notify.error(gettext('Error: Failed to save template.'));
        }
    }

    TemplatesSettingsController.$inject = ['$scope'];
    function TemplatesSettingsController($scope) {

    }

    TemplatesService.$inject = ['api', 'session', '$q', 'gettext', 'preferencesService'];
    function TemplatesService(api, session, $q, gettext, preferencesService) {
        var PAGE_SIZE = 10;
        var PREFERENCES_KEY = 'templates:recent';

        var KILL_TEMPLATE_IGNORE_FIELDS = ['dateline', 'template_desks', 'schedule_desk',
        'schedule_stage', 'schedule', 'next_run', 'last_run'];
        var self = this;

        this.TEMPLATE_METADATA = [
            'headline',
            'slugline',
            'abstract',
            'dateline',
            'byline',
            'subject',
            'genre',
            'type',
            'flags',
            'language',
            'anpa_category',
            'anpa_take_key',
            'keywords',
            'priority',
            'profile',
            'urgency',
            'pubstatus',
            'description_text',
            'body_html',
            'body_text',
            'body_footer',
            'place',
            'located',
            'creditline',
            'ednote',
            'language',
            'usageterms',
            'target_types',
            'target_regions',
            'target_subscribers',
            'format'
        ];

        /**
         * Filter out item data that is not usable for template
         *
         * @param {Object} item
         * @return {Object}
         */
        this.pickItemData = function(item) {
            return _.pick(item, this.TEMPLATE_METADATA);
        };

        this.types = [
            {_id: 'kill', label: gettext('Kill')},
            {_id: 'create', label: gettext('Create')},
            {_id: 'highlights', label: gettext('Highlights')}
        ];

        /*
         * To fetch all the templates based on the user and its user_type
         * Used in template management screen.
         */
        this.fetchAllTemplates = function(page, pageSize, type, templateName) {
            var params = {
                page: page || 1,
                max_results: pageSize || PAGE_SIZE,
                sort: 'template_name'
            };

            var criteria = {};
            // in template management only see the templates that are create by the user
            criteria.$or = [{user: session.identity._id}];

            // if you are admin then you can edit public templates
            if (self.isAdmin()) {
                criteria.$or.push({is_public: true});
            }

            if (type !== undefined) {
                criteria.template_type = type;
            }

            if (templateName) {
                criteria.template_name = {'$regex': templateName, '$options': '-i'};
            }

            params.where = JSON.stringify({
                '$and': [criteria]
            });

            return api.query('content_templates', params);
        };

        this.fetchTemplatesByUserDesk = function (user, desk, page, pageSize, type, templateName) {
            var params = {
                page: page || 1,
                max_results: pageSize || PAGE_SIZE,
                sort: 'template_name'
            };

            var criteria = {};

            if (!user) {
                return $q.when();
            }

            var desk_criteria = [
                {'template_desks': {'$exists': false}, is_public: true},
                {'template_desks': {'$eq': []}, is_public: true}
            ];

            if (desk) {
                desk_criteria.push({'template_desks': {'$in': [desk]}, is_public: true});
            }

            criteria.$or = [{$or: desk_criteria}, {user: user, is_public: false}];

            if (type !== undefined) {
                criteria.template_type = type;
            }

            if (templateName) {
                criteria.template_name = {'$regex': templateName, '$options': '-i'};
            }

            if (!_.isEmpty(criteria)) {
                params.where = JSON.stringify({
                    '$and': [criteria]
                });
            }

            return api.query('content_templates', params);
        };

        this.fetchTemplatesByIds = function(templateIds) {
            if (!templateIds.length) {
                return $q.when();
            }

            var params = {
                max_results: PAGE_SIZE,
                page: 1,
                where: JSON.stringify({_id: {'$in': templateIds}})
            };

            return api.query('content_templates', params)
            .then(function(result) {
                if (result && result._items) {
                    result._items.sort(function(a, b) {
                        return templateIds.indexOf(a._id) - templateIds.indexOf(b._id);
                    });
                }
                return result;
            });
        };

        this.isAdmin = function() {
            return session.identity.user_type === 'administrator';
        };

        this.addRecentTemplate = function(deskId, templateId) {
            return preferencesService.get()
            .then(function(result) {
                result = result || {};
                result[PREFERENCES_KEY] = result[PREFERENCES_KEY] || {};
                result[PREFERENCES_KEY][deskId] = result[PREFERENCES_KEY][deskId] || [];
                _.remove(result[PREFERENCES_KEY][deskId], function(i) {
                    return i === templateId;
                });
                result[PREFERENCES_KEY][deskId].unshift(templateId);
                return preferencesService.update(result);
            });
        };

        this.getRecentTemplateIds = function(deskId, limit) {
            limit = limit || PAGE_SIZE;
            return preferencesService.get()
            .then(function(result) {
                if (result && result[PREFERENCES_KEY] && result[PREFERENCES_KEY][deskId]) {
                    return _.take(result[PREFERENCES_KEY][deskId], limit);
                }
                return [];
            });
        };

        this.getRecentTemplates = function(deskId, limit) {
            limit = limit || PAGE_SIZE;
            return this.getRecentTemplateIds(deskId, limit)
                .then(this.fetchTemplatesByIds);
        };

        /**
         * Save template
         *
         * @param {Object} orig
         * @param {Object} updates
         * @return {Promise}
         */
        this.save = function(orig, updates) {
            var template = angular.extend({data: {}}, updates);
            delete template._datelinedate;
            delete template.hasCrops;
            template.data.headline = trimSpaces(template.data.headline);
            template.data.body_html = trimSpaces(template.data.body_html);
            template.data = this.pickItemData(template.data);
            // certain field are not required for kill template
            if (template && template.template_type === 'kill') {
                template = _.omit(template, KILL_TEMPLATE_IGNORE_FIELDS);
            }
            return api.save('content_templates', orig, template);
        };

        function trimSpaces(value) {
            return value ? value.replace(/&nbsp;/g, '').trim() : '';
        }
    }

    TemplatesDirective.$inject = ['gettext', 'notify', 'api', 'templates', 'modal', 'desks', 'weekdays',
                                  'content', '$filter', 'lodash'];
    function TemplatesDirective(gettext, notify, api, templates, modal, desks, weekdays, content, $filter, _) {
        return {
            templateUrl: 'scripts/superdesk-templates/views/templates.html',
            link: function ($scope) {
                $scope.weekdays = weekdays;
                $scope.content_templates = null;
                $scope.origTemplate = null;
                $scope.template = null;
                $scope.desks = null;
                $scope.template_desk = null;
                $scope.error = {};

                function fetchTemplates() {
                    templates.fetchAllTemplates(1, 200).then(
                        function(result) {
                            result._items = $filter('sortByName')(result._items, 'template_name');
                            $scope.content_templates = result;
                        }
                    );
                }

                desks.initialize().then(function() {
                    $scope.desks = desks.desks;
                    selectDesk(null);
                });

                content.getTypes().then(function() {
                    $scope.content_types = content.types;
                });

                /*
                 * Checks if the user is Admin or Not.
                 */
                $scope.isAdmin = function() {
                    return templates.isAdmin();
                };

                /*
                 * Returns true if desks selection should be displayed
                 */
                $scope.showDesks = function() {
                    return $scope.template != null &&
                        $scope.template.template_type != null &&
                        $scope.template.template_type !== 'kill' &&
                        $scope.template.is_public;
                };

                /*
                 * Returns true if stage selection should be displayed
                 */
                $scope.showStages = function() {
                    return $scope.showScheduling() &&
                        $scope.stages != null && $scope.stages.length > 0;
                };

                /*
                 * Returns true if scheduling should be displayed
                 */
                $scope.showScheduling = function() {
                    return $scope.template != null &&
                        $scope.template.template_type !== 'kill' &&
                        $scope.template.is_public;
                };

                /*
                 * Called on desk toggle on multiple desk selection
                 */
                $scope.toggleDesk = function(desk) {
                    desk.selected = !desk.selected;
                    $scope.onDeskToggle(desk);
                };

                /*
                 * Called on desk toggle on multiple desk selection
                 */
                $scope.onDeskToggle = function(desk) {
                    if (desk.selected && !$scope.template.template_desks) {
                        $scope.template.template_desks = [desk._id];
                        return;
                    }
                    var deskIndex = _.findIndex($scope.template.template_desks, function(val) { return val === desk._id; });
                    if (desk.selected && deskIndex === -1) {
                        $scope.template.template_desks.push(desk._id);
                    }
                    if (!desk.selected && deskIndex !== -1) {
                        $scope.template.template_desks.splice(deskIndex, 1);
                    }
                };

                /*
                 * Set desk selected property for the given desk
                 */
                function selectDesk(deskId) {
                    $scope.template_desk = deskId;
                    _.forEach($scope.desks._items, function(desk) {
                        desk.selected = desk._id === deskId;
                    });
                }

                /*
                 * Set desk selected property for the given desks
                 */
                function selectDesks(desksIds) {
                    if (desksIds instanceof Array) {
                        _.forEach($scope.desks._items, function(desk) {
                            var deskIndex = _.findIndex(desksIds, function(deskId) { return deskId === desk._id; });
                            desk.selected = deskIndex !== -1;
                        });
                    }
                }

                /*
                 * Sets the template template_desks list to null if deskId is null/empty or to a list with one element.
                 */
                $scope.setTemplateDesks = function(deskId) {
                    if (deskId == null || deskId === '') {
                        $scope.template.template_desks = null;
                        selectDesk(null);
                    } else {
                        $scope.template.template_desks = [deskId];
                        selectDesk(deskId);
                    }
                };

                /*
                 * Truncates the template template_desks list to the first element.
                 */
                $scope.resetDesks = function() {
                    if ($scope.template.template_desks != null &&
                            $scope.template.template_type !== 'create' &&
                            $scope.template.template_desks.length > 0) {
                        $scope.template.template_desks.splice(1, $scope.template.template_desks.length - 1);
                        selectDesk($scope.template.template_desks[0]);
                    }
                    if ($scope.template.template_type === 'create') {
                        $scope.template_desk = null;
                    }
                };

                $scope.templatesFilter = function(template_type) {
                    if ($scope.template._id && $scope.template.template_type === 'kill') {
                        return template_type._id === 'kill';
                    } else {
                        return template_type._id !== 'kill';
                    }
                };

                /*
                 * Returns desks names
                 */
                $scope.getTemplateDesks = function (template) {
                    var templateDesks = [];
                    _.forEach(template.template_desks, function(deskId) {
                        var desk = _.find($scope.desks._items , {_id: deskId});
                        if (desk) {
                            templateDesks.splice(-1, 0, desk.name);
                        }
                    });
                    return templateDesks.join(', ');
                };

                /*
                 * Returns the schedule desk stage name
                 */
                $scope.getScheduleDesk = function (template) {
                    if (template != null) {
                        return _.find($scope.desks._items , {_id: template.schedule_desk}).name;
                    }
                    return null;
                };

                /*
                 * Returns the schedule desk stage name
                 */
                $scope.getScheduleStage = function (template) {
                    if (template != null) {
                        return _.find(desks.stages._items , {_id: template.schedule_stage}).name;
                    }
                    return null;
                };

                $scope.types = templates.types;

                function validate(orig, item) {
                    $scope.error = {};
                    if (!item.template_name) {
                        $scope.error.template_name = true;
                    }
                    if (!item.template_type) {
                        $scope.error.template_type = true;
                    }
                    return !_.has($scope.error, 'template_name') && !_.has($scope.error, 'template_type');
                }

                $scope.save = function() {
                    if (validate($scope.origTemplate, $scope.template)) {
                        templates.save($scope.origTemplate, $scope.template)
                        .then(
                            function() {
                                notify.success(gettext('Template saved.'));
                                $scope.cancel();
                            },
                            function(response) {
                                notifySaveError(response, notify);
                            }
                        ).then(fetchTemplates);
                    }
                };

                $scope.edit = function(template) {
                    $scope.origTemplate = template || {template_type: 'create', is_public: true};
                    $scope.template = _.create($scope.origTemplate);
                    $scope.template.schedule = $scope.origTemplate.schedule || {};
                    $scope.template.data = $scope.origTemplate.data || {
                        headline: '',
                        abstract: '',
                        byline: '',
                        body_html: ''
                    };
                    $scope.template.template_desks = $scope.origTemplate.template_desks || [];
                    $scope.stages = $scope.template.schedule_desk ? desks.deskStages[$scope.template.schedule_desk] : null;
                    $scope.template.template_type = $scope.origTemplate.template_type;
                    if (!templates.isAdmin()) {
                        // User with no admin privileges cannot create public templates.
                        $scope.template.is_public = false;
                    } else {
                        $scope.template.is_public = $scope.template.is_public !== false;
                    }

                    $scope.item = $scope.template.data || {};
                    $scope._editable = true;
                    $scope.error = {};
                    selectDesks($scope.template.template_desks);
                };

                $scope.$watch('item.profile', function(profile) {
                    if (profile) {
                        content.getType(profile).then(setupContentType);
                    } else {
                        setupContentType();
                    }
                });

                function setupContentType(type) {
                    $scope.schema = content.schema(type);
                    $scope.editor = content.editor(type);
                }

                $scope.remove = function(template) {
                    modal.confirm(gettext('Are you sure you want to delete the template?'))
                        .then(function() {
                            return api.remove(template);
                        })
                        .then(function(result) {
                            _.remove($scope.templates, template);
                        }, function(response) {
                            if (angular.isDefined(response.data._message)) {
                                notify.error(gettext('Error: ' + response.data._message));
                            } else {
                                notify.error(gettext('There was an error. Template cannot be deleted.'));
                            }
                        })
                        .then(fetchTemplates);
                };

                $scope.cancel = function() {
                    $scope.origTemplate = null;
                    $scope.template = null;
                    $scope.vars = null;
                    fetchTemplates();
                };

                $scope.updateStages = function(desk) {
                    $scope.stages = desk ? desks.deskStages[desk] : null;
                    $scope.template.schedule_stage = null;
                };

                $scope.validSchedule = function() {
                    return $scope.template.schedule.is_active ?
                        $scope.template.schedule.day_of_week && $scope.template.schedule.create_at :
                        true;
                };

                $scope.filters = [
                    {label: gettext('All'), value: 'All'},
                    {label: gettext('Personal'), value: 'Personal'},
                    {label: gettext('No Desk'), value: 'None'}
                ];

                // holds the index of the active filter.
                $scope.activeFilter = 0;

                // sets the active filter to another index.
                $scope.filterBy = function(idx) {
                    $scope.activeFilter = idx;
                };

                // fetch all desks for the current user and add them to
                // the list of filters.
                desks.fetchDesks().then(function(desks) {
                    $scope.filters = $scope.filters.concat(
                        desks._items.map(function(d) {
                            return {label: d.name, value: d._id};
                        })
                    );
                });

                fetchTemplates();
            }
        };
    }

    /**
     * @description Returns a function that allows filtering an array of
     * templates by various criteria.
     */
    FilterTemplatesFilter.$inject = [];
    function FilterTemplatesFilter() {
        /**
         * @description Returns a new array based on the passed filter.
         * @param {Array<Object>} all - Array of templates to filter.
         * @param {Object} f - The filter. Contains keys 'label' and 'value'.
         * If the 'value' is 'All', the entire array is returned. For 'None',
         * only the items without a desk are returned. For 'Personal', only
         * non-public items are returned, and every other value is a hash that
         * represents the desk to filter by.
         * @returns {Array<Object>} The filtered array.
         */
        return function(all, f) {
            return (all || []).filter(function(item) {
                switch (f.value) {
                    case 'All':
                        return all;
                    case 'None':
                        return item.is_public && typeof item.template_desks === 'undefined';
                    case 'Personal':
                        return !item.is_public;
                    default:
                        return _.find(item.template_desks, function(desk) {
                                    return desk === f.value;
                                });
                }
            });
        };
    }

    CreateTemplateController.$inject = ['item', 'templates', 'api', 'desks', '$q', 'notify', 'lodash'];
    function CreateTemplateController(item, templates, api, desks, $q, notify, _) {
        var vm = this;

        this.type = 'create';
        this.name = item.slugline || null;
        this.desk = desks.active.desk || null;
        this.is_public = false;

        this.types = templates.types;
        this.createTypes = _.filter(templates.types, function(element) {
            return element._id !== 'kill';
        });
        this.save = save;

        activate();

        function activate() {
            if (item.template) {
                api.find('content_templates', item.template).then(function(template) {
                    vm.name = template.template_name;
                    vm.desk = template.template_desks != null ? template.template_desks[0] : null;
                    vm.is_public = template.is_public !== false;
                    vm.template = template;
                });
            }

            desks.fetchCurrentUserDesks().then(function(desks) {
                vm.desks = desks._items;
            });
        }

        function save() {
            var data = {
                template_name: vm.name,
                template_type: vm.type,
                template_desks: vm.is_public ? [vm.desk] : null,
                is_public: vm.is_public,
                data: templates.pickItemData(item)
            };

            var template = vm.template ? vm.template : data;
            var diff = vm.template ? data : null;

            // in case there is old template but user renames it - create a new one
            if (vm.template && vm.name !== vm.template.template_name) {
                template = data;
                diff = null;
            }

            return api.save('content_templates', template, diff)
            .then(function(data) {
                vm._issues = null;
                return data;
            }, function(response) {
                notifySaveError(response, notify);
                vm._issues = response.data._issues;
                return $q.reject(vm._issues);
            });
        }
    }

    TemplateMenuController.$inject = ['$modal'];
    function TemplateMenuController($modal) {
        this.create = createFromItem;
        function createFromItem(item) {
            $modal.open({
                templateUrl: 'scripts/superdesk-templates/views/create-template.html',
                controller: 'CreateTemplateController',
                controllerAs: 'template',
                resolve: {
                    item: function() {
                        return item;
                    }
                }
            });
        }
    }

    TemplateSelectDirective.$inject = ['api', 'desks', 'session', 'templates', 'notify', 'gettext'];
    function TemplateSelectDirective(api, desks, session, templates, notify, gettext) {
        var PAGE_SIZE = 200;

        return {
            templateUrl: 'scripts/superdesk-templates/views/sd-template-select.html',
            scope: {
                selectAction: '=',
                open: '='
            },
            link: function(scope) {
                scope.options = {
                    templateName: null
                };

                scope.close = function() {
                    scope.open = false;
                };

                scope.select = function(template) {
                    scope.selectAction(template);
                    scope.close();
                };

                scope.loading = false;

                /**
                 * Fetch templates and assign it to scope but split it into public/private
                 */
                function fetchTemplates() {
                    scope.loading = true;

                    templates.fetchTemplatesByUserDesk(session.identity._id, desks.getCurrentDeskId(),
                        scope.options.page, PAGE_SIZE, 'create', scope.options.templateName)
                    .then(function(result) {
                        scope.loading = false;
                        if (result._items.length === 0) {
                            notify.error(gettext('No Templates found.'));
                        } else {
                            scope.open = true;
                            scope.publicTemplates = [];
                            scope.privateTemplates = [];
                            result._items.forEach(function(template) {
                                if (template.is_public !== false) {
                                    scope.publicTemplates.push(template);
                                } else {
                                    scope.privateTemplates.push(template);
                                }
                            });
                        }
                    });
                }

                scope.$watch('options.templateName', fetchTemplates);
            }
        };
    }

    function TemplateListDirective() {
        var ENTER = 13;
        return {
            scope: {templates: '=', select: '&'},
            templateUrl: 'scripts/superdesk-templates/views/template-list.html',
            link: function(scope) {
                /**
                 * Call select on keyboard event if key was enter
                 *
                 * @param {Event} $event
                 * @param {Object} template
                 */
                scope.selectOnEnter = function($event, template) {
                    if ($event.key === ENTER) {
                        scope.select(template);
                    }
                };
            }
        };
    }

    function TemplateEditorModal() {
        return {
            templateUrl: 'scripts/superdesk-templates/views/template-editor-modal.html'
        };
    }

    angular.module('superdesk.templates', ['superdesk.activity', 'superdesk.authoring', 'superdesk.preferences'])
        .service('templates', TemplatesService)
        .filter('templatesBy', FilterTemplatesFilter)
        .directive('sdTemplates', TemplatesDirective)
        .directive('sdTemplateSelect', TemplateSelectDirective)
        .directive('sdTemplateList', TemplateListDirective)
        .directive('sdTemplateEditorModal', TemplateEditorModal)
        .controller('CreateTemplateController', CreateTemplateController)
        .controller('TemplateMenu', TemplateMenuController)
        .config(config);

    config.$inject = ['superdeskProvider', 'apiProvider'];
    function config(superdesk, apiProvider) {
        superdesk.activity('/settings/templates', {
            label: gettext('Templates'),
            templateUrl: 'scripts/superdesk-templates/views/settings.html',
            controller: TemplatesSettingsController,
            category: superdesk.MENU_SETTINGS,
            priority: 2000
        });
    }
})();
