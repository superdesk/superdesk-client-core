SavedSearchService.$inject = ['api', '$filter', '$q', '$rootScope'];

export function SavedSearchService(api, $filter, $q, $rootScope) {

    var _getAll = function(endPoint, page, items, params) {
        page = page || 1;
        items = items || [];
        params = params || null;

        return api.query(endPoint, {max_results: 200, page: page}, params)
        .then(function(result) {
            items = items.concat(result._items);
            if (result._links.next) {
                page++;
                return _getAll(endPoint, page, items, params);
            }
            return $filter('sortByName')(items);
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
        .then(function(savedSearches) {
            self.savedSearches = savedSearches;
            self.savedSearchLookup = {};
            _.each(savedSearches, function(item) {
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
