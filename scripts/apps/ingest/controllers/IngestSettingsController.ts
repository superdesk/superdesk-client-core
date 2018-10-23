IngestSettingsController.$inject = ['$scope', 'privileges'];
export function IngestSettingsController($scope, privileges) {
    var userPrivileges = privileges.privileges;

    $scope.showIngest = Boolean(userPrivileges.ingest_providers);
    $scope.showRuleset = Boolean(userPrivileges.rule_sets);
    $scope.showRouting = Boolean(userPrivileges.routing_rules);
}
