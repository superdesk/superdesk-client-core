export default angular.module('superdesk.core.directives.dragdrop', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdSortable
     *
     * @param {Function} update Function to call when sort is updated.
     * This function should accept an array of item indexes.
     * @param {String} placeholder CSS class name for placeholder box
     * displayed during sorting.
     *
     * @desctription Creates a container in which contained items can be sortable by drag/drop.
     */
    .directive('sdSortable', [function() {
        return {
            scope: {update: '=', placeholder: '='},
            link: function(scope, element, attrs) {
                element.sortable({
                    tolerance: 'intersect',
                    placeholder: scope.placeholder,
                    start: function(event, ui) {
                        $(event.target).data('ui-sortable').floating = true;
                    },
                    update: function(event, ui) {
                        scope.update();
                    }
                });
                element.disableSelection();
            }
        };
    }])

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
                    }
                });
                scope.$watch('cursor', function(val) {
                    if (val) {
                        element.draggable('option', 'cursorAt', {
                            left: 5,
                            top: 5
                        });
                    } else {
                        element.draggable('option', 'cursorAt', false);
                    }
                });
            }
        };
    }])

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
                    }
                });
            }
        };
    }]);
