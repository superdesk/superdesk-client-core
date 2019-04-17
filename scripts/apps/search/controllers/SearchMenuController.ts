import {get, isEqual} from 'lodash';
import {ISavedSearch} from '../SavedSearch';

SearchMenuController.$inject = [
    '$rootScope', '$scope', '$filter', '$location', '$route', 'searchProviderService', 'api', 'savedSearch',
];
export default function SearchMenuController(
    $rootScope, $scope, $filter, $location, $route, searchProviderService, api, savedSearch,
) {
    let providerLabels = {};

    this.providers = [];
    this.activeProvider = null;

    const SUPERDESK_PROVIDER = {
        _id: '',
        name: 'Superdesk',
    };

    const getSearchParams = (provider) => {
        if (provider.filter) {
            return provider.filter.query;
        } else {
            const repo = provider === SUPERDESK_PROVIDER ?
                null : (provider._id || provider.search_provider || provider.source);

            return {repo};
        }
    };

    /**
     * Activate search shortcut
     *
     * @param {Object} provider
     */
    this.loadSearchShortcut = (provider) => {
        this.activeProvider = provider;

        $location.path('/search');
        $location.search(getSearchParams(provider));
        $route.reload();
    };

    const initActiveProvider = () => {
        this.activeProvider = null;
        if ($location.path() === '/search') {
            this.activeProvider = this.providers.find(
                (provider) => isEqual($location.search(), getSearchParams(provider)),
            );

            if (this.activeProvider == null && $location.search().repo) { // display search provider as active
                this.activeProvider = this.providers.find((provider) => provider._id === $location.search().repo);
            }
        }
    };

    this.isActiveProvider = (provider) => this.activeProvider != null && this.activeProvider._id === provider._id;

    /**
     * Get provider label
     *
     * Keep it undefined until there is some value so one time watch will work.
     *
     * @param {Object} provider
     */
    this.providerLabel = (provider) => provider && (provider.name || providerLabels[provider.source]) || undefined;

    // init saved searches
    const initSavedSearches = () => {
        savedSearch.getAllSavedSearches().then((savedSearches: Array<ISavedSearch>) => {
            let providers = [];
            const shortcuts = savedSearches
                .filter((search) => search.shortcut && search.is_global)
                .map((search) => ({
                    _id: search._id,
                    name: search.name,
                    filter: search.filter,
                }));

            // bundle repo and its shortcuts
            this.providers.forEach((provider) => {
                providers.push(provider);
                providers = providers.concat($filter('sortByName')(
                    shortcuts.filter((shortcut) => get(shortcut, 'filter.query.repo', '') === provider._id),
                    'search_provider',
                ));
            });

            this.providers = providers;
            initActiveProvider();
        });
    };

    // init search providers
    if (get($rootScope.config, 'features.searchShortcut')) {
        api.search_providers.query({max_results: 200, where: {is_closed: {$ne: true}}})
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
            })
            .then(initSavedSearches);

        searchProviderService.getAllowedProviderTypes()
            .then((providerTypes) => {
                providerLabels = searchProviderService.getProviderLabels(providerTypes);
            });
    } else {
        this.providers = [SUPERDESK_PROVIDER];
        initSavedSearches();
    }

    $scope.$on('$locationChangeSuccess', initActiveProvider);
}
