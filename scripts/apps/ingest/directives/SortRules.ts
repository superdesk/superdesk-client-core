export function SortRules() {
    return {
        link: function(scope, element) {
            element.sortable({
                items: 'li',
                connectWith: '.rule-list',
                cursor: 'move',
                start: function(event, ui) {
                    ui.item.data('start', ui.item.index());
                },
                stop: function(event, ui) {
                    var start = ui.item.data('start'), end = ui.item.index();

                    scope.reorder(start, end);
                    scope.$apply();
                },
            });
        },
    };
}
