import _ from 'lodash';

UserRoleItemListDirective.$inject = ['desks', 'usersService'];
export function UserRoleItemListDirective(desks, usersService) {
    return {
        templateUrl: 'scripts/apps/desks/views/user-role-items.html',
        scope: {
            role: '=',
            desk: '=',
            total: '=',
            online: '=',
            privilege: '=',
        },
        link: function(scope, elem) {
            scope.users = desks.deskMembers[scope.desk];
            scope.total = 0;
            scope.items = [];
            scope.user = null;
            _.each(scope.users, (user, index) => {
                if (scope.role === user.role) {
                    scope.items.push(user);
                    scope.total = scope.total + 1;
                }
            });

            scope.openEditUser = function(user) {
                scope.user = user;
            };

            scope.closeEditUser = function() {
                scope.user = null;
            };
        },
    };
}
