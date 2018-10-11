ActivityStream.$inject = ['asset', 'authoringWorkspace'];
export function ActivityStream(asset, authoringWorkspace) {
    return {
        scope: {
            activities: '=',
            max_results: '=maxResults',
            loadMore: '&',
        },
        templateUrl: asset.templateUrl('apps/stream/views/activity-stream.html'),
        link: function(scope, element, attrs) {
            scope.openArticle = function(activity) {
                if (activity.item) {
                    authoringWorkspace.edit({_id: activity.item}, 'edit');
                }
            };
        },
    };
}
