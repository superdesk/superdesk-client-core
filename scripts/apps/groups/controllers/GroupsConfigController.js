GroupsConfigController.$inject = ['$scope', 'gettext', 'notify', 'api', 'groups', 'WizardHandler', 'modal'];
export function GroupsConfigController($scope, gettext, notify, api, groups, WizardHandler, modal) {
    $scope.modalActive = false;
    $scope.step = {
        current: null
    };
    $scope.group = {
        edit: null
    };

    $scope.openGroup = function(step, group) {
        $scope.modalActive = true;
        $scope.step.current = step;
        $scope.group.edit = group;
    };

    $scope.cancel = function() {
        $scope.modalActive = false;
        $scope.step.current = null;
        $scope.group.edit = null;
    };

    $scope.remove = function(group) {
        modal.confirm(gettext('Are you sure you want to delete group?')).then(
            function removeGroup() {
                api.groups.remove(group).then(() => {
                    _.remove($scope.groups._items, group);
                    notify.success(gettext('Group deleted.'), 3000);
                });
            }
        );
    };
}
