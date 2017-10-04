import _ from 'lodash';

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
    var self = this;
    const MAX_RESULTS = 200;

    self.AllActiveVocabularies = null;
    self.vocabularies = null;

    /**
     * @ngdoc method
     * @name VocabularyService#getAllVocabularies
     * @public
     * @description Return all of the vocabularies filtered by active items only, either from
     * the cache or retrieved via an api request
     * @return {Promise} {Object} vocabularies
     */
    this.getAllActiveVocabularies = function() {
        if (_.isNil(self.AllActiveVocabularies)) {
            return api.query('vocabularies', {max_results: MAX_RESULTS}).then(
                (result) => {
                    self.AllActiveVocabularies = result;
                    return self.AllActiveVocabularies;
                }
            );
        }

        return $q.when(self.AllActiveVocabularies);
    };

    /**
     * @ngdoc method
     * @name VocabularyService#getVocabularies
     * @public
     * @description Returns the manageable vocabularies.
     * @return {Promise} {Object} vocabularies
     */
    this.getVocabularies = function() {
        if (_.isNil(self.vocabularies)) {
            return api.query('vocabularies', {where: {type: 'manageable'}, max_results: MAX_RESULTS}).then(
                (result) => {
                    result._items = $filter('sortByName')(result._items, 'display_name');
                    self.vocabularies = result;
                    return self.vocabularies;
                }
            );
        }

        return $q.when(self.vocabularies);
    };

    /**
     * @ngdoc method
     * @name VocabularyService#_resetVocabularies
     * @private
     * @description Clears the cached vocabularies.
     */
    this._resetVocabularies = function() {
        self.AllActiveVocabularies = null;
        self.vocabularies = null;
    };

    // reset cache on update
    $rootScope.$on('vocabularies:updated', angular.bind(this, this._resetVocabularies));
}
