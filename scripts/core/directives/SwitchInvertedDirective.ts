var render = function(element, value) {
    element.toggleClass('checked', !!value);
    element.attr('checked', !!value);
};

export default angular.module('superdesk.core.directives.switchInverted', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdSwitchInverted
     *
     * @param {Boolean} ngModel Model for checkbox value.
     *
     * @description sdSwitchInverted is sdCheck directive with inverted functionality.
     * e.g: useful in case when we want to display switch ON (means provider is open)
     *  for model like `provider.is_closed = false` and vice versa.
     *
     * Example:
     * ```html
     * <input sd-switch-inverted ng-model="provider.is_closed">
     * ```
     */
    .directive('sdSwitchInverted', () => ({
        require: 'ngModel',
        replace: true,
        template: [
            '<span class="sd-toggle">',
            '<span class="inner"></span>',
            '</span>',
        ].join(''),
        link: function($scope, element, attrs, ngModel) {
            ngModel.$render = function() {
                render(element, ngModel.$viewValue);
            };

            $scope.$watch(attrs.ngModel, () => {
                render(element, !ngModel.$viewValue);
            });

            element.on('click', (e) => {
                $scope.$apply(() => {
                    ngModel.$setViewValue(!ngModel.$viewValue);
                });

                return false;
            });
        },
    }));
