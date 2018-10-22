export default angular.module('superdesk.core.directives.permissions', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdPermissions
     *
     * @param {Object} dataModel Model to assign permission to
     * @param {String} dataPermission ID of required permission.
     * @param {Object} dataRole Role to check.
     * @param {Object} dataUser User to check.
     *
     * @description Checks if user has specified permissions and assigns
     * to specified model to use in displaying/hiding/disabling elements.
     *
     * Checking for a user:
     * ```js
     * <div sd-permissions data-permission="users-manage" data-user="user" data-model="model" ng-show="model"></div>
     * ```
     *
     * Checking for a role:
     * ```js
     * <div sd-permissions data-permission="users-manage" data-role="role" data-model="model" ng-show="model"></div>
     * ```
     *
     * Checking for current user (default if no user/role specified):
     * ```js
     * <div sd-permissions data-permission="users-manage" data-model="model" ng-show="model"></div>
     * ```
     */
    .directive('sdPermissions', ['permissions', 'permissionsService', function(permissions, permissionsService) {
        return {
            scope: {
                model: '=',
                permission: '@',
                role: '=',
                user: '=',
            },
            link: function(scope, element, attrs) {
                scope.model = false;
                if (permissions[scope.permission]) {
                    var requiredPermissions = permissions[scope.permission].permissions;

                    if (scope.role) {
                        scope.model = permissionsService.isRoleAllowed(requiredPermissions, scope.role);
                    } else if (scope.user) {
                        permissionsService.isUserAllowed(requiredPermissions, scope.user).then((result) => {
                            scope.model = result;
                        });
                    } else {
                        permissionsService.isUserAllowed(requiredPermissions).then((result) => {
                            scope.model = result;
                        });
                    }
                }
            },
        };
    }]);
