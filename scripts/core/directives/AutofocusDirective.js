export default angular.module('superdesk.core.directives.autofocus', [])
    /**
     * sdAutoFocus automatically focuses on an element on page render.
     *
     * Usage:
     * <input sd-auto-focus>
     */
    .directive('sdAutoFocus', function() {
        return {
            link: function($scope, element, attrs) {
                element.focus();
            }
        };
    });
