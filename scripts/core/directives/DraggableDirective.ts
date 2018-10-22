export default angular.module('superdesk.core.directives.draggable', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdDraggable
     *
     * @param {Object} item Data to be carried.
     * @param {String} container css selector to attach dragged item to.
     * @param {Boolean} cursor - enable/disable stucking drag object to cursor
     *
     * @description Creates a draggable item. Works with sdDroppable.
     */
    .directive('sdDraggable', ['dragDropService', function(dragDropService) {
        return {
            scope: {item: '=', container: '=', cursor: '='},
            link: function(scope, element, attrs) {
                element.draggable({
                    helper: 'clone',
                    appendTo: scope.container,
                    start: function(event, ui) {
                        dragDropService.item = scope.item;
                    },
                });
                scope.$watch('cursor', (val) => {
                    if (val) {
                        element.draggable('option', 'cursorAt', {
                            left: 5,
                            top: 5,
                        });
                    } else {
                        element.draggable('option', 'cursorAt', false);
                    }
                });
            },
        };
    }]);
