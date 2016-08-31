DraggableItem.$inject = ['dragitem'];

export function DraggableItem(dragitem) {
    return {
        link: function(scope, elem) {
            if (scope.item) {
                elem.attr('draggable', true);

                // set item data on event
                elem.on('dragstart', function(event) {
                    dragitem.start(event, scope.item);
                });

                scope.$on('$destroy', function() {
                    elem.off('dragstart');
                });
            }
        }
    };
}
