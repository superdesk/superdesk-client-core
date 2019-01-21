import {gettext} from 'core/ui/components/utils';

/**
 * Disable user
 */
UserDeleteCommand.$inject = ['api', 'data', '$q', 'notify', '$rootScope'];
export function UserDeleteCommand(api, data, $q, notify, $rootScope) {
    var user = data.item;

    return api.users.remove(user).then(
        (response) => api.users.getById(user._id)
            .then((newUser) => {
                user = angular.extend(user, newUser);
                $rootScope.$broadcast('user:updated', user);
                return user;
            }),
        (response) => {
            if (angular.isDefined(response.data._issues) &&
                angular.isDefined(response.data._issues['validator exception'])) {
                notify.error(gettext('Error: ' + response.data._issues['validator exception']));
            } else if (angular.isDefined(response.data._message)) {
                notify.error(gettext('Error: ' + response.data._message));
            } else {
                notify.error(gettext('Error. User Profile cannot be disabled.'));
            }
        },
    );
}
