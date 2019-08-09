import _ from 'lodash';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {gettext} from 'core/utils';

/**
 * @ngdoc controller
 * @module superdesk.apps.content_filters
 * @name FilterConditionsCtrl
 * @requires contentFilters
 * @requires notify
 * @requires modal
 * @requires filter
 * @description Controller for the Filter Conditions tab, found on the Content Filters
 * settings page.
 */
FilterConditionsController.$inject = ['$scope', 'contentFilters', 'notify', 'modal', '$filter', 'content'];
export function FilterConditionsController($scope, contentFilters, notify, modal, $filter, content) {
    getLabelNameResolver().then((getLabelForFieldId) => {
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
                var allValues = $scope.valueLookup[$scope.filterCondition.field];
                var valueField = $scope.valueFieldLookup[$scope.filterCondition.field];

                _.each(values, (value) => {
                    var v = _.find(allValues, (val) => val[valueField].toString() === value);

                    $scope.filterCondition.values.push(v);
                });
            }
        };

        $scope.isListValue = function() {
            return _.includes(['in', 'nin'], $scope.filterCondition.operator)
                && $scope.valueLookup[$scope.filterCondition.field];
        };

        /**
         * @ngdoc method
         * @name FilterConditionsCtrl#isComparisonValue
         * @public
         * @description Checks if filter condition operator is one of the comparison operators
         * @returns {Boolean}
         */
        $scope.isComparisonValue = function() {
            return _.includes(['eq', 'ne', 'lt', 'lte', 'gt', 'gte'], $scope.filterCondition.operator)
                && $scope.valueLookup[$scope.filterCondition.field];
        };

        /**
         * @description label returns the display name for a key.
         */
        $scope.label = (id) => getLabelForFieldId(id);

        $scope.cancel = function() {
            $scope.origFilterCondition = null;
            $scope.filterCondition = null;
        };

        $scope.save = function() {
            $scope.filterCondition.value = getFilterValue();
            delete $scope.filterCondition.values;
            contentFilters.saveFilterCondition($scope.origFilterCondition, $scope.filterCondition)
                .then(
                    () => {
                        notify.success(gettext('Filter condition saved.'));
                        $scope.cancel();
                    },
                    (response) => {
                        if (angular.isDefined(response.data._issues)) {
                            if (response.data._issues.name && response.data._issues.name.unique) {
                                notify.error(gettext('Error: Name needs to be unique'));
                            } else {
                                notify.error(gettext('Error: ' + JSON.stringify(response.data._issues)));
                            }
                        } else if (angular.isDefined(response.data._message)) {
                            notify.error(gettext('Error: ' + response.data._message));
                        } else {
                            notify.error(gettext('Error: Failed to save filter condition.'));
                        }
                    },
                )
                .then(fetchFilterConditions);
        };

        $scope.remove = function(filterCondition) {
            modal.confirm(gettext('Are you sure you want to delete filter condition?'))
                .then(() => contentFilters.remove(filterCondition))
                .then((result) => {
                    _.remove($scope.filterConditions, filterCondition);
                }, (response) => {
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

                _.each($scope.filterCondition.values, (value) => {
                    values.push(value[$scope.valueFieldLookup[$scope.filterCondition.field]]);
                });
                return values.join();
            }

            return $scope.filterCondition.value;
        };

        $scope.getFilterConditionSummary = function(filterCondition) {
            var labels = [];

            var values = filterCondition.value.split(',');

            _.each(values, (value) => {
                if ($scope.valueLookup[filterCondition.field]) {
                    var v = _.find($scope.valueLookup[filterCondition.field],
                        (val) => val[$scope.valueFieldLookup[filterCondition.field]].toString() === value);

                    labels.push(v.name);
                }
            });

            var conditionValue = labels.length > 0 ? labels.join(', ') : filterCondition.value;
            var itemLabel = $scope.label(filterCondition.field);

            return '(' + itemLabel + ' ' + filterCondition.operator + ' ' + conditionValue + ')';
        };

        var fetchFilterConditions = function() {
            contentFilters.getAllFilterConditions().then((_filterConditions) => {
                $scope.filterConditions = $filter('sortByName')(_filterConditions);
            });

            contentFilters.getFilterConditionParameters().then((params) => {
                $scope.filterConditionParameters = params;
                _.each(params, (param) => {
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
    });
}
