var render = function(element, value) {
    element.toggleClass('checked', !!value);
    element.attr('checked', !!value);
};

export default angular.module('superdesk.core.directives.checkAll', [])
    /**
     * sdCheckAll creates a custom-styled checkbox managing other checkboxes in the same group.
     *
     * Usage:
     * <input sd-check-all ng-model="users" data-check-attribute="_checked">
     *
     * Params:
     * @scope {array} ngModel - array of objects managed by checkboxes
     * @scope {string} checkAttribute - name of attribute to set in model elements
     *
     */
    .directive('sdCheckAll', function() {
        var checkAttribute = '_checked';

        return {
            require: 'ngModel',
            replace: true,
            template: '<span class="sd-checkbox"></span>',
            link: function($scope, element, attrs, ngModel) {
                var checked = false;
                if (typeof attrs.checkAttribute !== 'undefined') {
                    checkAttribute = attrs.checkAttribute;
                }

                $scope.$watch(attrs.ngModel, function(model) {
                    if (model) {
                        checked = _.every(ngModel.$viewValue, checkAttribute) && ngModel.$viewValue.length > 0;
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
    });
