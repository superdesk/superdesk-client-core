RatioCalc.$inject = ['$window'];

export function RatioCalc($window) {
    return {
        link: function(scope, elem) {
            var win = angular.element($window);

            calcRatio();

            function calcRatio() {
                scope.ratio = elem.outerWidth() / elem.outerHeight();
            }

            function ratioOnResize() {
                calcRatio();
                scope.$apply();
            }

            win.bind('resize', ratioOnResize);

            scope.$on('$destroy', () => {
                win.unbind('resize', ratioOnResize);
            });
        },
    };
}
