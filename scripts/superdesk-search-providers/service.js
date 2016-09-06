export default function SearchProviderService(providerTypes, $filter, api, allowed) {
    return {
        getAllowedProviderTypes: function() {
            return allowed.filterKeys(providerTypes, 'search_providers', 'search_provider');
        },
        getSearchProviders: function() {
            return api.search_providers.query({}).then(
                function(result) {
                    return $filter('sortByName')(result._items, 'search_provider');
                }
            );
        }
    };
}

SearchProviderService.$inject = ['providerTypes', '$filter', 'api', 'allowed'];
