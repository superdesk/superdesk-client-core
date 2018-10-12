DataConsistencyController.$inject = ['$scope', 'api'];
export function DataConsistencyController($scope, api) {
    $scope.consistency_records = null;

    function fetchConsistencyRecords() {
        var criteria = criteria || {};

        criteria.max_results = 200;
        return api.consistency.query(criteria);
    }

    $scope.reload = function() {
        fetchConsistencyRecords().then((data) => {
            $scope.consistency_records = data._items;
            $scope.lastRefreshedAt = new Date();
        });
    };

    $scope.reload();
}
