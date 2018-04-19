export function SortGroups() {
    return {
        link: function(scope, element) {
            var updated = false;

            element.sortable({
                items: '.sort-item',
                cursor: 'move',
                containment: '.groups',
                tolerance: 'pointer',
                placeholder: {
                    element: function(current) {
                        var height = current.height() - 20;

                        return $('<li class="placeholder" style="height:' + height + 'px"></li>')[0];
                    },
                    update: function() { /* no-op */ },
                },
                start: function(event, ui) {
                    ui.item
                        .data('start_index',
                            ui.item
                                .parent()
                                .find('li.sort-item')
                                .index(ui.item)
                        );
                },
                stop: function(event, ui) {
                    if (updated) {
                        updated = false;
                        var start = {
                            index: ui.item.data('start_index'),
                        };
                        var end = {
                            index: ui.item
                                .parent()
                                .find('li.sort-item')
                                .index(ui.item),
                        };

                        scope.reorder(start, end, ui.item);
                        ui.item.remove();
                        scope.$apply();
                    }
                },
                update: function(event, ui) {
                    updated = true;
                },
                cancel: '.fake',
            });
        },
    };
}
