export default function SearchProviderService(providerTypes, $filter, api, allowed) {
    this.getAllowedProviderTypes = () => api.get('search_providers_allowed')
        .then((allowedTypes) => allowedTypes._items);

    this.getProviderLabels = (providerTypes) => {
        var providerLabels = {};

        providerTypes.forEach((type) => {
            providerLabels[type.search_provider] = type.label;
        });

        return providerLabels;
    };

    this.getSearchProviders = (criteria) => api.query('search_providers', criteria)
        .then((result) => $filter('sortByName')(result._items, 'search_provider'));

    this.getActiveSearchProviders = () => this.getSearchProviders({where: {is_closed: {$ne: true}}});
}

SearchProviderService.$inject = ['providerTypes', '$filter', 'api', 'allowed'];
