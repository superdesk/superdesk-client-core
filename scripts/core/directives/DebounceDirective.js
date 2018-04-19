export default angular.module('superdesk.core.directives.debounce', [])
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
    .directive('sdDebounce', () => ({
        require: 'ngModel',
        link: function($scope, element, attrs, ngModel) {
            let interval = 1000;

            if (attrs.interval !== '' && attrs.interval !== undefined) {
                interval = attrs.interval;
            }
            element.off('input')
                .off('keydown')
                .off('change');

            element.on('input', _.debounce(() => {
                $scope.$apply(() => {
                    ngModel.$setViewValue(element.val());
                });
            }, interval));
        },
    }));
