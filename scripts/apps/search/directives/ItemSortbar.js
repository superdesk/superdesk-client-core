ItemSortbar.$inject = ['search', 'asset', '$location'];

/**
 * Item sort component
 */
export function ItemSortbar(search, asset, $location) {
    var repos = {
        aapmm: true,
        paimg: true,
        // temporaty fix to have several scanpix instances (SDNTB-217)
        // FIXME: need to be refactored (SD-4448)
        'scanpix(ntbtema)': true,
        'scanpix(ntbkultur)': true,
        'scanpix(desk)': true,
        'scanpix(npk)': true
    };

    return {
        scope: {
            total: '='
        },
        templateUrl: asset.templateUrl('apps/search/views/item-sortbar.html'),
        link: function(scope) {
            scope.sortOptions = search.sortOptions;

            function getActive() {
                scope.active = search.getSort();
            }

            scope.canSort = function() {
                var criteria = search.query($location.search()).getCriteria(true);
                return !(angular.isDefined(criteria.repo) && repos[criteria.repo]);
            };

            scope.sort = function sort(field) {
                search.setSort(field);
            };

            scope.toggleDir = function toggleDir($event) {
                search.toggleSortDir();
            };

            scope.$on('$routeUpdate', getActive);
            getActive();
        }
    };
}
