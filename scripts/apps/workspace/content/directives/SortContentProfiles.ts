export function SortContentProfiles() {
    return {
        link: function(scope, element) {
            var updated = false;

            element.sortable({
                items: '.schema-item:not(.schema-item__disabled)',
                cursor: 'move',
                containment: element,
                tolerance: 'pointer',
                placeholder: {
                    element: function(current) {
                        var height = current.height() - 20;

                        return $('<li class="placeholder" style="height:' + height + 'px"></li>')[0];
                    },
                    update: function() { /* no-op */ },
                },
                start: function(event, ui) {
                    ui.item.data('start_index',
                        ui.item
                            .parent()
                            .find('li.schema-item')
                            .index(ui.item),
                    );
                },
                stop: function(event, ui) {
                    if (updated) {
                        updated = false;

                        var start = ui.item.data('start_index'),
                            end = ui.item.parent().find('li.schema-item')
                                .index(ui.item);

                        scope.reorder(start, end, ui.item);
                        scope.$apply();
                    }
                },
                update: function(event, ui) {
                    updated = true;
                },
            });
        },
    };
}
