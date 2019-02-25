import _ from 'lodash';
import {gettext} from 'core/utils';

export const DEFAULT_DATEFIELD_SHORTCUTS = [
    {
        label: gettext('Today'),
        value: 0,
        term: 'days',
    },
    {
        label: gettext('Tomorrow'),
        value: 1,
        term: 'days',
    },
    {
        label: gettext('In 3 days'),
        value: 3,
        term: 'days',
    },
];

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
            return api.getAll('vocabularies').then(
                (result) => {
                    self.AllActiveVocabularies = result;
                    return self.AllActiveVocabularies;
                },
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
            return api.getAll('vocabularies', {where: {type: 'manageable'}}).then(
                (result) => {
                    result._items = $filter('sortByName')(result._items, 'display_name');
                    self.vocabularies = result;
                    return self.vocabularies;
                },
            );
        }

        return $q.when(self.vocabularies);
    };

    /**
     * @ngdoc method
     * @name VocabularyService#isInit
     * @public
     * @description Returns true if the vocabularies were initialized.
     * @return {Boolean}
     */
    this.isInit = () => !!self.AllActiveVocabularies;

    /**
     * @ngdoc method
     * @name VocabularyService#getVocabulary
     * @public
     * @description Returns the vocabulary identified by the given id.
     * @param {String} vocabularyId
     * @return {Promise} {Object} vocabulary
     */
    this.getVocabulary = function(vocabularyId) {
        return self.getAllActiveVocabularies().then((vocabularies) => _.find(vocabularies, {_id: vocabularyId}));
    };

    /**
     * @ngdoc method
     * @name VocabularyService#getVocabularySync
     * @public
     * @description Returns the vocabulary identified by the given id.
     * @param {String} vocabularyId
     * @return {Object} vocabulary
     */
    this.getVocabularySync = function(vocabularyId) {
        if (self.AllActiveVocabularies) {
            return _.find(self.AllActiveVocabularies, {_id: vocabularyId});
        }
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

    this.getDefaultDatefieldShortcuts = function() {
        return DEFAULT_DATEFIELD_SHORTCUTS;
    };

    // reset cache on update
    $rootScope.$on('vocabularies:updated', angular.bind(this, this._resetVocabularies));
}
