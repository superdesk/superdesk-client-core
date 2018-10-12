ResetPasswordDirective.$inject = ['usersService', 'notify', 'gettext'];
export function ResetPasswordDirective(usersService, notify, gettext) {
    return {
        link: function(scope, element) {
            scope.$watch('user', () => {
                scope.oldPasswordInvalid = false;
            });

            /**
             * reset user password
             */
            scope.resetPassword = function() {
                return usersService.resetPassword(scope.user)
                    .then((response) => {
                        scope.oldPasswordInvalid = false;
                        notify.success(gettext('The password has been reset.'), 3000);
                        scope.show.reset_password = false;
                    }, (response) => {
                        scope.oldPasswordInvalid = true;
                    });
            };
        },
    };
}
