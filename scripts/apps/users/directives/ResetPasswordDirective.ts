import {gettext} from 'core/ui/components/utils';

ResetPasswordDirective.$inject = ['usersService', 'notify'];
export function ResetPasswordDirective(usersService, notify) {
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
