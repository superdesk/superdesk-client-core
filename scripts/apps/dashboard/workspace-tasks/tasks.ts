import _ from 'lodash';
import moment from 'moment';
import './styles/tasks.scss';
import {gettext} from 'core/utils';
import {copyJson} from 'core/helpers/utils';

TasksService.$inject = ['desks', '$rootScope', 'api', 'datetimeHelper'];
function TasksService(desks, $rootScope, api, datetimeHelper) {
    this.statuses = [
        {_id: 'todo', name: gettext('To Do')},
        {_id: 'in_progress', name: gettext('In Progress')},
        {_id: 'done', name: gettext('Done')},
    ];

    this.save = function(orig, task) {
        if (task.task.due_time) {
            task.task.due_date = datetimeHelper.mergeDateTime(task.task.due_date, task.task.due_time);
        }
        delete task.task.due_time;
        if (!task.task.user) {
            delete task.task.user;
        }

        return api('tasks').save(orig, task)
            .then((result) => result);
    };

    this.buildFilter = function(status) {
        var filters = [];
        var self = this;

        if (desks.getCurrentDeskId()) {
            // desk filter
            filters.push({term: {'task.desk': desks.getCurrentDeskId()}});
        } else {
            // user filter
            filters.push({term: {'task.user': $rootScope.currentUser._id}});
        }

        // status filter
        if (status) {
            filters.push({term: {'task.status': status}});
        } else {
            var allStatuses = [];

            _.each(self.statuses, (s) => {
                allStatuses.push({term: {'task.status': s._id}});
            });
            filters.push({or: allStatuses});
        }

        var andFilter = {and: filters};

        return andFilter;
    };

    this.fetch = function(status, filter = this.buildFilter(status)) {
        return api('tasks').query({
            source: {
                size: 200,
                sort: [{_updated: 'desc'}],
                filter: filter,
            },
        });
    };
}

TasksController.$inject = ['$scope', '$timeout', 'api', 'notify', 'desks', 'tasks', '$filter', 'archiveService'];
function TasksController($scope, $timeout, api, notify, desks, tasks, $filter, archiveService) {
    var KANBAN_VIEW = 'kanban',
        timeout;

    $scope.selected = {};
    $scope.newTask = null;
    $scope.tasks = null;
    $scope.view = KANBAN_VIEW;
    $scope.statuses = tasks.statuses;
    $scope.activeStatus = $scope.statuses[0]._id;

    $scope.$watch(() => desks.getCurrentDeskId(), (desk) => {
        if (desk) {
            fetchTasks();
            fetchStages();
            fetchPublished();
            fetchScheduled();
        }
    });

    /**
     * Fetch stages of current desk
     */
    function fetchStages() {
        desks.fetchDeskStages(desks.getCurrentDeskId()).then((stages) => {
            $scope.stages = stages;
        });
    }

    /**
     * Fetch items for current desk which are not published or spiked
     */
    function fetchTasks() {
        $timeout.cancel(timeout);
        timeout = $timeout(() => {
            var filter = {bool: {
                must: {
                    term: {'task.desk': desks.getCurrentDeskId()},
                },
                must_not: {
                    terms: {state: ['published', 'spiked', 'corrected', 'killed', 'recalled']},
                },
            }};

            var source = {source: {
                size: 200,
                sort: [{_updated: 'desc'}],
                filter: filter,
            }};

            api.query('tasks', source).then((result) => {
                $scope.stageItems = _.groupBy(result._items, (item) => item.task.stage);
            });
        }, 300, false);
    }

    /**
     * Fetch content published from a desk
     */
    function fetchPublished() {
        var filter = {bool: {
            must: {
                term: {'task.desk': desks.getCurrentDeskId()},
            },
        }};

        api.query('published', {source: {filter: filter}})
            .then((results) => {
                $scope.published = results;
            });
    }

    /**
     * Fetch templates scheduled for today on current desk
     */
    function fetchScheduled() {
        var startTime = moment().hours(0)
            .minutes(0)
            .seconds(0);

        var endTime = moment().hours(23)
            .minutes(59)
            .seconds(59);

        var filter = {
            schedule_desk: desks.getCurrentDeskId(),
            next_run: {$gte: toServerTime(startTime), $lte: toServerTime(endTime)},
        };

        api.query('content_templates', {where: filter, sort: 'next_run'}).then((results) => {
            $scope.scheduled = results;
        });

        /**
         * Get UTC datetime matching server format for given moment date object
         *
         * @param {Moment} d
         * @return {string}
         */
        function toServerTime(d) {
            d.milliseconds(0); // set it to zero so it will match in replace
            return d.toISOString().replace('.000Z', '+0000');
        }
    }

    $scope.preview = function(item) {
        $scope.selected.preview = item;
    };

    $scope.create = function() {
        $scope.newTask = {};
        archiveService.addTaskToArticle($scope.newTask, desks.getCurrentDesk());

        var taskDate = new Date();

        $scope.newTask.task.due_date = $filter('formatDateTimeString')(taskDate);
        $scope.newTask.task.due_time = $filter('formatDateTimeString')(taskDate, 'HH:mm:ss');
    };

    $scope.save = function() {
        tasks.save({}, $scope.newTask)
            .then((result) => {
                notify.success(gettext('Item saved.'));
                $scope.close();
            });
    };

    $scope.close = function() {
        $scope.newTask = null;
    };

    $scope.setView = function(view) {
        if ($scope.view !== view) {
            $scope.view = view;
            $scope.tasks = null;
            fetchTasks();
        }
    };

    $scope.selectStatus = function(status) {
        if ($scope.activeStatus !== status) {
            $scope.activeStatus = status;
            $scope.tasks = null;
            fetchTasks();
        }
    };

    $scope.$on('task:new', fetchTasks);
    $scope.$on('task:stage', (event, data) => {
        var deskId = desks.getCurrentDeskId();

        if (deskId === data.old_desk || deskId === data.new_desk) {
            fetchTasks();
        }
    });
}

TaskPreviewDirective.$inject = ['tasks', 'desks', 'notify', '$filter'];
function TaskPreviewDirective(tasks, desks, notify, $filter) {
    var promise = desks.initialize();

    return {
        templateUrl: 'scripts/apps/dashboard/workspace-tasks/views/task-preview.html',
        scope: {
            item: '=',
            close: '&onclose',
        },
        link: function(scope) {
            var _orig;

            scope.task = null;
            scope.task_details = null;
            scope.editmode = false;

            promise.then(() => {
                scope.desks = desks.deskLookup;
                scope.users = desks.userLookup;
            });

            scope.$watch('item._id', (val) => {
                if (val) {
                    scope.reset();
                }
            });

            scope.save = function() {
                scope.task.task = _.extend(scope.task.task, scope.task_details);
                tasks.save(_orig, scope.task)
                    .then((result) => {
                        notify.success(gettext('Item saved.'));
                        scope.editmode = false;
                    });
            };

            scope.edit = function() {
                scope.editmode = true;
            };

            scope.reset = function() {
                scope.editmode = false;
                scope.task = copyJson(scope.item);
                scope.task_details = _.extend({}, scope.item.task);
                scope.task_details.due_date = scope.task_details.due_date ?
                    $filter('formatDateTimeString')(scope.task_details.due_date) : null;
                scope.task_details.due_time = scope.task_details.due_time ?
                    $filter('formatDateTimeString')(scope.task_details.due_time, 'HH:mm:ss') : null;
                _orig = scope.item;
            };
        },
    };
}

TaskKanbanBoardDirective.$inject = [];
function TaskKanbanBoardDirective() {
    return {
        templateUrl: 'scripts/apps/dashboard/workspace-tasks/views/kanban-board.html',
        scope: {
            items: '=',
            label: '@',
            cssClass: '@',
            selected: '=',
        },
        link: function(scope) {
            scope.preview = function(item) {
                if (scope.selected) {
                    scope.selected.preview = item;
                }
            };
        },
    };
}

AssigneeViewDirective.$inject = ['desks'];
function AssigneeViewDirective(desks) {
    var promise = desks.initialize();

    return {
        templateUrl: 'scripts/apps/dashboard/workspace-tasks/views/assignee-view.html',
        scope: {
            task: '=',
            name: '=',
            avatarSize: '@',
        },
        link: function(scope) {
            promise.then(function setItemAssigne() {
                var task = angular.extend({desk: null, user: null}, scope.task);
                var desk = desks.deskLookup[task.desk] || {};
                var user = desks.userLookup[task.user] || {};

                scope.deskName = desk.name || null;
                scope.userName = user.display_name || null;
                scope.user = user || null;
            });
        },
    };
}

// todo(petr): move to desks module
StagesCtrlFactory.$inject = ['desks'];
function StagesCtrlFactory(desks) {
    var promise = desks.initialize();

    return function StagesCtrl($scope) {
        var self = this;

        promise.then(() => {
            self.stages = null;
            self.selected = null;

            // select a stage as active
            self.select = function(stage) {
                var stageId = stage ? stage._id : null;

                self.selected = stage || null;
                desks.setCurrentStageId(stageId);
            };

            // reload list of stages
            self.reload = function(deskId) {
                self.stages = deskId ? desks.deskStages[deskId] : null;
                self.select(_.find(self.stages, {_id: desks.activeStageId}));
            };

            $scope.$watch(() => desks.getCurrentDeskId(), () => {
                self.reload(desks.getCurrentDeskId());
            });
        });
    };
}

function DeskStagesDirective() {
    return {
        templateUrl: 'scripts/apps/dashboard/workspace-tasks/views/desk-stages.html',
    };
}

angular.module('superdesk.apps.workspace.tasks', ['superdesk.apps.workspace.menu'])

    .factory('StagesCtrl', StagesCtrlFactory)

    .directive('sdTaskPreview', TaskPreviewDirective)
    .directive('sdAssigneeView', AssigneeViewDirective)
    .directive('sdDeskStages', DeskStagesDirective)
    .directive('sdTaskKanbanBoard', TaskKanbanBoardDirective)
    .controller('TasksController', TasksController)
    .service('tasks', TasksService)

    .config(['superdeskProvider', 'workspaceMenuProvider', function(superdesk, workspaceMenuProvider) {
        superdesk.activity('/workspace/tasks', {
            label: gettext('Workspace'),
            controller: TasksController,
            templateUrl: 'scripts/apps/dashboard/workspace-tasks/views/workspace-tasks.html',
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            filters: [{action: 'view', type: 'task'}],
        });

        superdesk.activity('pick.task', {
            label: gettext('Pick task'),
            icon: 'pick',
            controller: ['data', 'superdesk',
            /**
             * Open given item using sidebar authoring
             *
             * @param {Object} data
             * @param {Object} superdesk service
             * @return {Promise}
             */
                function pickTask(data, superdeskService) {
                    return superdeskService.intent('edit', 'item', data.item);
                },
            ],
            filters: [{action: superdesk.ACTION_EDIT, type: 'task'}],
        });

        workspaceMenuProvider.item({
            href: '/workspace/tasks',
            icon: 'tasks',
            label: gettext('Tasks'),
            shortcut: 'alt+t',
            order: 500,
            if: 'privileges.tasks && workspaceConfig.tasks',
        });
    }]);
