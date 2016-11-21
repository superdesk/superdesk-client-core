/**
 * @ngdoc service
 * @module superdesk.apps.vocabularies
 * @name VocabularyService
 *
 * @requires api
 * @requires $q
 * @requires $filter
 * @requires $rootScope
 *
 * @description Provides a service to fetch and cache the vocabularies
 */
VocabularyService.$inject = ['api', '$q', '$filter', '$rootScope'];
export function VocabularyService(api, $q, $filter, $rootScope) {
    var service = this;
    service.AllActiveVocabularies = null;
    service.vocabularies = null;

    /**
     * @ngdoc method
     * @name VocabularyService#getAllVocabularies
     * @public
     * @description Return all of the vocabularies filtered by active items only, either from
     * the cache or retrieved via an api request
     * @return {Promise} {Object} vocabularies
     */
    this.getAllActiveVocabularies = function() {
        if (service.AllActiveVocabularies == null) {
            return api.query('vocabularies', {max_results: 50}).then(
                function(result) {
                    service.AllActiveVocabularies = result;
                    return service.AllActiveVocabularies;
                }
            );
        } else {
            return $q.when(service.AllActiveVocabularies);
        }
    };

    /**
     * @ngdoc method
     * @name VocabularyService#getVocabularies
     * @public
     * @description Returns the manageable vocabularies.
     * @return {Promise} {Object} vocabularies
     */
    this.getVocabularies = function() {
        if (service.vocabularies == null) {
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

    /**
     * @ngdoc method
     * @name VocabularyService#_resetVocabularies
     * @private
     * @description Clears the cached vocabularies.
     */
    this._resetVocabularies = function() {
        service.AllActiveVocabularies = null;
        service.vocabularies = null;
    };

    // reset cache on update
    $rootScope.$on('vocabularies:updated', angular.bind(this, this._resetVocabularies));

}
