
SavedActivityReports.$inject = ['api', '$filter', '$q', '$rootScope'];
export function SavedActivityReports(api, $filter, $q, $rootScope) {
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

    this.resetSavedActivityReports = function() {
        this.savedActivityReports = null;
        this.savedActivityReportsLookup = null;
    };

    // reset cache on update
    $rootScope.$on('savedactivityreport:update', angular.bind(this, this.resetSavedActivityReports));
}
