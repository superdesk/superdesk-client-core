export default angular.module('superdesk.core.directives.searchListSingle', ['superdesk.core.services.asset'])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdSearchListSingle
     *
     * @requires asset
     *
     * @param {String} endpoint API endpoint to send queries.
     * @param {Integer} pageSize Number of items per page.
     * @param {String} labelKey Object key to display items by.
     * @param {String} searchKey Object key to search keyword in.
     * @param {Object} criteria Base criteria object to use in queries.
     * @param {Integer} maxSelectedItems Maximum number of items to select.
     * @param {Array} disabledItems Items that will be disabled.
     * @param {Object} selectedItem Target to populate with selected item.
     *
     * @description
     * SearchListSingle directive is a proxy directive for SearchList,
     * limiting it to a single item for ease of use.
     *
     * Example:
     * ```html
     * <div sd-search-list
     *     data-endpoint="subscribers"
     *     data-page-size="5"
     *     data-label-key="name"
     *     data-search-key="name"
     *     data-criteria="criteria"
     *     data-disabled-items="disabledItems"
     *     data-selected-item="selectedItem">
     * </div>
     * ```
     */
    .directive('sdSearchListSingle', ['asset', function(asset) {
        return {
            scope: {
                endpoint: '@',
                pageSize: '@',
                labelKey: '@',
                searchKey: '@',
                criteria: '=',
                disabledItems: '=',
                selectedItem: '=',
            },
            templateUrl: asset.templateUrl('core/views/sdSearchListSingle.html'),
            link: function(scope, element, attrs) {
                scope.selectedItems = [];

                scope.$watch('selectedItems', () => {
                    if (Array.isArray(scope.selectedItems)) {
                        scope.selectedItem = _.last(scope.selectedItems);
                    }
                });
            },
        };
    }]);
