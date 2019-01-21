import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc controller
 * @module superdesk.apps.content_filters
 * @name ManageContentFiltersCtrl
 * @description
 *   Controller for the Filters tab, found on the Content Filters settings
 *   page.
 */
ManageContentFiltersController.$inject = ['$scope', 'contentFilters', 'notify', 'modal', '$filter'];
export function ManageContentFiltersController($scope, contentFilters, notify, modal, $filter) {
    getLabelNameResolver().then((getLabelForFieldId) => {
        $scope.filterConditions = null;
        $scope.contentFilters = null;
        $scope.contentFilter = null;
        $scope.origContentFilter = null;
        $scope.preview = null;
        $scope.filterConditionLookup = {};
        $scope.contentFiltersLookup = {};
        $scope.valueLookup = {};
        $scope.valueFieldLookup = {};

        $scope.label = (id) => getLabelForFieldId(id);

        $scope.editFilter = function(pf) {
            $scope.origContentFilter = pf || {};
            $scope.contentFilter = _.create($scope.origContentFilter);
            $scope.contentFilter.name = $scope.origContentFilter.name;
            $scope.contentFilter.content_filter = _.cloneDeep($scope.origContentFilter.content_filter);
            initContentFilter();
            $scope.previewContentFilter();
        };

        $scope.close = function() {
            $scope.previewContentFilter();
            $scope.origContentFilter = null;
            $scope.contentFilter = null;
            $scope.test.test_result = null;
            $scope.test.article_id = null;
        };

        $scope.saveFilter = function() {
            delete $scope.contentFilter.article_id;
            contentFilters.saveContentFilter($scope.origContentFilter, $scope.contentFilter)
                .then(
                    () => {
                        notify.success(gettext('Content filter saved.'));
                        $scope.close();
                    },
                    (response) => {
                        if (angular.isDefined(response.data._issues) &&
                            angular.isDefined(response.data._issues['validator exception'])) {
                            notify.error(gettext('Error: ' + response.data._issues['validator exception']));
                        } else if (angular.isDefined(response.data._issues)) {
                            if (response.data._issues.name && response.data._issues.name.unique) {
                                notify.error(gettext('Error: Name needs to be unique'));
                            } else {
                                notify.error(gettext('Error: ' + JSON.stringify(response.data._issues)));
                            }
                        } else if (angular.isDefined(response.data._message)) {
                            notify.error(gettext('Error: ' + response.data._message));
                        } else if (response.status === 500) {
                            notify.error(gettext('Error: Internal error in Filter testing'));
                        } else {
                            notify.error(gettext('Error: Failed to test content filter.'));
                        }
                    }
                )
                .then(fetchContentFilters);
        };

        $scope.remove = function(pf) {
            modal.confirm(gettext('Are you sure you want to delete content filter?'))
                .then(() => contentFilters.remove(pf))
                .then((result) => {
                    _.remove($scope.contentFilters, pf);
                }, (response) => {
                    if (angular.isDefined(response.data._message)) {
                        notify.error(gettext('Error: ' + response.data._message));
                    } else {
                        notify.error(gettext('There was an error. Content filter cannot be deleted.'));
                    }
                });
        };

        $scope.addStatement = function() {
            $scope.contentFilter.content_filter.push({expression: {}});
        };

        $scope.removeStatement = function(index) {
            $scope.contentFilter.content_filter.splice(index, 1);
            $scope.previewContentFilter();
        };

        $scope.addFilter = function(filterRow, filterType) {
            if (!(filterType in filterRow.expression)) {
                filterRow.expression[filterType] = [];
            }

            if (filterRow.selected && !_.includes(filterRow.expression[filterType], filterRow.selected)) {
                filterRow.expression[filterType].push(filterRow.selected);
                delete filterRow.selected;
                $scope.previewContentFilter();
            }
        };

        $scope.removeFilter = function(filterRow, filterId, filterType) {
            filterRow.expression[filterType] = _.without(filterRow.expression[filterType], filterId);
            $scope.previewContentFilter();
        };

        $scope.productionTest = function(filter) {
            $scope.$broadcast('triggerTest', filter);
        };

        $scope.test = function() {
            if (!$scope.test.article_id) {
                notify.error(gettext('Please provide an article GUID'));
                return;
            }

            contentFilters.testContentFilter({filter: $scope.contentFilter, article_id: $scope.test.article_id})
                .then(
                    (result) => {
                        $scope.test.test_result = result.match_results ? 'Does Match' : 'Doesn\'t Match';
                    },
                    (response) => {
                        if (angular.isDefined(response.data._issues)) {
                            notify.error(gettext('Error: ' + response.data._issues));
                        } else if (angular.isDefined(response.data._message)) {
                            notify.error(gettext('Error: ' + response.data._message));
                        } else {
                            notify.error(gettext('Error: Failed to save content filter.'));
                        }
                    }
                );
        };

        $scope.previewContentFilter = function() {
            $scope.preview = parseContentFilter($scope.contentFilter.content_filter);
        };

        var parseContentFilter = function(contentFilter) {
            var previews = [];

            _.each(contentFilter, (filterRow) => {
                var statementPreviews = [];

                if ('pf' in filterRow.expression) {
                    _.each(filterRow.expression.pf, (filterId) => {
                        var f = $scope.contentFiltersLookup[filterId];

                        statementPreviews.push(parseContentFilter(f.content_filter));
                    });
                }

                if ('fc' in filterRow.expression) {
                    _.each(filterRow.expression.fc, (filterId) => {
                        var f = $scope.filterConditionLookup[filterId];

                        statementPreviews.push(`(${getFilterConditionSummary(f)})`);
                    });
                }

                if (statementPreviews.length > 0) {
                    previews.push('[' + statementPreviews.join(' AND ') + ']');
                }
            });

            if (previews.length > 0) {
                return previews.join(' OR ');
            }

            return '';
        };

        /**
         * Returns the string representation of a given filter condition
         */
        const getFilterConditionSummary = (filterCondition) => {
            let labels = [];
            let values = filterCondition.value.split(',');

            _.each(values, (value) => {
                if ($scope.valueLookup[filterCondition.field]) {
                    let v = _.find($scope.valueLookup[filterCondition.field],
                        (val) => val[$scope.valueFieldLookup[filterCondition.field]].toString() === value);

                    labels.push(v.name);
                }
            });

            const conditionValue = labels.length > 0 ? labels.join(', ') : filterCondition.value;
            const fieldLabel = $scope.label(filterCondition.field);

            return `${fieldLabel} ${filterCondition.operator} "${conditionValue}"`;
        };

        var initContentFilter = function() {
            if (!$scope.contentFilter.content_filter || $scope.contentFilter.content_filter.length === 0) {
                $scope.contentFilter.content_filter = [{expression: {}}];
            }
        };

        /**
         * Fetches all filter conditions and filter condition parameters
         */
        var fetchFilterConditions = function() {
            contentFilters.getAllFilterConditions().then((_filterConditions) => {
                $scope.filterConditions = $filter('sortByName')(_filterConditions);
                _.each(_filterConditions, (filter) => {
                    $scope.filterConditionLookup[filter._id] = filter;
                });
            });

            contentFilters.getFilterConditionParameters().then((params) => {
                $scope.filterConditionParameters = params;
                _.each(params, (param) => {
                    $scope.valueLookup[param.field] = param.values;
                    $scope.valueFieldLookup[param.field] = param.value_field;
                });
            });
        };

        var fetchContentFilters = function() {
            contentFilters.getAllContentFilters().then((_filters) => {
                $scope.contentFilters = $filter('sortByName')(_filters);

                _.each($scope.contentFilters, (filter) => {
                    $scope.contentFiltersLookup[filter._id] = filter;
                });
            });
        };

        fetchFilterConditions();
        fetchContentFilters();
    });
}
