ActivityDirective.$inject = ['asset'];
export function ActivityDirective(asset) {
    return {
        templateUrl: asset.templateUrl('apps/users/views/activity-list.html'),
    };
}
