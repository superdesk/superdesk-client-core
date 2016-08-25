export function SearchContainer() {
    return {
        controller: ['$scope', '$location', function SearchContainerController($scope, $location) {
            this.flags = $scope.flags || {};
            var query = _.omit($location.search(), '_id');
            this.flags.facets = !_.isEmpty(query);
        }]
    };
}
