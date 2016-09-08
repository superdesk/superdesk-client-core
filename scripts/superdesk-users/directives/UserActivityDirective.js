UserActivityDirective.$inject = ['profileService', 'asset'];
export function UserActivityDirective(profileService, asset) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: asset.templateUrl('superdesk-users/views/activity-feed.html'),
        scope: {
            user: '='
        },
        link: function(scope, element, attrs) {
            var page = 1;
            var maxResults = 5;
            scope.max_results = maxResults;

            scope.$watch('user', function() {
                profileService.getUserActivity(scope.user, maxResults).then(function(list) {
                    scope.activityFeed = list;
                });
            });

            scope.loadMore = function() {
                page++;
                profileService.getUserActivity(scope.user, maxResults, page).then(function(next) {
                    Array.prototype.push.apply(scope.activityFeed._items, next._items);
                    scope.activityFeed._links = next._links;
                    scope.max_results += maxResults;
                });
            };
        }
    };
}
