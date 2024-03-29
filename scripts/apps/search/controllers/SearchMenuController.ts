import {get, isEqual, cloneDeep} from 'lodash';
import {ISavedSearch, mapFiltersServerToClient} from '../SavedSearch';
import {mapPredefinedDateFiltersServerToClient} from '../directives/DateFilters';
import _ from 'lodash';

const SUPERDESK_REPOS_REGEX = new RegExp('ingest|archive|archived|published');

const isSameRepo = (shortcut, provider) => {
    const repo = get(shortcut, 'filter.query.repo', '');

    return (repo != null && repo === provider._id) ||
        (provider._id === '' && (repo == null || SUPERDESK_REPOS_REGEX.test(repo)));
};

SearchMenuController.$inject = [
    '$rootScope', '$scope', '$filter', '$location', '$route', 'searchProviderService', 'api', 'savedSearch',
    'privileges',
];
export default function SearchMenuController(
    $rootScope, $scope, $filter, $location, $route, searchProviderService, api, savedSearch,
    privileges,
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
        } else if (provider === SUPERDESK_PROVIDER) {
            return {internal: true};
        } else {
            const repo = provider._id || provider.search_provider || provider.source;

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
        $location.search(mapPredefinedDateFiltersServerToClient(getSearchParams(provider)));
        $route.reload();
    };

    const initActiveProvider = () => {
        if ($location.path() === '/search') {
            // prevent from changing active provider during click on article
            if (!$location.search()._id && !$location.search().item) {
                this.activeProvider = this.providers.find(
                    (provider) => isEqual($location.search(), getSearchParams(provider)),
                );
            }

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
                .map(mapFiltersServerToClient);

            // bundle repo and its shortcuts
            this.providers.forEach((provider) => {
                providers.push(provider);
                providers = providers.concat($filter('sortByName')(
                    shortcuts.filter((shortcut) => isSameRepo(shortcut, provider)),
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
                const hasGlobalSearchPrivilege = privileges.privileges.use_global_saved_searches;

                if (defaultProvider) {
                    this.providers = this.providers.filter((provider) => provider !== defaultProvider);
                    if (hasGlobalSearchPrivilege) {
                        this.providers.unshift(SUPERDESK_PROVIDER);
                    }
                    this.providers.unshift(defaultProvider);
                } else if (hasGlobalSearchPrivilege) {
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
