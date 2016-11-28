ProviderMenu.$inject = ['$location'];

export function ProviderMenu($location) {
    return {
        scope: {items: '='},
        templateUrl: 'scripts/apps/archive/views/provider-menu.html',
        link: function(scope, element, attrs) {
            scope.setProvider = function(provider) {
                scope.selected = provider;
                $location.search('provider', scope.selected);
            };

            scope.$watchCollection(function() {
                return $location.search();
            }, function(search) {
                if (search.provider) {
                    scope.selected = search.provider;
                }
            });
        }
    };
}
