var render = function(element, value) {
    element.toggleClass('checked', !!value);
    element.attr('checked', !!value);
};

export default angular.module('superdesk.core.directives.check', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdCheck
     * @param {Boolean} ngModel model for checkbox value
     * @description Creates a custom-styled checkbox.
     */
    .directive('sdCheck', () => ({
        require: 'ngModel',
        replace: true,
        transclude: true,
        template: '<span class="sd-checkbox" ng-transclude></span>',
        link: function($scope, element, attrs, ngModel) {
            ngModel.$render = function() {
                render(element, ngModel.$viewValue);
            };

            $scope.$watch(attrs.ngModel, () => {
                render(element, ngModel.$viewValue);
            });

            element.on('click', (e) => {
                $scope.$apply(() => {
                    ngModel.$setViewValue(!ngModel.$viewValue);
                });

                return false;
            });
        }
    }));
