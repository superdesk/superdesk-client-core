import {gettext} from 'core/utils';

/**
 * Resolve a user by route id and redirect to /users if such user does not exist
 */
UserResolver.$inject = ['api', '$route', 'notify', '$location'];
export function UserResolver(api, $route, notify, $location) {
    return api.users.getById($route.current.params._id)
        .then(null, (response) => {
            if (response.status === 404) {
                $location.path('/users/');
                notify.error(gettext('User was not found, sorry.'), 5000);
            }

            return response;
        });
}
