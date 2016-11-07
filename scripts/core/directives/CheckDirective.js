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
    .directive('sdCheck', function() {
        return {
            require: 'ngModel',
            replace: true,
            transclude: true,
            template: '<span class="sd-checkbox" ng-transclude></span>',
            link: function($scope, element, attrs, ngModel) {
                ngModel.$render = function() {
                    render(element, ngModel.$viewValue);
                };

                $scope.$watch(attrs.ngModel, function() {
                    render(element, ngModel.$viewValue);
                });

                element.on('click', function(e) {
                    $scope.$apply(function() {
                        ngModel.$setViewValue(!ngModel.$viewValue);
                    });

                    return false;
                });
            }
        };
    })
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdCheckAll
     *
     * @param {Array} ngModel Array of objects managed by checkboxes
     * @param {String} checkAttribute Name of attribute to set in model elements
     *
     * @description sdCheckAll creates a custom-styled checkbox managing other checkboxes in the same group.
     */
    .directive('sdCheckAll', function() {
        var checkAttribute = '_checked';

        return {
            require: 'ngModel',
            replace: true,
            template: '<span class="sd-checkbox"></span>',
            link: function($scope, element, attrs, ngModel) {
                var checked = false;
                if (attrs.checkAttribute !== undefined) {
                    checkAttribute = attrs.checkAttribute;
                }

                $scope.$watch(attrs.ngModel, function(model) {
                    if (model) {
                        checked = (_.every(ngModel.$viewValue, checkAttribute) && (ngModel.$viewValue.length > 0));
                        render(element, checked);
                    }
                }, true);

                element.on('click', function() {
                    checked = !checked;

                    var model = ngModel.$viewValue;
                    _.forEach(model, function(item) {
                        item[checkAttribute] = checked;
                    });
                    $scope.$apply(function() {
                        ngModel.$setViewValue(model);
                    });

                    render(element, checked);
                });
            }
        };
    })

    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdSwitchInverted
     *
     * @param {Boolean} ngModel Model for checkbox value.
     *
     * @description sdSwitchInverted is sdCheck directive with inverted functionality.
     * e.g: useful in case when we want to display switch ON (means provider is open) 
     * for model like `provider.is_closed = false` and vice versa.
     *
     * Example:
     * ```html
     * <input sd-switch-inverted ng-model="provider.is_closed">
     * ```
     */
    .directive('sdSwitchInverted', function() {
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

                $scope.$watch(attrs.ngModel, function() {
                    render(element, !ngModel.$viewValue);
                });

                element.on('click', function(e) {
                    $scope.$apply(function() {
                        ngModel.$setViewValue(!ngModel.$viewValue);
                    });

                    return false;
                });
            }
        };
    })

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
    .directive('sdSwitch', ['Keys', function (Keys) {
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
