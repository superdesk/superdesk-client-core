UserListItemDirective.$inject = ['asset'];
export function UserListItemDirective(asset) {
    return {
        templateUrl: asset.templateUrl('superdesk-users/views/user-list-item.html')
    };
}
