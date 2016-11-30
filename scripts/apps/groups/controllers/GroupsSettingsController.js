GroupsSettingsController.$inject = ['$scope', 'groups'];
export function GroupsSettingsController($scope, groups) {
    groups.initialize().then(() => {
        $scope.groups = groups.groups;
    });
}
