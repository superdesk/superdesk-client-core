RawSearch.$inject = ['asset', '$location'];
export function RawSearch(asset, $location) {
    return {
        templateUrl: asset.templateUrl('apps/search/views/raw-search.html'),
        link: function(scope) {
            var params = $location.search();
            scope.rawquery = params.raw;

            var ENTER = 13;

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
        }
    };
}
