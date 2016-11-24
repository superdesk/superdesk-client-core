AdminPublishSettingsController.$inject = ['$scope', 'privileges'];
export function AdminPublishSettingsController($scope, privileges) {
    var userPrivileges = privileges.privileges;

    $scope.showSubscribers = Boolean(userPrivileges.subscribers);
    $scope.showFilterConditions = Boolean(userPrivileges.publish_filters);
}
