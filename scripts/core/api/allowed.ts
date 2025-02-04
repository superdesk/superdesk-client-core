angular.module('superdesk.core.api.allowed', [])
    .service('allowed', AllowedService);

AllowedService.$inject = ['lodash', 'api', '$q'];
function AllowedService(_, api, $q) {
    var values;

    function fetch() {
        if (values) {
            return $q.when(values);
        }

        return api.get('allowed_values')
            .then((response) => {
                values = {};
                response._items.forEach((item) => {
                    values[item._id] = item.items;
                });

                return values;
            });
    }

    /**
     * Get allowed values for resource.field
     *
     * @param {String} resource
     * @param {String} field
     * @return {Promise}
     */
    this.get = (resource, field) =>
        fetch().then(() => values[resource + '.' + field] || []);

    /**
     * Filter object keys using allowed values
     *
     * @param {Object} all
     * @param {String} resource
     * @param {String} field
     * @return {Promise}
     */
    this.filterKeys = (all, resource, field) =>
        this.get(resource, field).then((allowed) => {
            var filtered = {};

            Object.keys(all).forEach((key) => {
                var isAllowed = _.find(allowed, (val) => key.indexOf(val) === 0);

                if (isAllowed) {
                    filtered[key] = all[key];
                }
            });

            return filtered;
        });
}
