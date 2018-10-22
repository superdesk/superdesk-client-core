export default angular.module('superdesk.core.directives.sortable', [])
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
     * @description Creates a container in which contained items can be sortable by drag/drop.
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
                    },
                });
                element.disableSelection();
            },
        };
    }]);
