/**
 * @module superdesk.apps.search
 * @ngdoc directive
 * @name sdRawSearch
 * @requires asset
 * @requires $location
 * @description
 *   This directive handles the Raw search tab in the search panel. This is a textarea
 *   that allows the user enter a query string that will get passed to the search endpoint.
 */
RawSearch.$inject = ['asset', '$location'];
export function RawSearch(asset, $location) {
    return {
        templateUrl: asset.templateUrl('apps/search/views/raw-search.html'),
        link: function(scope) {
            var params = $location.search();

            scope.rawquery = params.raw;

            const ENTER = 13;

            scope.keyPressed = function(event) {
                if (event.keyCode === ENTER) {
                    rawQuery();
                    event.preventDefault();
                }
            };

            scope.$on('search:parameters', rawQuery);

            function rawQuery() {
                $location.search('raw', scope.rawquery || null);
            }
        },
    };
}
