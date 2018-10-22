export default function SearchProviderService($filter, api) {
    this.getAllowedProviderTypes = () => api.get('search_providers_allowed')
        .then((allowedTypes) => allowedTypes._items);

    this.getProviderLabels = (_providerTypes) => {
        var providerLabels = {};

        _providerTypes.forEach((type) => {
            providerLabels[type.search_provider] = type.label;
        });

        return providerLabels;
    };

    this.getSearchProviders = (criteria) => api.query('search_providers', criteria)
        .then((result) => $filter('sortByName')(result._items, 'search_provider'));

    this.getActiveSearchProviders = () => this.getSearchProviders({where: {is_closed: {$ne: true}}});
}

SearchProviderService.$inject = ['$filter', 'api'];
