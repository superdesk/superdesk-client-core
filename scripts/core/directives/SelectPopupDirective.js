export default angular.module('superdesk.core.directives.selectPopup', ['superdesk.core.services.asset'])
    .directive('sdSelectPopup', ['$document', 'asset', function($document, asset) {
        return {
            restrict: 'A',
            scope: false,
            replace: true,
            templateUrl: asset.templateUrl('core/views/sdselect.html'),
            link: function(scope, element, attrs) {

                scope.open = false;

                scope.toggleSelect = function() {
                    scope.open = !scope.open;
                    if (scope.open) {
                        scope.focus();
                    }
                };

                scope.focus = function focus() {
                    var searchBox = element.find('input')[0];
                    searchBox.focus();
                };
            }
        };
    }]);
