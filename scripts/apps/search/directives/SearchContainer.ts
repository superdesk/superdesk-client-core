import {isEmpty, omit} from 'lodash';
import {gettext} from 'core/utils';

export function SearchContainer() {
    const FILTERS_PANEL_PREFERENCES_KEY = 'search:filters_panel_open';
    var filtersPanelPreferences = {
        [FILTERS_PANEL_PREFERENCES_KEY]: {
            'type': 'bool',
            'default': true,
        },
    };

    return {
        controller: ['$scope', '$location', 'pageTitle', 'preferencesService',
            function SearchContainerController($scope, $location, pageTitle, preferencesService) {
                const query = omit($location.search(), '_id', 'repo');

                this.flags = $scope.flags || {};
                this.flags.facets = !isEmpty(query);
                pageTitle.setUrl(gettext('Search'));
                $scope.$watch('search.activeProvider', (activeProvider) => {
                    if (activeProvider) {
                        if (activeProvider.advanced_search != null) {
                            this.flags.facets = !!activeProvider.advanced_search;
                        }
                        if (activeProvider.config?.default_list_view) {
                            switch (activeProvider.config.default_list_view) {
                            case 'list':
                                $scope.view = 'compact';
                                break;
                            case 'grid':
                                $scope.view = 'photogrid';
                                break;
                            }
                        }
                    }
                });
                preferencesService.get().then((result) => {
                    if (result != null && FILTERS_PANEL_PREFERENCES_KEY in result) {
                        this.flags.facets = result[FILTERS_PANEL_PREFERENCES_KEY]['enabled'];
                    } else {
                        this.flags.facets = filtersPanelPreferences[FILTERS_PANEL_PREFERENCES_KEY]['default'];
                    }
                });
                $scope.toggleFiltersPane = () => {
                    $scope.flags.facets = !$scope.flags.facets;
                    filtersPanelPreferences[FILTERS_PANEL_PREFERENCES_KEY]['enabled'] = $scope.flags.facets;
                    preferencesService.update(filtersPanelPreferences);
                };
            }],
    };
}
