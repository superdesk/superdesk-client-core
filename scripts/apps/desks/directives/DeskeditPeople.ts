import _ from 'lodash';
import {gettext} from 'core/utils';
import {calculateDiff} from '../controllers/DeskConfigController';

DeskeditPeople.$inject = ['WizardHandler', 'desks', 'notify'];
export function DeskeditPeople(WizardHandler, desks, notify) {
    return {
        link: function(scope) {
            scope.$watch('step.current', (step, previous) => {
                if (step === 'people') {
                    scope.search = null;
                    scope.deskMembers = [];
                    scope.message = gettext('loading...');

                    if (scope.desk.edit && scope.desk.edit._id) {
                        desks.fetchUsers().then(() => {
                            scope.deskMembers = _.cloneDeep(desks.deskMembers[scope.desk.edit._id] || []);
                            scope.message = null;
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
                    _.merge(scope.desk.edit, res);
                    _.merge(scope.desk.orig, res);
                    if (!done) {
                        WizardHandler.wizard('desks').next();
                    } else {
                        WizardHandler.wizard('desks').finish();
                    }
                }, (response) => {
                    if (angular.isDefined(response.data._message)) {
                        scope.message = gettext('Error: ' + response.data._message);
                    } else {
                        notify.error(gettext('There was a problem, members not saved. Refresh Desks.'));
                    }
                })
                    .finally(() => {
                        scope.saving = false;
                        scope.message = null;
                    });
            };

            scope.$watch('desk.edit', (newVal) => {
                const diff = calculateDiff(scope.desk.edit, scope.desk.orig);

                if (scope.step.current === 'people' && Object.keys(diff).length > 0) {
                    scope.saveEnabled = true;
                } else {
                    scope.saveEnabled = false;
                }
            }, true);
        },
    };
}
