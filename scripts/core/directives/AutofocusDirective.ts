export default angular.module('superdesk.core.directives.autofocus', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdAutoFocus
     * @description sdAutoFocus automatically focuses on an element on page render.
     */
    .directive('sdAutoFocus', () => ({
        link: function($scope, element, attrs) {
            element.focus();
        },
    }));
