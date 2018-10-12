/**
 * @name contentFilters
 * @module superdesk.apps.content_filters
 * @ngdoc service
 * @description
 *   This service implements a convenience layer on top of the server API,
 *   providing higher-level methods for fetching and modifying all content
 *   related to content filters on the server.
 */
ContentFiltersService.$inject = ['api', '$filter'];
export function ContentFiltersService(api, $filter) {
    this.productionTestFilter = function(filter) {
        return filter;
    };

    this.getFilterConditionParameters = function() {
        return api.query('filter_conditions/parameters')
            .then(angular.bind(this, (params) => params._items));
    };

    this.saveFilterCondition = function(orig, diff) {
        return api.save('filter_conditions', orig, diff);
    };

    this.remove = function(item) {
        return api.remove(item);
    };

    this.getAllFilterConditions = () => api.getAll('filter_conditions');

    this.getFilterSearchResults = function(inputParams) {
        // call api to get search results
        return api.query('subscribers', {filter_condition: inputParams})
            .then(angular.bind(this, (resultSet) => resultSet._items));
    };

    this.getAllContentFilters = () => api.getAll('content_filters');

    this.saveContentFilter = function(orig, diff) {
        return api.save('content_filters', orig, diff);
    };

    this.testContentFilter = function(diff) {
        return api.save('content_filter_tests', {}, diff);
    };

    this.getGlobalContentFilters = function() {
        return api.query('content_filters', {is_global: true})
            .then((response) => $filter('sortByName')(response._items));
    };
}
