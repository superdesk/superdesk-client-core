export default angular.module('superdesk.core.directives.droppable', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdDroppable
     *
     * @param {Function} update Function to be called when an item is dropped.
     *
     * @description Marks a drop area for sdDraggable items.
     */
    .directive('sdDroppable', ['dragDropService', function(dragDropService) {
        return {
            scope: {update: '='},
            link: function(scope, element, attrs) {
                element.droppable({
                    accept: ':not(.ui-sortable-helper)',
                    drop: function(event, ui) {
                        scope.update(dragDropService.item);
                        dragDropService.item = null;
                    },
                });
            },
        };
    }]);
