export function SearchContainer() {
    return {
        controller: ['$scope', '$location', 'gettext', 'pageTitle',
        function SearchContainerController($scope, $location, gettext, pageTitle) {
            this.flags = $scope.flags || {};
            var query = _.omit($location.search(), '_id');
            this.flags.facets = !_.isEmpty(query);
            pageTitle.setPageUrl(gettext('Search'));
        }]
    };
}
