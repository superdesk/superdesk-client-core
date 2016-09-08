ActivityDirective.$inject = ['asset'];
export function ActivityDirective(asset) {
    return {
        templateUrl: asset.templateUrl('superdesk-users/views/activity-list.html')
    };
}
