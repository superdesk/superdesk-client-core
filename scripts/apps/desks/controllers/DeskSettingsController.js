DeskSettingsController.$inject = ['$scope', 'desks'];
export function DeskSettingsController($scope, desks) {
    desks.initialize()
    .then(function() {
        $scope.desks = desks.desks;
    });
}
