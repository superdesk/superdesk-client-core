/**
 * @description Transforms and parses the displayed ng-model of the host
 * from an array to a comma-separated list.
 */
StringToArrayDirective.$inject = [];
export function StringToArrayDirective() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ngModel) {
            ngModel.$parsers.push(function(v) {
                return typeof v === 'string' ? v.split(',').map(function(x) {
                    return x.trim();
                }) : [];
            });
            ngModel.$formatters.push(function(v) {
                return Array.isArray(v) ? v.join(', ') : '';
            });
        }
    };
}
