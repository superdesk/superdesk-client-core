import handleError from '../helpers';

/**
 * @memberof superdesk.apps.users
 * @ngdoc directive
 * @name sdUserPrivileges
 * @description
 *   This directive creates the Privileges tab on the user profile
 *   panel, allowing users to set various system preferences for
 *   themselves.
 */
UserPrivilegesDirective.$inject = ['api', 'gettext', 'notify', 'userList', '$q'];
export function UserPrivilegesDirective(api, gettext, notify, userList, $q) {
    return {
        scope: {
            user: '='
        },
        templateUrl: 'scripts/apps/users/views/user-privileges.html',
        link: function(scope) {

            getUser()
                .then(getPrivileges)
                .then(getUserRole);

            function getUser() {
                return userList.getUser(scope.user._id, true).then(function(u) {
                    scope.user = u;
                    // the last user privileges that were saved on the server
                    scope.origPrivileges = angular.copy(scope.user.privileges);
                }, function(error) {
                    notify.error(gettext('User not found.'));
                    console.log(error);
                    return $q.reject(error);
                });
            }

            function getPrivileges() {
                return api('privileges').query().then(function(result) {
                    scope.privileges = result._items;
                }, function(error) {
                    notify.error(gettext('Privileges not found.'));
                    console.log(error);
                    return $q.reject(error);
                });
            }

            function getUserRole() {
                return api('roles').getById(scope.user.role).then(function(role) {
                    scope.role = role;
                }, function(error) {
                    notify.error(gettext('User role not found.'));
                    console.log(error);
                    return $q.reject(error);
                });
            }

            /**
            * Saves selected user privileges on the server and marks
            * the corresponding HTML form as $pristine.
            *
            * @method save
            */
            scope.save = function () {
                api.save(
                    'users',
                    scope.user,
                    _.pick(scope.user, 'privileges')
                )
                .then(function () {
                    scope.origPrivileges = angular.copy(
                        scope.user.privileges);
                    scope.userPrivileges.$setPristine();
                    notify.success(gettext('Privileges updated.'));
                }, function (response) {
                    notify.error(
                        gettext(handleError(response)));
                });
            };

            /**
            * Reverts all changes to user privileges settings since the
            * time they were last saved, and marks the corresponding
            * HTML form as $pristine.
            *
            * @method cancel
            */
            scope.cancel = function () {
                scope.user.privileges = angular.copy(
                    scope.origPrivileges);

                scope.userPrivileges.$setPristine();
            };
        }
    };
}
