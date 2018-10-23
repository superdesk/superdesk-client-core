export function GridLayout() {
    return {
        templateUrl: 'scripts/apps/items-common/views/grid-layout.html',
        scope: {items: '='},
        link: function(scope, elem, attrs) {
            scope.view = 'mgrid';

            scope.preview = function(item) {
                scope.previewItem = item;
            };
        },
    };
}
