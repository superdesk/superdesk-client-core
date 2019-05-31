import {isEqual} from 'lodash';

DestinationDirective.$inject = ['adminPublishSettingsService', '$rootScope'];
export function DestinationDirective(adminPublishSettingsService, $rootScope) {
    return {
        templateUrl: 'scripts/apps/publish/views/destination.html',
        scope: {
            destination: '=',
            actions: '=',
        },
        link: function($scope) {
            $scope.types = adminPublishSettingsService.getTransmissionServices();

            $scope.$watch('destination.delivery_type', (type) => {
                if (type && !$scope.destination.config && $scope.types[type].config) {
                    $scope.destination.config = angular.extend({}, $scope.types[type].config);
                }
            });
            $scope.$watch('destination', (newVal, oldVal) => {
                if (newVal && oldVal) {
                    $rootScope.$broadcast('subcriber: saveEnabled');
                }
            }, true);
        },
    };
}
