export default angular.module('superdesk.core.directives.throttle', [])
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
    .directive('sdThrottle', () => ({
        require: 'ngModel',
        link: function($scope, element, attrs, ngModel) {
            let interval = 1000;

            if (attrs.interval !== '' && attrs.interval !== undefined) {
                interval = attrs.interval;
            }
            element.off('input')
                .off('keydown')
                .off('change');

            element.on('input', _.throttle(() => {
                $scope.$apply(() => {
                    ngModel.$setViewValue(element.val());
                });
            }, interval));
        },
    }));
