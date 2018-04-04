
SearchMenuController.$inject = ['$rootScope', '$filter', '$location', '$route', 'searchProviderService', 'api'];
export default function SearchMenuController($rootScope, $filter, $location, $route, searchProviderService, api) {
    let providerLabels = {};

    /**
     * Activate search shortcut
     *
     * @param {Object} provider
     */
    this.loadSearchShortcut = (provider) => {
        const repo = provider ? (provider._id || provider.search_provider || provider.source) : '';

        $location.url('/search?repo=' + repo);
        $route.reload();
    };

    /**
     * Get provider label
     *
     * @param {Object} provider
     */
    this.providerLabel = (provider) => provider && (provider.name || providerLabels[provider.source]) || '';

    // init search providers
    if ($rootScope.config && $rootScope.config.features && $rootScope.config.features.searchShortcut) {
        api.search_providers.query({max_results: 200})
            .then((result) => {
                this.providers = $filter('sortByName')(result._items, 'search_provider');
            });

        searchProviderService.getAllowedProviderTypes()
            .then((providerTypes) => {
                providerLabels = searchProviderService.getProviderLabels(providerTypes);
            });
    }
}