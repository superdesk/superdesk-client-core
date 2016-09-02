LegalItemSortbar.$inject = ['legal', 'asset'];
export function LegalItemSortbar(legal, asset) {
    return {
        scope: {},
        templateUrl: asset.templateUrl('superdesk-search/views/item-sortbar.html'),
        link: function(scope) {
            scope.sortOptions = legal.sortOptions;

            function getActive() {
                scope.active = legal.getSort();
            }

            scope.sort = function sort(field) {
                legal.setSort(field);
            };

            scope.toggleDir = function toggleDir($event) {
                legal.toggleSortDir();
            };

            scope.$on('$routeUpdate', getActive);
            getActive();
        }
    };
}
