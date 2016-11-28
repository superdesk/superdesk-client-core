import {limits} from 'apps/desks/constants';
import _ from 'lodash';

DeskeditStages.$inject = ['gettext', 'api', 'WizardHandler', 'tasks', '$rootScope', 'desks', 'notify', 'macros'];
export function DeskeditStages(gettext, api, WizardHandler, tasks, $rootScope, desks, notify, macros) {
    return {
        link: function(scope, elem, attrs) {
            var orig = null;

            scope.limits = limits;
            scope.saving = false;
            scope.statuses = tasks.statuses;

            if (scope.desk.edit && scope.desk.edit._id) {
                macros.getByDesk(scope.desk.edit.name, true).then(function(macros) {
                    scope.macros = _.reject(macros, {action_type: 'interactive'});
                });
            }

            scope.$watch('step.current', function(step, previous) {
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
                    desks.fetchDeskStages(scope.desk.edit._id, true).then(function(stages) {
                        scope.stages = stages;
                        scope.message = null;
                    }).finally(function() { /* no-op */ });
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
                    var lastStage = _.last(scope.stages);
                    if (lastStage) {
                        scope.editStage.task_status = lastStage.task_status;
                    }
                }
            };

            scope.isActive = function(stage) {
                return scope.editStage && scope.editStage._id === stage._id;
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
                if (!orig._id) {
                    angular.extend(scope.editStage, {desk: scope.desk.edit._id});
                    api('stages').save({}, scope.editStage)
                        .then(function(item) {
                            scope.stages.push(item);
                            scope.editStage = null;
                            scope.select(item);
                            scope.message = null;
                            broadcastChange();
                            scope.getstages();
                            desks.fetchDeskById(item.desk).then(function(desk) {
                                scope.desk.edit = desk;
                            });
                        }, errorMessage).finally(function() {
                            scope.saving = false;
                            scope.message = null;
                        });
                } else {
                    api('stages').save(orig, scope.editStage)
                        .then(function(item) {
                            scope.editStage = null;
                            scope.message = null;
                            scope.select(item);
                            broadcastChange();
                            scope.getstages();
                            desks.fetchDeskById(item.desk).then(function(desk) {
                                scope.desk.edit = desk;
                            });
                        }, errorMessage).finally(function() {
                            scope.saving = false;
                            scope.message = null;
                        });
                }
            };

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
                    .then(function() {
                        if (stage === scope.selected) {
                            scope.selected = null;
                        }
                        _.remove(scope.stages, stage);
                        scope.message = null;
                        broadcastChange(stage._id);
                        desks.fetchDeskById(stage.desk).then(function(desk) {
                            scope.desk.edit = desk;
                        });
                    }, function(response) {
                        if (angular.isDefined(response.data._message)) {
                            scope.message = gettext('Error: ' + response.data._message);
                        } else {
                            scope.message = gettext('There was a problem, stage was not deleted.');
                        }
                    });
            };

            function broadcastChange(stageId, action) {
                $rootScope.$broadcast('desks:refresh:stages', scope.desk.edit._id);
            }
        }
    };
}
