import {isEmpty, omit} from 'lodash';

export function SearchContainer() {
    return {
        controller: ['$scope', '$location', 'gettext', 'pageTitle',
            function SearchContainerController($scope, $location, gettext, pageTitle) {
                const query = omit($location.search(), '_id', 'repo');

                this.flags = $scope.flags || {};
                this.flags.facets = !isEmpty(query);
                pageTitle.setUrl(gettext('Search'));

                $scope.$watch('search.activeProvider', (activeProvider) => {
                    if (activeProvider && activeProvider.advanced_search !== undefined) {
                        this.flags.facets = !!activeProvider.advanced_search;
                    }
                });
            }]
    };
}
