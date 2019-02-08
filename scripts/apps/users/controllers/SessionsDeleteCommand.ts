import {gettext} from 'core/utils';

/*
 * Delete sessions of a user
 */
SessionsDeleteCommand.$inject = ['api', 'data', '$q', 'notify', '$rootScope'];
export function SessionsDeleteCommand(api, data, $q, notify, $rootScope) {
    var user = data.item;

    api.remove(user, {}, 'clear_sessions')
        .then(() => {
            user.session_preferences = {};
            notify.success(gettext('Sessions cleared'));
        }, (response) => {
            notify.error(gettext('Error. Sessions could not be cleared.'));
        });
}
