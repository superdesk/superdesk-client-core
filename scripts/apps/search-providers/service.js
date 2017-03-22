export default function SearchProviderService(providerTypes, $filter, api, allowed) {
    return {
        getAllowedProviderTypes: () => api.get('search_providers_allowed').then((allowedTypes) => allowedTypes._items),
        getProviderLabels: (providerTypes) => {
            var providerLabels = {};

            providerTypes.forEach((type) => {
                providerLabels[type.search_provider] = type.label;
            });
            return providerLabels;
        },
        getSearchProviders: () => api.search_providers.query({})
            .then((result) => $filter('sortByName')(result._items, 'search_provider')),
    };
}

SearchProviderService.$inject = ['providerTypes', '$filter', 'api', 'allowed'];
