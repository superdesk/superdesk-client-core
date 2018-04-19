UserActivityDirective.$inject = ['profileService', 'asset'];
export function UserActivityDirective(profileService, asset) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: asset.templateUrl('apps/users/views/activity-feed.html'),
        scope: {
            user: '=',
        },
        link: function(scope, element, attrs) {
            var page = 1;
            var maxResults = 5;

            scope.max_results = maxResults;

            scope.$watch('user', () => {
                profileService.getUserActivity(scope.user, maxResults).then((list) => {
                    scope.activityFeed = list;
                });
            });

            scope.loadMore = function() {
                page++;
                profileService.getUserActivity(scope.user, maxResults, page).then((next) => {
                    Array.prototype.push.apply(scope.activityFeed._items, next._items);
                    scope.activityFeed._links = next._links;
                    scope.max_results += maxResults;
                });
            };
        },
    };
}
