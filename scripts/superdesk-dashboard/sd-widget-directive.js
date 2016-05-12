(function() {
    'use strict';

    ConfigController.$inject = ['$scope'];
    function ConfigController($scope) {
        $scope.configuration = _.clone($scope.widget.configuration);

        $scope.saveConfig = function() {
            $scope.widget.configuration = $scope.configuration;
            $scope.save();
            $scope.$close();
        };
    }

    /**
     * sdWidget give appropriate template to data assgined to it
     *
     * Usage:
     * <div sd-widget data-widget="widget"></div>
     *
     * Params:
     * @scope {Object} widget
     */
    angular.module('superdesk.dashboard').directive('sdWidget', [
        '$modal', 'asset', function($modal, asset) {
        return {
            templateUrl: asset.templateUrl('superdesk-dashboard/views/widget.html'),
            restrict: 'A',
            replace: true,
            transclude: true,
            scope: {widget: '=', save: '&', configurable: '='},
            link: function(scope, element, attrs) {
                scope.openConfiguration = function () {
                    $modal.open({
                        templateUrl: 'scripts/superdesk-dashboard/views/configuration.html',
                        controller: ConfigController,
                        scope: scope
                    });
                };
            }
        };
    }]);
})();
