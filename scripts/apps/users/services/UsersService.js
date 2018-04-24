/**
 * Bussiness logic layer, should be used instead of resource
 */
UsersService.$inject = ['api', '$q', 'notify'];
export function UsersService(api, $q, notify) {
    var usersService = {};

    usersService.usernamePattern = /^[A-Za-z0-9_.'-]+$/;
    usersService.phonePattern = /^(?:(?:0?[1-9][0-9]{8})|(?:(?:\+|00)[1-9][0-9]{9,11}))$/;
    usersService.signOffPattern = /^[a-zA-Z0-9]+$/;

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
     * @param {Object} user
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise}
     */
    usersService.changePassword = function changePassword(user, oldPassword, newPassword) {
        return api.changePassword.create({
            username: user.username,
            old_password: oldPassword,
            new_password: newPassword
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
     * Toggle user status
     */
    usersService.toggleStatus = function toggleStatus(user, active) {
        return this.save(user, {is_active: active});
    };

    /**
     * Checks if the user is logged-in or not
     */
    usersService.isLoggedIn = function(user) {
        return user && _.size(user.session_preferences) > 0;
    };

    return usersService;
}
