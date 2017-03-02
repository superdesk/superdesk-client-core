DraggableItem.$inject = ['dragitem'];

export function DraggableItem(dragitem) {
    return {
        link: function(scope, elem) {
            if (scope.item && scope.item.type && scope.item.type === 'picture') {
                elem.attr('draggable', true);

                // set item data on event
                elem.on('dragstart', (event) => {
                    dragitem.start(event, scope.item);
                });

                scope.$on('$destroy', () => {
                    elem.off('dragstart');
                });
            }
        }
    };
}
