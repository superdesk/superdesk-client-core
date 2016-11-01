SavedActivityReports.$inject = ['api', '$filter', '$q', '$rootScope'];

export function SavedActivityReports(api, $filter, $q, $rootScope) {

    var _getAll = function(page, items, params) {
        var endPoint = 'saved_activity_reports';
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

    this.savedActivityReports = null;
    this.savedActivityReportsLookup = null;

    this.getAllSavedActivityReports = function(page, items) {
        var self = this;

        if (self.savedActivityReports) {
            return $q.when(self.savedActivityReports);
        }

        return _getAll(page, items)
        .then(function(savedActivityReports) {
            self.savedActivityReports = savedActivityReports;
            self.savedActivityReportsLookup = {};
            _.each(savedActivityReports, function(item) {
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
