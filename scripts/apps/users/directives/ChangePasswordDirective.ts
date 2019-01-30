import {gettext} from 'core/ui/components/utils';

ChangePasswordDirective.$inject = ['usersService', 'notify'];
export function ChangePasswordDirective(usersService, notify) {
    return {
        link: function(scope, element) {
            scope.$watch('user', () => {
                scope.oldPasswordInvalid = false;
            });

            /**
             * change user password
             *
             * @param {string} oldPassword
             * @param {string} newPassword
             */
            scope.changePassword = function(oldPassword, newPassword) {
                return usersService.changePassword(scope.user.username, oldPassword, newPassword)
                    .then((response) => {
                        scope.oldPasswordInvalid = false;
                        notify.success(gettext('The password has been changed.'), 3000);
                        scope.show.change_password = false;
                        // this is a workaround for change password api which updates etag on user
                        // and without updating it saving of user form fails
                        scope.user._etag = response._etag;
                    }, (response) => {
                        scope.oldPasswordInvalid = true;
                    });
            };
        },
    };
}
