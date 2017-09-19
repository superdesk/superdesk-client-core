RemoveIngestedService.$inject = ['api', '$rootScope'];
export function RemoveIngestedService(api, $rootScope) {
    this.canRemove = canRemove;
    this.remove = remove;
    this.fetchProviders = fetchProviders;

    var providers = {};

    /**
     * Fetch ingest providers in order to read if remove is allowed
     */
    function fetchProviders() {
        if (api.ingestProviders) {
            return api.ingestProviders.query({max_results: 200})
                .then((result) => {
                    _.each(result._items, (provider) => {
                        providers[provider._id] = provider.allow_remove_ingested || false;
                    });
                });
        }
    }

    $rootScope.$on('ingest_provider:create', fetchProviders);
    $rootScope.$on('ingest_provider:update', fetchProviders);

    /**
     * Return true if the item can be removed
     *
     * @param {Object} item
     * @returns {boolean}
     */
    function canRemove(item) {
        return item.ingest_provider && providers[item.ingest_provider];
    }

    /**
     * Remove an ingested item
     *
     * @param {Object} item
     */
    function remove(item) {
        return api('ingest').remove(item);
    }
}
