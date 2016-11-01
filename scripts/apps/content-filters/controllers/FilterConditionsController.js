/**
 * @ngdoc controller
 * @module superdesk.apps.content_filters
 * @name FilterConditionsCtrl
 * @description Controller for the Filter Conditions tab, found on the Content Filters
 * settings page.
 */
FilterConditionsController.$inject = ['$scope', 'contentFilters', 'notify', 'modal', '$filter'];
export function FilterConditionsController($scope, contentFilters, notify, modal, $filter) {
    $scope.filterConditions = null;
    $scope.filterCondition = null;
    $scope.origFilterCondition = null;
    $scope.filterConditionParameters = null;
    $scope.operatorLookup = {};
    $scope.valueLookup = {};
    $scope.valueFieldLookup = {};
    $scope.loadedFilters = false;

    $scope.edit = function(fc) {
        $scope.origFilterCondition = fc || {};
        $scope.filterCondition = _.create($scope.origFilterCondition);
        $scope.filterCondition.values = [];

        if ($scope.isListValue()) {
            var values = $scope.filterCondition.value.split(',');
            var all_values = $scope.valueLookup[$scope.filterCondition.field];
            var value_field = $scope.valueFieldLookup[$scope.filterCondition.field];

            _.each(values, function(value) {
                var v = _.find(all_values, function(val) {
                    return val[value_field].toString() === value;
                });

                $scope.filterCondition.values.push(v);
            });
        }
    };

    $scope.isListValue = function() {
        return _.includes(['in', 'nin'], $scope.filterCondition.operator) && $scope.valueLookup[$scope.filterCondition.field];
    };

    $scope.cancel = function() {
        $scope.origFilterCondition = null;
        $scope.filterCondition = null;
    };

    $scope.save = function() {
        $scope.filterCondition.value = getFilterValue();
        delete $scope.filterCondition.values;
        contentFilters.saveFilterCondition($scope.origFilterCondition, $scope.filterCondition)
            .then(
                function() {
                    notify.success(gettext('Filter condition saved.'));
                    $scope.cancel();
                },
                function(response) {
                    if (angular.isDefined(response.data._issues)) {
                        if (response.data._issues.name && response.data._issues.name.unique) {
                            notify.error(gettext('Error: ' + gettext('Name needs to be unique')));
                        } else {
                            notify.error(gettext('Error: ' + JSON.stringify(response.data._issues)));
                        }
                    } else if (angular.isDefined(response.data._message)) {
                        notify.error(gettext('Error: ' + response.data._message));
                    } else {
                        notify.error(gettext('Error: Failed to save filter condition.'));
                    }
                }
            ).then(fetchFilterConditions);
    };

    $scope.remove = function(filterCondition) {
        modal.confirm(gettext('Are you sure you want to delete filter condition?'))
        .then(function() {
            return contentFilters.remove(filterCondition);
        })
        .then(function(result) {
            _.remove($scope.filterConditions, filterCondition);
        }, function(response) {
            if (angular.isDefined(response.data._message)) {
                notify.error(gettext('Error: ' + response.data._message));
            } else {
                notify.error(gettext('There was an error. Filter condition cannot be deleted.'));
            }
        });
    };

    var getFilterValue = function() {
        if ($scope.isListValue()) {
            var values = [];
            _.each($scope.filterCondition.values, function(value) {
                values.push(value[$scope.valueFieldLookup[$scope.filterCondition.field]]);
            });
            return values.join();
        } else {
            return $scope.filterCondition.value;
        }
    };

    $scope.getFilterConditionSummary = function(filterCondition) {
        var labels = [];

        var values = filterCondition.value.split(',');
        _.each(values, function(value) {
            if ($scope.valueLookup[filterCondition.field]) {
                var v = _.find($scope.valueLookup[filterCondition.field], function(val) {
                    return val[$scope.valueFieldLookup[filterCondition.field]].toString() === value;
                });

                labels.push(v.name);
            }
        });

        var conditionValue = labels.length > 0 ? labels.join(', ') : filterCondition.value;
        return '(' + filterCondition.field + ' ' + filterCondition.operator + ' ' + conditionValue + ')';
    };

    var fetchFilterConditions = function() {
        contentFilters.getAllFilterConditions().then(function(_filterConditions) {
            $scope.filterConditions = $filter('sortByName')(_filterConditions);
        });

        contentFilters.getFilterConditionParameters().then(function(params) {
            $scope.filterConditionParameters = params;
            _.each(params, function(param) {
                $scope.operatorLookup[param.field] = param.operators;
                $scope.valueLookup[param.field] = param.values;
                $scope.valueFieldLookup[param.field] = param.value_field;
            });
            $scope.loadedFilters = true;
        });
    };

    /**
     * Triggered when the value of Field property changes and clears the existing values from the condition.
     */
    $scope.clearConditionValues = function() {
        if ($scope.filterCondition.value) {
            $scope.filterCondition.value = null;
        }

        if ($scope.filterCondition.values && $scope.filterCondition.values.length > 0) {
            $scope.filterCondition.values.length = 0;
        }
    };

    fetchFilterConditions();
}
