VocabularyService.$inject = ['api', '$q', '$filter'];
export function VocabularyService(api, $q, $filter) {
    var service = this;

    /**
     * Fetches and caches vocabularies or returns them from the cache.
     *
     * @returns {Promise}
     */
    this.getVocabularies = function() {
        if (typeof service.vocabularies === 'undefined') {
            return api.query('vocabularies', {where: {type: 'manageable'}}).then(
                function(result) {
                    result._items = $filter('sortByName')(result._items, 'display_name');
                    service.vocabularies = result;
                    return service.vocabularies;
                }
            );
        } else {
            return $q.when(service.vocabularies);
        }
    };
}
