DestinationDirective.$inject = ['transmissionTypes'];
export function DestinationDirective(transmissionTypes) {
    return {
        templateUrl: 'scripts/apps/publish/views/destination.html',
        scope: {
            destination: '=',
            actions: '='
        },
        link: function ($scope) {
            $scope.types = transmissionTypes;

            $scope.$watch('destination.delivery_type', function(type) {
                if (type && !$scope.destination.config && $scope.types[type].config) {
                    $scope.destination.config = angular.extend({}, $scope.types[type].config);
                }
            });
        }
    };
}
