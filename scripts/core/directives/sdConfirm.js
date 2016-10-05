export default angular.module('superdesk.core.directives.confirm', [])
    .directive('sdConfirm', ['$window', function($window) {
        return {
            scope: {
                msg: '@sdConfirm',
                confirmAction: '&'
            },
            link: function(scope, element, attrs) {
                element.click(function(e) {
                    if ($window.confirm(scope.msg)) {
                        scope.confirmAction();
                    }
                });
            }
        };
    }]);
