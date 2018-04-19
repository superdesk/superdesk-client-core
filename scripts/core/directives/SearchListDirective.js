import _ from 'lodash';

export default angular.module('superdesk.core.directives.searchList', ['superdesk.core.services.asset'])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdSearchList
     *
     * @requires asset
     * @requires api
     *
     * @param {String} endpoint API endpoint to send queries
     * @param {Integer} pageSize Number of items per page
     * @param {String} labelKey Object key to display items by
     * @param {String} searchKey Object key to search keyword in
     * @param {Object} criteria Base criteria object to use in queries
     * @param {Integer} maxSelectedItems Maximum number of items to select
     * @param {Array} disabledItems Items that will be disabled
     * @param {Array} selectedItems Target to populate with selected items
     * @param {String} selectedItemsHelperTemplate Additional template to
     *      display for each selected item
     * @param {Object} selectedItemsHelperData Additional data to use in
     *      helper template, which can be accessed by data variable
     *
     * @description Displays a searchable paginated list of items from
     * given endpoint, allows selecting multiple items.
     *
     * Example:
     * ```html
     * <div sd-search-list
     *     data-endpoint="subscribers"
     *     data-page-size="5"
     *     data-label-key="name"
     *     data-search-key="name"
     *     data-criteria="criteria"
     *     data-max-selected-items="1"
     *     data-disabled-items="disabledItems"
     *     data-selected-items="selectedItems"
     *     data-selected-items-helper-template="helperTemplate.html"
     *     data-selected-items-helper-data="data">
     * </div>
     * ```
     */
    .directive('sdSearchList', ['asset', 'api', function(asset, api) {
        var defaults = {
            pageSize: 25,
        };

        return {
            scope: {
                endpoint: '@',
                pageSize: '@',
                labelKey: '@',
                searchKey: '@',
                maxSelectedItems: '=',
                criteria: '=',
                disabledItems: '=',
                selectedItems: '=',
                selectedItemsHelperTemplate: '=',
                selectedItemsHelperData: '=',
            },
            templateUrl: asset.templateUrl('core/views/sdSearchList.html'),
            link: function(scope, element, attrs) {
                scope.open = false;
                scope.page = 1;
                scope.maxPage = 0;
                scope.items = null;
                scope.keyword = null;
                scope.editable = true;

                if (!_.isNil(scope.$parent._editable)) {
                    scope.editable = scope.$parent._editable;
                }

                var _update = function() {
                    var criteria = scope.criteria || {};

                    if (scope.keyword && scope.searchKey) {
                        var search = {};

                        search[scope.searchKey] = {$regex: scope.keyword, $options: '-i'};
                        criteria.where = JSON.stringify({$or: [search]});
                    }
                    api[scope.endpoint].query(_.assign({}, criteria, {
                        max_results: scope.pageSize,
                        page: scope.page,
                    }))
                        .then((result) => {
                            var pageSize = scope.pageSize || defaults.pageSize;

                            scope.maxPage = Math.ceil(result._meta.total / pageSize) || 0;
                            scope.items = result._items;
                        });
                };
                var update = _.debounce(_update, 500);

                scope.$watch('keyword', () => {
                    scope.page = 1;
                    update();
                });
                scope.$watch('page', update);

                scope.selectItem = function(item) {
                    scope.selectedItems = scope.selectedItems || [];
                    scope.selectedItems.push(item);
                    scope.selectedItems = _.uniq(scope.selectedItems);
                    if (scope.maxSelectedItems === 1) {
                        scope.open = false;
                    }
                };

                scope.unselectItem = function(item) {
                    _.remove(scope.selectedItems, (i) => i._id === item._id);
                };

                scope.isSelected = function(item) {
                    return scope.selectedItems ?
                        _.findIndex(scope.selectedItems, (i) => i._id === item._id) !== -1
                        : false;
                };

                scope.isDisabled = function(item) {
                    return scope.disabledItems ?
                        _.findIndex(scope.disabledItems, (i) => i._id === item._id) !== -1
                        : false;
                };
            },
        };
    }]);
