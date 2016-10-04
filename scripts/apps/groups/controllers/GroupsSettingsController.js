GroupsSettingsController.$inject = ['$scope', 'groups'];
export function GroupsSettingsController($scope, groups) {
    groups.initialize().then(function() {
        $scope.groups = groups.groups;
    });
}
