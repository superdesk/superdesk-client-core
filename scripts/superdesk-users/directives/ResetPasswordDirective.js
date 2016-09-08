ResetPasswordDirective.$inject = ['usersService', 'notify', 'gettext'];
export function ResetPasswordDirective(usersService, notify, gettext) {
    return {
        link: function(scope, element) {
            scope.$watch('user', function() {
                scope.oldPasswordInvalid = false;
            });

            /**
             * reset user password
             */
            scope.resetPassword = function() {
                return usersService.resetPassword(scope.user)
                    .then(function(response) {
                        scope.oldPasswordInvalid = false;
                        notify.success(gettext('The password has been reset.'), 3000);
                        scope.show.reset_password = false;
                    }, function(response) {
                        scope.oldPasswordInvalid = true;
                    });
            };
        }
    };
}
