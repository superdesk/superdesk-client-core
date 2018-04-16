
SearchMenuController.$inject = ['$rootScope', '$filter', '$location', '$route', 'searchProviderService', 'api'];
export default function SearchMenuController($rootScope, $filter, $location, $route, searchProviderService, api) {
    let providerLabels = {};

    const SUPERDESK_PROVIDER = {
        _id: '',
        name: 'Superdesk',
    };

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
     * Keep it undefined until there is some value so one time watch will work.
     *
     * @param {Object} provider
     */
    this.providerLabel = (provider) => provider && (provider.name || providerLabels[provider.source]) || undefined;

    // init search providers
    if ($rootScope.config && $rootScope.config.features && $rootScope.config.features.searchShortcut) {
        api.search_providers.query({max_results: 200, is_closed: {$ne: true}})
            .then((result) => {
                this.providers = $filter('sortByName')(result._items, 'search_provider');

                const defaultProvider = this.providers.find((provider) => provider.is_default);

                if (defaultProvider) {
                    this.providers = this.providers.filter((provider) => provider !== defaultProvider);
                    this.providers.unshift(SUPERDESK_PROVIDER);
                    this.providers.unshift(defaultProvider);
                } else {
                    this.providers.unshift(SUPERDESK_PROVIDER);
                }

                console.info('providers', this.providers);
            });

        searchProviderService.getAllowedProviderTypes()
            .then((providerTypes) => {
                providerLabels = searchProviderService.getProviderLabels(providerTypes);
            });
    }
}