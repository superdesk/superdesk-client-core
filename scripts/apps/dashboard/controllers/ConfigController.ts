import {cloneDeep} from 'lodash';

ConfigController.$inject = ['$scope'];

export function ConfigController($scope) {
    $scope.configuration = cloneDeep($scope.widget.configuration);

    $scope.saveConfig = function() {
        $scope.widget.configuration = $scope.configuration;
        $scope.save();
        $scope.$close();
    };
}
