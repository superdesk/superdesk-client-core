var app = angular.module('superdesk.stream', [
    'superdesk.activity',
    'superdesk.asset'
]);

app.controller('StreamController', ['$scope', 'api', '$rootScope', 'desks', function($scope, api, $rootScope, desks) {
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
        return previousDate.getYear() !== $scope.currentDate.getYear() ||
               previousDate.getMonth() !== $scope.currentDate.getMonth() ||
               previousDate.getDate() !== $scope.currentDate.getDate();
    };

    var fetchActivities = function() {
        var filter = {max_results: $scope.max_results};
        if ($scope.desk) {
            filter.where = {desk: $scope.desk._id};
        }

        api('activity').query(filter)
        .then(function(result) {
            $scope.activities = result;
        });
    };

    // looks like route /workspace/stream is not longer
    // hence commenting the code below just to be on safe side

    // $scope.$watch('desk', function(_e, extras) {
    //     fetchActivities();
    // });

    // $rootScope.$on('activity', function(_e, extras) {
    //     fetchActivities();
    // });
}])

.directive('sdActivityStream', ['asset', 'authoringWorkspace', function(asset, authoringWorkspace) {
    return {
        scope: {
            activities: '=',
            max_results: '=maxResults',
            loadMore: '&'
        },
        templateUrl: asset.templateUrl('superdesk-stream/views/activity-stream.html'),
        link: function(scope, element, attrs) {
            scope.openArticle = function(activity) {
                if (activity.item) {
                    authoringWorkspace.edit({'_id': activity.item}, 'edit');
                }
            };
        }
    };
}])

.directive('sdActivityMessage', [function() {
    return {
        scope: {
            activity: '='
        },
        template:'{{display_message}}',
        link: function(scope, element, attrs) {
            if (scope.activity.name !== 'notify') {
                scope.display_message = scope.activity.message;
                for (var tag in scope.activity.data) {
                    if (scope.activity.data.hasOwnProperty(tag)) {
                        var tagRegex = new RegExp('{{\\s*' + tag + '\\s*}}', 'gi');
                        scope.display_message =
                            scope.display_message.replace(tagRegex, scope.activity.data[tag]);
                    }
                }
            }
        }
    };
}])

.config(['superdeskProvider', 'assetProvider', 'gettext', function(superdesk, asset, gettext) {
    superdesk.activity('/workspace/stream', {
        label: gettext('Workspace'),
        controller: 'StreamController',
        beta: true,
        templateUrl: asset.templateUrl('superdesk-stream/views/workspace-stream.html'),
        topTemplateUrl: asset.templateUrl('superdesk-dashboard/views/workspace-topnav.html')
    });
}]);
