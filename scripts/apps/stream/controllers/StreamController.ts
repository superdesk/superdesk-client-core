StreamController.$inject = ['$scope', 'api', '$rootScope', 'desks'];

export function StreamController($scope, api, $rootScope, desks) {
    $scope.desk = null;
    $scope.activities = null;
    $scope.pageLength = 10;
    $scope.max_results = $scope.pageLength;

    $scope.loadMore = function() {
        if ($scope.activities._meta.total > $scope.max_results) {
            $scope.max_results += $scope.pageLength;
            fetchActivities();
        }
    };

    $scope.showDateHeader = function(activity) {
        $scope.currentDate = new Date($scope.activities._items[activity.index]._created);
        if (activity.index === 0) {
            return true;
        }
        var previousDate = new Date($scope.activities._items[activity.index - 1]._created);

        return previousDate.getFullYear() !== $scope.currentDate.getFullYear() ||
               previousDate.getMonth() !== $scope.currentDate.getMonth() ||
               previousDate.getDate() !== $scope.currentDate.getDate();
    };

    var fetchActivities = function() {
        var filter: any = {max_results: $scope.max_results};

        if ($scope.desk) {
            filter.where = {desk: $scope.desk._id};
        }

        api('activity', {embedded: {user: 1}}).query(filter)
            .then((result) => {
                $scope.activities = result;
            });
    };
}
