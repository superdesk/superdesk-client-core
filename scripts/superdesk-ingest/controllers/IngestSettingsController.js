IngestSettingsController.$inject = ['$scope', 'privileges'];
export function IngestSettingsController($scope, privileges) {
    var user_privileges = privileges.privileges;

    $scope.showIngest   = Boolean(user_privileges.ingest_providers);
    $scope.showRuleset  = Boolean(user_privileges.rule_sets);
    $scope.showRouting  = Boolean(user_privileges.routing_rules);
}
