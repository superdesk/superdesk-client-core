var render = function(element, value) {
    element.toggleClass('checked', !!value);
    element.attr('checked', !!value);
};

export default angular.module('superdesk.core.directives.switch', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdSwitch
     *
     * @requires Keys
     *
     * @param {Boolean} ngModel Model for checkbox value.
     *
     * @description sdSwitch is sdCheck directive with different styling.
     */
    .directive('sdSwitch', ['Keys', function(Keys) {
        return {
            require: 'ngModel',
            replace: true,
            template: [
                '<span class="sd-toggle">',
                '<span class="inner"></span>',
                '</span>'
            ].join(''),
            link: function($scope, element, attrs, ngModel) {
                ngModel.$render = function() {
                    render(element, ngModel.$viewValue);
                };

                element.bind('keydown', function(e) {
                    if (e.keyCode === Keys.enter || e.keyCode === Keys.space) {
                        e.preventDefault();
                        $scope.$apply(function() {
                            ngModel.$setViewValue(!ngModel.$viewValue);
                        });

                        return false;
                    }
                });

                $scope.$watch(attrs.ngModel, function() {
                    render(element, ngModel.$viewValue);
                });

                element.on('click', function(e) {
                    $scope.$apply(function() {
                        ngModel.$setViewValue(!ngModel.$viewValue);
                    });

                    return false;
                });

                $scope.$on('$destroy', function() {
                    element.unbind('keydown');
                    element.off('click');
                });
            }
        };
    }]);
