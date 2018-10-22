UserListItemDirective.$inject = ['asset'];
export function UserListItemDirective(asset) {
    return {
        templateUrl: asset.templateUrl('apps/users/views/user-list-item.html'),
    };
}
