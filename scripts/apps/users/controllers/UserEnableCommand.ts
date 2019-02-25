import {gettext} from 'core/utils';

/**
 * Enable user
 */
UserEnableCommand.$inject = ['api', 'data', '$q', 'notify', 'usersService', '$rootScope'];
export function UserEnableCommand(api, data, $q, notify, usersService, $rootScope) {
    var user = data.item;

    return usersService.save(user, {is_enabled: true, is_active: true}).then(
        (response) => {
            $rootScope.$broadcast('user:updated', response);
        },
        (response) => {
            if (angular.isDefined(response.data._issues) &&
                angular.isDefined(response.data._issues['validator exception'])) {
                notify.error(gettext('Error: ' + response.data._issues['validator exception']));
            } else if (angular.isDefined(response.data._message)) {
                notify.error(gettext('Error: ' + response.data._message));
            } else {
                notify.error(gettext('Error. User Profile cannot be enabled.'));
            }
        },
    );
}
