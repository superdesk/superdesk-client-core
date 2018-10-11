export function SortPackageItems() {
    return {
        link: function(scope, element) {
            var updated = false;

            element.sortable({
                items: '.package-edit-items li',
                cursor: 'move',
                containment: '.package-edit-container',
                tolerance: 'pointer',
                placeholder: {
                    element: function(current) {
                        var height = current.height() - 40;

                        return $('<li class="placeholder" style="height:' + height + 'px"></li>')[0];
                    },
                    update: function() { /* no-op */ },
                },
                start: function(event, ui) {
                    ui.item
                        .data(
                            'start_index',
                            ui.item
                                .parent()
                                .find('li.sort-item')
                                .index(ui.item),
                        );

                    ui.item
                        .data(
                            'start_group',
                            ui.item
                                .parent()
                                .data('group'),
                        );
                },
                stop: function(event, ui) {
                    if (updated) {
                        updated = false;
                        var start = {
                            index: ui.item
                                .data('start_index'),

                            group: ui.item
                                .data('start_group'),
                        };
                        var end = {
                            index: ui.item
                                .parent()
                                .find('li.sort-item')
                                .index(ui.item),

                            group: ui.item
                                .parent()
                                .data('group'),
                        };

                        ui.item.remove();
                        scope.reorder(start, end);
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
