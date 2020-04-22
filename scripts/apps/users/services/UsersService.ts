import _ from 'lodash';
import {IUser} from 'superdesk-api';

export function isUserLoggedIn(user: IUser) {
    return user?.session_preferences != null && Object.keys(user.session_preferences).length > 0;
}

/**
 * Bussiness logic layer, should be used instead of resource
 */
UsersService.$inject = ['api', '$q', 'notify'];
export function UsersService(api, $q, notify) {
    var usersService: any = {};

    usersService.usernamePattern = /^[A-Za-z0-9_.'-]+$/;
    usersService.phonePattern = /^(?:(?:0?[1-9][0-9]{8})|(?:(?:\+|00)[1-9][0-9]{9,11}))$/;
    usersService.signOffPattern = /^[a-zA-Z0-9]+$/;
    usersService.twitterPattern = /^@([A-Za-z0-9_]{1,15}$)/;

    /**
     * Save user with given data
     *
     * @param {Object} user
     * @param {Object} data
     * @returns {Promise}
     */
    usersService.save = function save(user, data) {
        return api.save('users', user, data).then((result) => {
            _.assign(user, result);
            return result;
        });
    };

    /**
     * Change user password
     *
     * @param {string} username
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise}
     */
    usersService.changePassword = function changePassword(username, oldPassword, newPassword) {
        return api.changePassword.create({
            username: username,
            old_password: oldPassword,
            new_password: newPassword,
        });
    };

    /**
     * Reset reset password
     *
     * @param {Object} user
     * @returns {Promise}
     */
    usersService.resetPassword = function resetPassword(user) {
        return api.resetPassword.create({email: user.email});
    };

    /**
     * Test if user is active
     */
    usersService.isActive = function isActive(user) {
        return user && user.is_active;
    };

    /**
     * Test if user is on pending state
     */
    usersService.isPending = function isPending(user) {
        return user && user.needs_activation;
    };

    /**
     * Test if user is of type support
     */
    usersService.isSupport = function isSupport(user) {
        return user && user.is_support;
    };

    /**
     * Toggle user status
     */
    usersService.toggleStatus = function toggleStatus(user, active) {
        return this.save(user, {is_active: active});
    };

    /**
     * Checks if the user is logged-in or not
     */
    usersService.isLoggedIn = function(user) {
        return isUserLoggedIn(user);
    };

    return usersService;
}
