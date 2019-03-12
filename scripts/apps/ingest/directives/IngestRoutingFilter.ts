import _ from 'lodash';

/**
 * @ngdoc directive
 * @module superdesk.apps.ingest
 * @name sdIngestRoutingFilter
 * @description
 *   Creates the Filter tab used for defining a content filter for routing
 *   rules (found in the modal for editing ingest routing schemes).
 */
IngestRoutingFilter.$inject = [];
export function IngestRoutingFilter() {
    /**
     * Creates an utility method on the built-in RegExp object used for
     * escaping arbitrary strings so that they can be safely used in
     * dynamically created regular expressions patterns.
     *
     * The idea is to find all characters in the given string that have a
     * special meaning in regex definition, and replace them with their
     * escaped versions. For example:
     *     '^' becomes '\\^', '*' becomes '\\*', etc.
     *
     * Usage example (creating a new regex pattern):
     *
     *     var regex = new RegExp(RegExp.escape(unsafeString));
     *
     * Taken from http://stackoverflow.com/a/3561711/5040035
     *
     * @method escape
     * @param {string} s - the string to escape
     * @return {string} - an escaped version of the given string
     */
    // XXX: should probably be moved into some utils module - but where?
    RegExp['escape'] = function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    return {
        scope: {
            rule: '=',
            filters: '=contentFilters',
        },
        templateUrl: 'scripts/apps/ingest/views/settings' +
                     '/ingest-routing-filter.html',
        link: function(scope) {
            var currFilter;

            function init() {
                scope.matchingFilters = []; // used for filter search
                scope.filterSearchTerm = null;

                currFilter = _.find(scope.filters, {_id: scope.rule.filter});
                if (currFilter) {
                    scope.selectedFilter = currFilter;
                } else {
                    scope.selectedFilter = null;
                }
            }

            scope.$watch('rule', init);

            /**
             * Finds a subset of all content filters whose names contain
             * the given search term. The search is case-insensitive.
             * As a result, the matchingFilters list is updated.
             *
             * @method searchFilters
             * @param {string} term - the string to search for
             */
            scope.searchFilters = function(term) {
                var regex = new RegExp(RegExp['escape'](term), 'i');

                scope.matchingFilters = _.filter(
                    scope.filters,
                    (filter) => regex.test(filter.name),
                );
            };

            /**
             * Sets the given filter as the content filter for the routing
             * rule.
             *
             * @method selectFilter
             * @param {Object} filter - the content filter to select
             */
            scope.selectFilter = function(filter) {
                scope.selectedFilter = filter;
                scope.rule.filter = filter._id;
                scope.rule.filterName = filter.name;
                scope.filterSearchTerm = null;
            };

            /**
             * Clears the routing rule's content filter.
             *
             * @method clearSelectedFilter
             */
            scope.clearSelectedFilter = function() {
                scope.selectedFilter = null;
                scope.rule.filter = null;
                scope.rule.filterName = null;
            };
        },
    };
}
