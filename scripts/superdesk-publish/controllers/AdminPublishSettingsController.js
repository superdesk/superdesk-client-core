AdminPublishSettingsController.$inject = ['$scope', 'privileges'];
export function AdminPublishSettingsController($scope, privileges) {
    var user_privileges = privileges.privileges;

    $scope.showSubscribers  = Boolean(user_privileges.subscribers);
    $scope.showFilterConditions  = Boolean(user_privileges.publish_filters);
}
