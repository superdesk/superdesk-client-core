export default function SearchProviderService(providerTypes, $filter, api, allowed) {
    return {
        getAllowedProviderTypes: () => api.get('search_providers_allowed').then((allowedTypes) => allowedTypes._items),
        getSearchProviders: () => api.search_providers.query({})
            .then((result) => $filter('sortByName')(result._items, 'search_provider')),
    };
}

SearchProviderService.$inject = ['providerTypes', '$filter', 'api', 'allowed'];
