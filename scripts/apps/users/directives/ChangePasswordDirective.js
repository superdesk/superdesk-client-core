ChangePasswordDirective.$inject = ['usersService', 'notify', 'gettext'];
export function ChangePasswordDirective(usersService, notify, gettext) {
    return {
        link: function(scope, element) {
            scope.$watch('user', function() {
                scope.oldPasswordInvalid = false;
            });

            /**
             * change user password
             *
             * @param {string} oldPassword
             * @param {string} newPassword
             */
            scope.changePassword = function(oldPassword, newPassword) {
                return usersService.changePassword(scope.user, oldPassword, newPassword)
                    .then(function(response) {
                        scope.oldPasswordInvalid = false;
                        notify.success(gettext('The password has been changed.'), 3000);
                        scope.show.change_password = false;
                    }, function(response) {
                        scope.oldPasswordInvalid = true;
                    });
            };
        }
    };
}
