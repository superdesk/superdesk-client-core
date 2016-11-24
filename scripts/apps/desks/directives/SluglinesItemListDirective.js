SluglinesItemListDirective.$inject = ['api'];
export function SluglinesItemListDirective(api) {
    return {
        templateUrl: 'scripts/apps/desks/views/slugline-items.html',
        scope: {
            desk: '='
        },
        link: function(scope, elem) {
            scope.items = [];
            scope.loading = true;
            api.get('desks/' + scope.desk + '/sluglines').then(function(items) {
                scope.items = items._items;
            })
            .finally(function() {
                scope.loading = false;
            });
        }
    };
}
