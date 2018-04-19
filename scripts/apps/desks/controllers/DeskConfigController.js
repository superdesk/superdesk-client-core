DeskConfigController.$inject = ['$scope', '$controller', 'gettext', 'notify', 'desks', 'WizardHandler', 'modal'];
export function DeskConfigController($scope, $controller, gettext, notify, desks, WizardHandler, modal) {
    // expecting $scope.desks to be defined

    $scope.modalActive = false;
    $scope.numberOfUsers = 3;
    $scope.step = {
        current: null,
    };
    $scope.desk = {
        edit: null,
    };

    $scope.openDesk = function(step, desk) {
        $scope.modalActive = true;
        $scope.step.current = step;
        $scope.desk.edit = desk || {};
        $scope.desk.edit.desk_metadata = $scope.desk.edit.desk_metadata || {};
    };

    $scope.agg = $controller('AggregateCtrl', {$scope: $scope});
    $scope.openMonitoringSettings = function(desk) {
        $scope.agg.settings.desk = desk;
        $scope.agg.edit();
    };

    $scope.cancel = function() {
        $scope.modalActive = false;
        $scope.step.current = null;
        $scope.desk.edit = null;
    };

    $scope.remove = function(desk) {
        modal.confirm(gettext('Please confirm you want to delete desk.')).then(
            function runConfirmed() {
                desks.remove(desk).then(
                    (response) => {
                        _.remove($scope.desks._items,
                            (deskToBeRemoved) => deskToBeRemoved.name.toLowerCase() === desk.name.toLowerCase());
                        notify.success(gettext('Desk deleted.'), 3000);
                    },
                    (response) => {
                        if (angular.isDefined(response.data._message)) {
                            notify.error(gettext('Error: ' + response.data._message));
                        } else {
                            notify.error(gettext('Unknown Error: There was a problem, desk was not deleted.'));
                        }
                    }
                );
            }
        );
    };

    $scope.getDeskStages = function(desk) {
        return desks.deskStages[desk._id];
    };

    $scope.getDeskUsers = function(desk) {
        return desks.deskMembers[desk._id];
    };
}
