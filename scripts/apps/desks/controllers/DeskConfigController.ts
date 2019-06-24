import _ from 'lodash';
import {gettext} from 'core/utils';

DeskConfigController.$inject = ['$scope', '$controller', 'notify', 'desks', 'modal', '$rootScope'];
export function DeskConfigController($scope, $controller, notify, desks, modal, $rootScope) {
    // expecting $scope.desks to be defined

    const stepsToWatch = ['general', 'people'];

    $scope.modalActive = false;
    $scope.numberOfUsers = 3;
    $scope.step = {
        current: null,
    };
    $scope.desk = {
        edit: null,
        orig: null,
    };

    $scope.openDesk = function(step, desk) {
        desks.fetchDesks().then((_desks) => {
            const updatedDesk = _desks._items.find((_desk) => desk != null && _desk._id === desk._id) || {};

            $scope.modalActive = true;
            $scope.step.current = step;
            $scope.desk.edit = _.cloneDeep(updatedDesk) || {};
            $scope.desk.orig = _.cloneDeep(updatedDesk) || {};
        });
    };

    $scope.agg = $controller('AggregateCtrl', {$scope: $scope});
    $scope.openMonitoringSettings = function(desk) {
        $scope.agg.settings.desk = desk;
        $scope.agg.edit();
    };

    $scope.cancel = function() {
        const diff = calculateDiff();
        const newDesk = !$scope.desk.edit._id;

        if (!newDesk && stepsToWatch.includes($scope.step.current) && Object.keys(diff).length > 0) {
            $scope.confirmSave(diff, $scope.step.current, true);
        } else {
            closeModel();
        }
    };

    $scope.remove = function(desk) {
        modal.confirm(gettext('Please confirm you want to delete desk.')).then(
            function runConfirmed() {
                desks.remove(desk).then(
                    (response) => {
                        _.remove($scope.desks._items,
                            (deskToBeRemoved: any) => deskToBeRemoved.name.toLowerCase() === desk.name.toLowerCase());
                        notify.success(gettext('Desk deleted.'), 3000);
                    },
                    (response) => {
                        if (angular.isDefined(response.data._message)) {
                            notify.error(gettext('Error: ' + response.data._message));
                        } else {
                            notify.error(gettext('Unknown Error: There was a problem, desk was not deleted.'));
                        }
                    },
                );
            },
        );
    };

    $scope.getDeskStages = function(desk) {
        return desks.deskStages[desk._id];
    };

    $scope.getDeskUsers = function(desk) {
        return desks.deskMembers[desk._id];
    };

    const closeModel = function() {
        $scope.modalActive = false;
        $scope.step.current = null;
        $scope.desk.edit = null;
    };

    const calculateDiff = function() {
        let diff = _.extend({}, $scope.desk.edit);

        if (angular.isDefined($scope.desk.orig)) {
            angular.forEach(_.keys(diff), (key) => {
                if (_.isEqual(diff[key], $scope.desk.orig[key])
                    || (key === 'content_expiry' && $scope.desk.orig[key] === null && diff[key] === 0)) {
                    delete diff[key];
                }
            });
        }
        return diff;
    };

    $scope.confirmSave = function(diff, step, close?) {
        modal.confirm(
            gettext('You have unsaved changes in {{tab}} tab. Do you want to save them now?', {tab: step}),
            gettext('Save changes?'),
            gettext('Save'),
            gettext('Ignore'))
            .then(() => {
                desks.save($scope.desk.orig, diff).then((res) => {
                    _.merge($scope.desk.edit, res);
                    _.merge($scope.desk.orig, res);
                    if (diff.members) {
                        const deskMembers = [];

                        angular.forEach(_.values(res.members), (value) => {
                            deskMembers.push(desks.users._items.find((user) => user._id === value.user));
                        });
                        desks.deskMembers[$scope.desk.orig._id] = deskMembers;
                    }
                }, (response) => {
                    if (angular.isDefined(response.data._message)) {
                        $scope.message = gettext('Error: ' + response.data._message);
                    } else {
                        $scope._errorMessage = gettext('There was a problem, members not saved. Refresh Desks.');
                    }
                });
            }, () => {
                $scope.desk.edit = _.cloneDeep($scope.desk.orig);
            })
            .finally(() => {
                if (close) {
                    closeModel();
                }
            });
    };

    $scope.$watch('step.current', (currentStep, previousStep) => {
        if (currentStep && previousStep && stepsToWatch.includes(previousStep)) {
            const diff = calculateDiff();
            const newDesk = !$scope.desk.edit._id;

            if (!newDesk && Object.keys(diff).length > 0) {
                $scope.confirmSave(diff, previousStep);
            }
        }
    });
}
