import _ from 'lodash';
import {gettext} from 'core/utils';
import {saveFile} from 'apps/authoring/attachments/actions';

DeskeditPeople.$inject = ['WizardHandler', 'desks'];
export function DeskeditPeople(WizardHandler, desks) {
    return {
        link: function(scope) {
            scope.$watch('step.current', (step, previous) => {
                if (step === 'people') {
                    scope.search = null;
                    scope.deskMembers = [];
                    scope.message = gettext('loading...');

                    if (scope.desk.edit && scope.desk.edit._id) {
                        desks.fetchUsers().then(() => {
                            scope.users = desks.users._items;
                            scope.deskMembers = _.cloneDeep(desks.deskMembers[scope.desk.edit._id] || []);
                            scope.message = null;
                            scope.$watch('deskMembers.length', (newValue, oldValue) => {
                                if (newValue !== oldValue) {
                                    scope.saveEnabled = true;
                                } else {
                                    scope.saveEnabled = false;
                                }
                            });
                        });
                    } else {
                        WizardHandler.wizard('desks').goTo(previous);
                    }
                }
            });

            scope.add = function(user) {
                if (!_.find(scope.deskMembers, {_id: user._id})) {
                    scope.deskMembers.unshift(user);
                    scope.desk.edit.members = _.map(scope.deskMembers, (obj) => ({user: obj._id}));
                }
            };

            scope.remove = function(user) {
                _.remove(scope.deskMembers, user);
                scope.desk.edit.members = _.map(scope.deskMembers, (obj) => ({user: obj._id}));
            };

            scope.getMembers = function(deskMembers) {
                return _.map(deskMembers, (obj) => ({user: obj._id}));
            };

            /**
             * Save members for editing desk
             *
             * @param {boolean} done
             *      when true it exits after saving otherwise
             *      continues to next step in wizard handler.
             */
            scope.save = function(done) {
                scope.message = gettext('Saving...');
                var members = _.map(scope.deskMembers, (obj) => ({user: obj._id}));

                scope.saving = true;
                desks.save(scope.desk.orig, {members: members}).then((res) => {
                    angular.extend(scope.desk.edit, res);
                    desks.deskMembers[scope.desk.edit._id] = scope.deskMembers;
                    angular.extend(scope.desk.orig, res);
                    if (!done) {
                        WizardHandler.wizard('desks').next();
                    } else {
                        WizardHandler.wizard('desks').finish();
                    }
                }, (response) => {
                    if (angular.isDefined(response.data._message)) {
                        scope.message = gettext('Error: ' + response.data._message);
                    } else {
                        scope._errorMessage = gettext('There was a problem, members not saved. Refresh Desks.');
                    }
                })
                    .finally(() => {
                        scope.saving = false;
                        scope.message = null;
                    });
            };
        },
    };
}
