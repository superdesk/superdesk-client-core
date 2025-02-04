DateParam.$inject = ['$location'];

export function DateParam($location) {
    return {
        scope: true,
        link: function(scope, elem, attrs) {
            var search = $location.search();

            if (search[attrs.location]) {
                scope.date = search[attrs.location];
            }

            scope.$watch('date', (date) => {
                $location.search(attrs.location, date);
            });

            scope.$on('$routeUpdate', (event, route) => {
                scope.date = route.params[attrs.location] || null;
            });
        },
    };
}
