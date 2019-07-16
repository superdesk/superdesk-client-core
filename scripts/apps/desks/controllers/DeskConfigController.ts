import _ from 'lodash';
import {gettext} from 'core/utils';
import {generate} from 'json-merge-patch';
import {logger} from 'core/services/logger';

DeskConfigController.$inject = ['$scope', '$controller', 'notify', 'desks', 'modal', '$q'];
export function DeskConfigController($scope, $controller, notify, desks, modal, $q) {
    // expecting $scope.desks to be defined

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
        if (!desk) {
            initializeDesk({}, step);
            return;
        }
        desks.fetchDeskById(desk._id).then((_desk) => {
            if (!_desk) {
                logger.error(new Error('Something went wrong: desk not found'));
                return;
            }
            initializeDesk(_desk, step);
        });
    };

    const initializeDesk = function(desk, step) {
        $scope.modalActive = true;
        $scope.step.current = step;
        $scope.desk.edit = _.cloneDeep(desk);
        $scope.desk.orig = _.cloneDeep(desk);
    };

    $scope.agg = $controller('AggregateCtrl', {$scope: $scope});
    $scope.openMonitoringSettings = function(desk) {
        $scope.agg.settings.desk = desk;
        $scope.agg.edit();
    };

    $scope.cancel = function() {
        const diff = calculateDiff($scope.desk.edit, $scope.desk.orig);
        const newDesk = !$scope.desk.edit._id;

        if (!newDesk && Object.keys(diff).length > 0) {
            $scope.confirmSave().then(() => true, () => {
                closeModal();
            });
        } else {
            closeModal();
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

    const closeModal = function() {
        $scope.modalActive = false;
        $scope.step.current = null;
        $scope.desk.edit = null;
    };

    $scope.confirmSave = function() {
        return modal.confirm(
            gettext('You have unsaved changes. Do you want to save them now?'),
            gettext('Save changes?'),
            gettext('Yes'),
            gettext('No'));
    };

    $scope.canTabChange = function() {
        const diff = calculateDiff($scope.desk.edit, $scope.desk.orig);
        const newDesk = !$scope.desk.edit._id;

        if (!newDesk && Object.keys(diff).length > 0) {
            return $scope.confirmSave()
                .then(() => {
                    return false;
                }, () => {
                    $scope.desk.edit = _.cloneDeep($scope.desk.orig);
                    return true;
                });
        } else {
            return $q.when(true);
        }
    };
}

export function calculateDiff(editObj, origObj) {
    let diff = generate(origObj, editObj) || {};

    for (const key in diff) {
        if (diff[key] === null && editObj[key] !== null) {
            delete diff[key];
        }
    }

    if (diff['content_expiry'] === 0 && origObj.content_expiry == null) {
        delete diff['content_expiry'];
    }

    // remove RestApiResponse fields if any
    delete diff['_created'];
    delete diff['_updated'];
    delete diff['_id'];
    delete diff['_etag'];
    delete diff['_links'];
    delete diff['_type'];

    return diff;
}
