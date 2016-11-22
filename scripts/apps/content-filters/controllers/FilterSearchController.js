/**
 * @ngdoc controller
 * @module superdesk.apps.content_filters
 * @name FilterSearchCtrl
 * @description Controller for the Filter Search tab, found on the Content Filters
 * settings page.
 */
FilterSearchController.$inject = ['$scope', 'contentFilters', 'notify', '$filter'];
export function FilterSearchController($scope, contentFilters, notify, $filter) {
    $scope.filterCondition = null;
    $scope.operatorLookup = {};
    $scope.valueLookup = {};
    $scope.valueFieldLookup = {};
    $scope.searchResult = null;
    $scope.contentFiltersLookup = {};

    $scope.isListValue = function() {
        if ($scope.filterCondition != null) {
            return _.includes(['in', 'nin'], $scope.filterCondition.operator)
                && $scope.valueLookup[$scope.filterCondition.field];
        }
    };

    $scope.hideList = true;

    $scope.handleKey = function(event) {
        if ($scope.filterCondition.values.length > 0) {
            notify.error(gettext('single value is required'));
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    };
    $scope.resetValues = function() {
        $scope.searchResult = null;
        $scope.filterCondition.values.length = 0;
        $scope.filterCondition.value = null;
    };

    $scope.getFilter = function(filterId) {
        return _.find($scope.contentFilters, {_id: filterId});
    };

    function fetchContentFilters() {
        contentFilters.getAllContentFilters().then(function(_filters) {
            $scope.contentFilters = _filters;
            _.each($scope.contentFilters, function(filter) {
                $scope.contentFiltersLookup[filter._id] = filter;
            });
        });
    }

    function populateData() {
        return contentFilters.getFilterConditionParameters().then(function(params) {
            $scope.filterConditionParameters = $filter('sortByName')(params, 'field');
            _.each(params, function(param) {
                $scope.operatorLookup[param.field] = param.operators;
                $scope.valueLookup[param.field] = param.values;
                $scope.valueFieldLookup[param.field] = param.value_field;
            });

            $scope.origFilterCondition = {};
            $scope.filterCondition = _.create($scope.origFilterCondition);
            $scope.filterCondition.values = [];
            setFilterValues();
        });
    }

    function setFilterValues() {
        var values = $scope.filterCondition.value != null ? $scope.filterCondition.value.split(',') : [];
        var allValues = $scope.valueLookup[$scope.filterCondition.field];
        var valueField = $scope.valueFieldLookup[$scope.filterCondition.field];

        _.each(values, function(value) {
            var v = _.find(allValues, function(val) {
                return val[valueField].toString() === value;
            });

            $scope.filterCondition.values.push(v);
        });
    }

    function getFilterValue() {
        if ($scope.isListValue()) {
            var values = [];
            _.each($scope.filterCondition.values, function(value) {
                values.push(value[$scope.valueFieldLookup[$scope.filterCondition.field]]);
            });
            return values.join();
        } else {
            return $scope.filterCondition.value;
        }
    }

    $scope.search = function() {
        if (!$scope.loading) {
            $scope.searchResult = null;
            $scope.filterCondition.value = getFilterValue();
            var inputs = {
                'field': $scope.filterCondition.field,
                'operator': $scope.filterCondition.operator,
                'value': $scope.filterCondition.value
            };
            $scope.loading = true;
            contentFilters.getFilterSearchResults(inputs).then(function(result) {

                if (result[0].filter_conditions.length === 0 &&
                    result[0].content_filters.length === 0 &&
                    result[0].selected_subscribers.length === 0) {
                    notify.error(gettext('no results found'));
                } else {
                    $scope.searchResult = result[0];
                }

                $scope.filterCondition.value = null;
            })
            ['finally'](function() {
                $scope.loading = false;
            });
        }
    };

    populateData().then(function() {
        fetchContentFilters();
    });
}
