import notifySaveError from '../helpers';
import {gettext} from 'core/utils';

TemplatesDirective.$inject = ['notify', 'api', 'templates', 'modal', 'desks', 'weekdays',
    'content', '$filter', 'lodash'];
export function TemplatesDirective(notify, api, templates, modal, desks, weekdays, content, $filter, _) {
    return {
        templateUrl: 'scripts/apps/templates/views/templates.html',
        link: function($scope) {
            $scope.weekdays = weekdays;
            $scope.content_templates = null;
            $scope.origTemplate = null;
            $scope.template = null;
            $scope.desks = null;
            $scope.template_desk = null;
            $scope.error = {};

            function fetchTemplates() {
                templates.fetchAllTemplates(1, 200).then(
                    (result) => {
                        result._items = $filter('sortByName')(result._items, 'template_name');
                        $scope.content_templates = result;
                    },
                );
            }

            desks.initialize().then(() => {
                $scope.desks = desks.desks;
                selectDesk(null);
            });

            content.getTypes().then(() => {
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
                return !_.isNil($scope.template) &&
                    !_.isNil($scope.template.template_type) &&
                    $scope.template.template_type !== 'kill' &&
                    $scope.template.is_public;
            };

            /*
             * Returns true if stage selection should be displayed
             */
            $scope.showStages = function() {
                return $scope.showScheduling() &&
                    !_.isNil($scope.stages) && $scope.stages.length > 0;
            };

            /*
             * Returns true if scheduling should be displayed
             */
            $scope.showScheduling = function() {
                return !_.isNil($scope.template) &&
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
                var deskIndex = _.findIndex($scope.template.template_desks, (val) => val === desk._id);

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
                _.forEach($scope.desks._items, (desk) => {
                    desk.selected = desk._id === deskId;
                });
            }

            /*
             * Set desk selected property for the given desks
             */
            function selectDesks(desksIds) {
                if (desksIds instanceof Array) {
                    _.forEach($scope.desks._items, (desk) => {
                        var deskIndex = _.findIndex(desksIds, (deskId) => deskId === desk._id);

                        desk.selected = deskIndex !== -1;
                    });
                }
            }

            /*
             * Sets the template template_desks list to null if deskId is null/empty or to a list with one element.
             */
            $scope.setTemplateDesks = function(deskId) {
                if (_.isNil(deskId) || deskId === '') {
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
                if (!_.isNil($scope.template.template_desks) &&
                        $scope.template.template_type !== 'create' &&
                        $scope.template.template_desks.length > 0) {
                    $scope.template.template_desks.splice(1, $scope.template.template_desks.length - 1);
                    selectDesk($scope.template.template_desks[0]);
                }
                if ($scope.template.template_type === 'create') {
                    $scope.template_desk = null;
                }
            };

            $scope.templatesFilter = function(templateType) {
                if ($scope.template._id && $scope.template.template_type === 'kill') {
                    return templateType._id === 'kill';
                }

                return templateType._id !== 'kill';
            };

            /*
             * Returns desks names
             */
            $scope.getTemplateDesks = function(template) {
                var templateDesks = [];

                _.forEach(template.template_desks, (deskId) => {
                    var desk = _.find($scope.desks._items, {_id: deskId});

                    if (desk) {
                        templateDesks.splice(-1, 0, desk.name);
                    }
                });
                return templateDesks.join(', ');
            };

            /*
             * Returns the schedule desk stage name
             */
            $scope.getScheduleDesk = function(template) {
                if (!_.isNil(template)) {
                    let desk = _.find($scope.desks._items, {_id: template.schedule_desk});

                    return desk ? desk.name : null;
                }
                return null;
            };

            /*
             * Returns the schedule desk stage name
             */
            $scope.getScheduleStage = function(template) {
                if (!_.isNil(template)) {
                    let stage = _.find(desks.stages._items, {_id: template.schedule_stage});

                    return stage ? stage.name : null;
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
                $scope.template.schedule.cron_list = [];
                _.forEach($scope.cron_times, (time) => {
                    $scope.template.schedule.cron_list.push(time.substring(3, 5) + ' ' + time.substring(0, 2) +
                        ' * * ' + $scope.template.schedule.day_of_week.join(','));
                });
                if (validate($scope.origTemplate, $scope.template)) {
                    templates.save($scope.origTemplate, $scope.template)
                        .then(
                            () => {
                                notify.success(gettext('Template saved.'));
                                $scope.cancel();
                            },
                            (response) => {
                                notifySaveError(response, notify);
                            },
                        )
                        .then(fetchTemplates);
                }
            };

            function getCronTimes(schedule) {
                var times = [];

                _.forEach(schedule.cron_list, (cron) => {
                    times.push(cron.split(' ')[1] + ':' + cron.split(' ')[0]);
                });
                return times;
            }

            $scope.removeCronTime = function(cron) {
                _.remove($scope.cron_times, (c) => c === cron);
            };

            $scope.addCronTime = function() {
                if ($scope.new_time && $scope.new_time.picked && _.findIndex($scope.cron_times,
                    (t) => t.toString() === $scope.new_time.picked.substring(0, 5)) === -1) {
                    $scope.cron_times.push($scope.new_time.picked.substring(0, 5));
                    $scope.cron_times = _.sortBy($scope.cron_times);
                    $scope.new_time = {picked: null};
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
                    body_html: '',
                };
                $scope.template.template_desks = $scope.origTemplate.template_desks || [];
                $scope.template_desk = $scope.template.template_desks.length > 0 ?
                    $scope.template.template_desks[0] : '';
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
                $scope.cron_times = getCronTimes($scope.template.schedule);
                $scope.new_time = {picked: null};
            };

            $scope.$watch('item.profile', (profile) => {
                if (profile) {
                    content.getType(profile).then(setupContentType);
                } else {
                    setupContentType();
                }
            });

            $scope.$watch('template.schedule.is_active', (newValue, oldValue) => {
                if (!newValue && oldValue && $scope.template) {
                    // clean schedule data
                    if ($scope.template.schedule) {
                        $scope.template.schedule.day_of_week = [];
                    }
                    delete $scope.template.schedule.create_at;
                    $scope.template.schedule.cron_list = [];
                    $scope.cron_times = [];
                    $scope.template.schedule_desk = null;
                    $scope.template.schedule_stage = null;
                }
            });

            function setupContentType(type?) {
                if (type) {
                    $scope.schema = content.schema(type, $scope.item.type);
                    $scope.editor = content.editor(type, $scope.item.type);
                }
            }

            $scope.remove = function(template) {
                const _desks = _.filter($scope.desks._items, (desk) =>
                    desk.default_content_template === template._id);

                const deskNames = _desks.map((desk) => desk.name).join(', ');

                if (deskNames) {
                    return notify.error(
                        gettext('This is a default template of the following desk(s): {{deskNames}}.', {deskNames}) +
                        ' ' + gettext('Please change the default templates first.'),
                    );
                }

                modal.confirm(gettext('Are you sure you want to delete the template?'))
                    .then(() => api.remove(template))
                    .then((result) => {
                        _.remove($scope.templates, template);
                    }, (response) => {
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

            $scope.isScheduleValid = () => $scope.showScheduling() && $scope.template.schedule.is_active ?
                $scope.template.schedule.day_of_week &&
                    $scope.template.schedule.day_of_week.length > 0 &&
                    $scope.cron_times.length > 0 &&
                    $scope.template.schedule_desk &&
                    $scope.template.schedule_stage : true;

            $scope.filters = [
                {label: gettext('All'), value: 'All'},
                {label: gettext('Personal'), value: 'Personal'},
                {label: gettext('No Desk'), value: 'None'},
            ];

            // holds the index of the active filter.
            $scope.activeFilter = 0;

            // sets the active filter to another index.
            $scope.filterBy = function(idx) {
                $scope.activeFilter = idx;
            };

            // fetch all desks for the current user and add them to
            // the list of filters.
            desks.fetchDesks().then((_desks) => {
                $scope.filters = $scope.filters.concat(
                    _desks._items.map((d) => ({label: d.name, value: d._id})),
                );
            });

            fetchTemplates();
        },
    };
}
