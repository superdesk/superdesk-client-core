SavedActivityReports.$inject = ['api', '$filter', '$q', '$rootScope'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name SavedActivityReports
 * @requires api, $filter, $q, $rootScope
 * @description A service that handles the retrieval of the saved activity reports
 */
export function SavedActivityReports(api, $filter, $q, $rootScope) {
    /**
     * @ngdoc method
     * @name SavedActivityReports#_getAll
     * @param {Integer} page
     * @param {Integer} items - items per page
     * @param {Array} params - query params
     * @returns {Object} promise
     * @description Return saved activity reports starting with page, having 'items' per page
     */
    var _getAll = function(page, items, params) {
        var endPoint = 'saved_activity_reports';

        return api.query(endPoint, {max_results: 200, page: page}, params).then((result) => {
            var allItems = [],
                currPage = page;

            if (items) {
                allItems = items.concat(result._items);
            } else {
                allItems = result._items;
            }
            if (result._links.next) {
                currPage++;
                return _getAll(endPoint, currPage, allItems, params);
            }
            return $filter('sortByName')(allItems);
        });
    };

    this.savedActivityReports = null;
    this.savedActivityReportsLookup = null;

    /**
     * @ngdoc method
     * @name SavedActivityReports#getAllSavedActivityReports
     * @param {Integer} page
     * @param {Integer} items - items per page
     * @returns {Array} List of activity reports
     * @description Return saved activity reports starting with page, having 'items' per page
     */
    this.getAllSavedActivityReports = function(page, items) {
        var self = this;

        if (self.savedActivityReports) {
            return $q.when(self.savedActivityReports);
        }

        return _getAll(page, items)
        .then((savedActivityReports) => {
            self.savedActivityReports = savedActivityReports;
            self.savedActivityReportsLookup = {};
            _.each(savedActivityReports, (item) => {
                self.savedActivityReportsLookup[item._id] = item;
            });
            return self.savedActivityReports;
        });
    };

    /*
     * @ngdoc method
     * @name SavedActivityReports#resetSavedActivityReports
     * @description Reset activity reports lists
     */
    this.resetSavedActivityReports = function() {
        this.savedActivityReports = null;
        this.savedActivityReportsLookup = null;
    };

    // reset cache on update
    $rootScope.$on('savedactivityreport:update', angular.bind(this, this.resetSavedActivityReports));
}
