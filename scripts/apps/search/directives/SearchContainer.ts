import {isEmpty, omit} from 'lodash';
import {gettext} from 'core/utils';

export function SearchContainer() {
    return {
        controller: ['$scope', '$location', 'pageTitle',
            function SearchContainerController($scope, $location, pageTitle) {
                const query = omit($location.search(), '_id', 'repo');

                this.flags = $scope.flags || {};
                this.flags.facets = !isEmpty(query);
                pageTitle.setUrl(gettext('Search'));

                $scope.$watch('search.activeProvider', (activeProvider) => {
                    if (activeProvider) {
                        if (activeProvider.advanced_search !== undefined) {
                            this.flags.facets = !!activeProvider.advanced_search;
                        }
                        if (activeProvider.config?.default_list_view) {
                            switch (activeProvider.config.default_list_view) {
                            case 'list':
                                $scope.view = 'compact';
                                break;
                            case 'photogrid':
                                $scope.view = 'photogrid';
                                break;
                            }
                        }
                    }
                });
            }],
    };
}
