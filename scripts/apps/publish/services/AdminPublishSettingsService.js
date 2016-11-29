AdminPublishSettingsService.$inject = ['api'];
export function AdminPublishSettingsService(api) {
    var _fetch = function(endpoint, criteria) {
        return api[endpoint].query(criteria);
    };

    var service = {
        fetchPublishErrors: function() {
            var criteria = {io_type: 'publish'};

            return _fetch('io_errors', criteria);
        }
    };

    return service;
}
