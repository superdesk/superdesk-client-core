SearchWithin.$inject = ['$location', 'asset'];
export function SearchWithin($location, asset) {
    return {
        scope: {},
        templateUrl: asset.templateUrl('superdesk-search/views/search-within.html'),
        link: function(scope, elem) {
            scope.searchWithin = function() {
                if (scope.within) {
                    var params = $location.search();
                    if (params.q) {
                        scope.query = params.q + ' (' + scope.within + ') ';
                    } else {
                        scope.query = '(' + scope.within + ')';
                    }
                    $location.search('q', scope.query || null);
                    scope.within = null;
                }
            };
        }
    };
}
