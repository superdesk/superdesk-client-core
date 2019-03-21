import {limits} from 'apps/desks/constants';
import _ from 'lodash';
import {gettext} from 'core/utils';

DeskeditStages.$inject = ['api', 'WizardHandler', 'tasks', '$rootScope', 'desks', 'notify',
    'macros', 'deployConfig'];
export function DeskeditStages(api, WizardHandler, tasks, $rootScope, desks, notify, macros, deployConfig) {
    return {
        link: function(scope, elem, attrs) {
            var orig = null;

            scope.limits = limits;
            scope.saving = false;
            scope.statuses = tasks.statuses;
            scope.systemExpiry = deployConfig.getSync('content_expiry_minutes');

            if (scope.desk.edit && scope.desk.edit.name) {
                macros.getByDesk(scope.desk.edit.name, true).then((_macros) => {
                    scope.macros = _.reject(_macros, {action_type: 'interactive'});
                });
            } else {
                macros.get(true).then((_macros) => {
                    scope.macros = _.reject(_macros, {action_type: 'interactive'});
                });
            }

            scope.$watch('step.current', (step, previous) => {
                if (step === 'stages') {
                    scope.editStage = null;
                    orig = null;
                    scope.stages = [];
                    scope.selected = null;
                    scope.message = null;
                    scope.getstages(previous);
                }
            });

            scope.getstages = function(previous) {
                if (scope.desk.edit && scope.desk.edit._id) {
                    scope.message = gettext('loading...');
                    desks.fetchDeskStages(scope.desk.edit._id, true).then((stages) => {
                        scope.stages = stages;
                        scope.message = null;
                    })
                        .finally(() => { /* no-op */ });
                } else {
                    WizardHandler.wizard('desks').goTo(previous);
                }
            };

            /**
             * Save desk for adding or editing
             *
             * @param {boolean} done
             *      when true it exits otherwise continues
             *      to next step in wizard handler.
             */
            scope.next = function(done) {
                if (!done) {
                    WizardHandler.wizard('desks').next();
                } else {
                    WizardHandler.wizard('desks').finish();
                }
            };

            scope.edit = function(stage) {
                if (_.isNil(stage.is_visible)) {
                    stage.is_visible = true;
                }

                stage.local_readonly = !!stage.local_readonly;

                orig = stage;
                scope.editStage = _.create(stage);
                if (!scope.editStage._id) {
                    var lastStage: any = _.last(scope.stages);

                    if (lastStage) {
                        scope.editStage.task_status = lastStage.task_status;
                    }
                }
            };

            scope.isActive = function(stage) {
                return scope.editStage && scope.editStage._id === stage._id;
            };

            scope.shouldVisible = function() {
                scope.editStage.is_visible = scope.editStage.default_incoming ? true : scope.editStage.is_visible;
            };

            scope.cancel = function() {
                scope.editStage = null;
                clearErrorMessages();
            };

            scope.select = function(stage) {
                if (scope.editStage && scope.editStage._id !== stage._id) {
                    return false;
                }

                scope.selected = stage;
            };

            scope.setStatus = function(status) {
                scope.editStage.task_status = status._id;
            };

            scope.save = function() {
                scope.saving = true;
                scope.message = gettext('Saving...');
                var dest = orig._id ? orig : {};

                var diff = orig._id ? scope.editStage : angular.extend(scope.editStage, {desk: scope.desk.edit._id});

                saveStage(dest, diff);
            };

            function saveStage(dest, diff) {
                api('stages').save(dest, diff)
                    .then((item) => {
                        scope.select(item);
                        return desks.fetchDeskById(item.desk);
                    })
                    .then((desk) => {
                        scope.desk.edit = desk;
                        scope.getstages();
                    }, errorMessage)
                    .finally(() => {
                        scope.saving = false;
                        scope.message = null;
                        scope.editStage = null;
                    });
            }

            function errorMessage(response) {
                if (response.status === 412) {
                    notify.error(gettext('Stage has been modified elsewhere. Please reload the desks'));
                } else if (response.data && response.data._issues) {
                    if (response.data._issues.name && response.data._issues.name.unique) {
                        scope._errorUniqueness = true;
                    } else if (response.data._issues['validator exception']) {
                        notify.error(response.data._issues['validator exception']);
                    }
                } else {
                    scope._error = true;
                }
            }

            scope.handleEdit = function($event) {
                clearErrorMessages();
                if (!_.isNil(scope.editStage.name)) {
                    scope._errorLimits = scope.editStage.name.length > scope.limits.stage ? true : null;
                }
            };

            scope.enableSave = function() {
                return scope.editStage && scope.editStage.name &&
                    scope.editStage.name.length > 0 && !scope._errorLimits;
            };

            function clearErrorMessages() {
                if (scope._errorUniqueness || scope._error || scope._errorLimits) {
                    scope._errorUniqueness = null;
                    scope._error = null;
                    scope._errorLimits = null;
                }

                scope.message = null;
            }

            scope.remove = function(stage) {
                api('stages').remove(stage)
                    .then(() => {
                        if (stage === scope.selected) {
                            scope.selected = null;
                        }
                        _.remove(scope.stages, stage);
                        scope.message = null;
                        return desks.fetchDeskById(stage.desk);
                    })
                    .then((desk) => {
                        scope.desk.edit = desk;
                        desks.refreshStages();
                    }, (response) => {
                        if (angular.isDefined(response.data._message)) {
                            scope.message = gettext('Error: ' + response.data._message);
                        } else {
                            scope.message = gettext('There was a problem, stage was not deleted.');
                        }
                    });
            };
        },
    };
}
