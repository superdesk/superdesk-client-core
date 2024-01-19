import {dragStart} from 'utils/dragging';

export function DraggableItem() {
    return {
        link: function(scope, elem) {
            if (scope.item) {
                elem.attr('draggable', true);

                // set item data on event
                elem.on('dragstart', (event) => {
                    dragStart(event, scope.item);
                });

                scope.$on('$destroy', () => {
                    elem.off('dragstart');
                });
            }
        },
    };
}
