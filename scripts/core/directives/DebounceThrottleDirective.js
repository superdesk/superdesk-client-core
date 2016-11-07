var wrapper = function(methodName) {
    var interval = 1000;
    var func = _[methodName];

    return {
        require: 'ngModel',
        link: function($scope, element, attrs, ngModel) {
            if (attrs.interval !== '' && attrs.interval !== undefined) {
                interval = attrs.interval;
            }
            element.off('input').off('keydown').off('change');
            element.on('input', func(function() {
                $scope.$apply(function() {
                    ngModel.$setViewValue(element.val());
                });
            }, interval));
        }
    };
};

export default angular.module('superdesk.core.directives.throttle', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdDebounce
     *
     * @param {Number} interval
     * @param {Object} ngModel
     *
     * @description Debounces model update.
     */
    .directive('sdDebounce', function() {
        return wrapper('debounce');
    })

    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdThrottle
     *
     * @param {Number} interval
     * @param {Object} ngModel
     *
     * @description Throttles model update.
     */
    .directive('sdThrottle', function() {
        return wrapper('throttle');
    });
