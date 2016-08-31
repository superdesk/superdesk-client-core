/**
 * @memberof superdesk.content_filters
 * @ngdoc controller
 * @name ProductionTestCtrl
 * @description
 *   Controller for the modal page used for testing a content filter
 *   against existing content items. Triggered by the action under the
 *   Filters tab on the Content Filters settings page.
 */
ProductionTestController.$inject = ['$scope', 'contentFilters', 'notify', '$location', '$window'];
export function ProductionTestController($scope, contentFilters, notify, $location, $window) {
    $scope.preview = null;
    $scope.selected = {};
    $scope.selectedItem = {};
    $scope.selectedfilter = null;
    $scope.testResult = null;
    var UP = -1,
    DOWN = 1,
    MOVES = {
        38: UP,
        40: DOWN
    };

    $scope.resultType = [
        {id: 'Matching', value: 'true'},
        {id: 'Non-Matching', value: 'false'}
    ];

    $scope.model = {selectedType:'true'};

    $scope.close = function() {
        $scope.filter_test = null;
        $scope.testResult = null;
    };
    $scope.preview = function(Item) {
        $location.search('_id', Item ? Item._id : Item);
    };
    $scope.openView = function(item) {
        $scope.openLightbox(item);
    };
    $scope.openLightbox = function (item) {
        $scope.selected.view = item;
    };
    $scope.closeLightbox = function () {
        $scope.selected.view = null;
    };
    $scope.hideActions = function () {
        return true;
    };

    $scope.$on('$routeUpdate', previewItem);

    function previewItem() {
        $scope.selectedItem = _.find($scope.testResult, {_id: $location.search()._id}) || null;
        if ($scope.selectedItem) {
            $scope.selected.preview = $scope.selectedItem;
        } else {
            $scope.selected.preview = null;
        }
    }
    $scope.handleKeyEvent = function(event) {
        var code = event.keyCode || event.which;
        if (MOVES[code]) {
            event.preventDefault();
            event.stopPropagation();
            move(MOVES[code], event);
        }
    };

    function move(diff, event) {
        var index = _.findIndex($scope.testResult, $scope.selectedItem),
            nextItem,
            nextIndex;

        if (index === -1) {
            nextItem = $scope.testResult[0];
        } else {
            nextIndex = Math.max(0, Math.min($scope.testResult.length - 1, index + diff));
            nextItem = $scope.testResult[nextIndex];
        }
        clickItem($scope.testResult[nextIndex], event);
    }
    function select(item) {
        $scope.selectedItem = item;
        $location.search('_id', item ? item._id : item);
    }

    function clickItem(item, event) {
        select(item);
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    }
    $scope.fetchResults = function() {
        fetchProductionTestResult();
    };
    $scope.$on('triggerTest', function (event, filter) {
        $scope.productionTest = true;
        $scope.testResult = null;
        $scope.selectedfilter = filter._id;
        fetchProductionTestResult();
    });
    var fetchProductionTestResult = function() {
        contentFilters.testContentFilter({
            'filter_id': $scope.selectedfilter,
            'return_matching': $scope.$eval($scope.model.selectedType
        )}).then(
            function(result) {
                $scope.testResult = result.match_results;
            },
            function(response) {
                if (angular.isDefined(response.data._issues)) {
                    notify.error(gettext('Error: ' + response.data._issues));
                } else if (angular.isDefined(response.data._message)) {
                    notify.error(gettext('Error: ' + response.data._message));
                } else {
                    notify.error(gettext('Error: Failed to fetch production test results.'));
                }
            }
        );

    };
}
