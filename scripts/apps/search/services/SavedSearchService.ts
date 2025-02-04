import _ from 'lodash';

SavedSearchService.$inject = ['api', '$filter', '$q', '$rootScope'];

export function SavedSearchService(api, $filter, $q, $rootScope) {
    var _getAll = function(endPoint, page = 1, items = [], params = null) {
        return api.query(endPoint, {max_results: 200, page: page}, params)
            .then((result) => {
                let pg = page;
                let merged = items.concat(result._items);

                if (result._links.next) {
                    pg++;
                    return _getAll(endPoint, pg, merged, params);
                }
                return $filter('sortByName')(merged);
            });
    };

    this.savedSearches = null;
    this.savedSearchLookup = null;

    this.getAllSavedSearches = function(page, items) {
        var self = this;

        if (self.savedSearches) {
            return $q.when(self.savedSearches);
        }

        return _getAll('all_saved_searches', page, items)
            .then((savedSearches) => {
                self.savedSearches = savedSearches;
                self.savedSearchLookup = {};
                _.each(savedSearches, (item) => {
                    self.savedSearchLookup[item._id] = item;
                });
                return savedSearches;
            });
    };

    this.getUserSavedSearches = function(userId, page, items) {
        return _getAll('saved_searches', page, items, userId);
    };

    this.resetSavedSearches = function() {
        this.savedSearches = null;
        this.savedSearchLookup = null;
    };

    // reset cache on update
    $rootScope.$on('savedsearch:update', angular.bind(this, this.resetSavedSearches));
}
