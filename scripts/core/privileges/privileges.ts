PrivilegesService.$inject = ['$rootScope', 'preferencesService'];
function PrivilegesService($rootScope, preferencesService) {
    var _privileges = {};

    this.privileges = _privileges;
    $rootScope.privileges = _privileges;

    /**
     * Check if current user has given privileges
     *
     * @param {Object} privileges
     */
    this.userHasPrivileges = function userHasPrivileges(privileges) {
        for (var privilege in privileges) {
            if (privileges[privilege] && !_privileges[privilege]) {
                return false;
            }
        }

        return true;
    };

    /**
     * Set current user privileges
     *
     * @param {Object} privileges
     */
    this.setUserPrivileges = function setUserPrivileges(privileges) {
        for (var privilege in privileges) {
            if (privileges[privilege]) {
                _privileges[privilege] = 1;
            } else {
                _privileges[privilege] = 0;
            }
        }

        return _privileges;
    };

    // start loading when used for first time
    this.loaded = preferencesService.getPrivileges().then(this.setUserPrivileges);
}

/**
 * @ngdoc module
 * @module superdesk.core.privileges
 * @name superdesk.core.privileges
 * @packageName superdesk.core
 * @description Superdesk privileges enables and helps manage user privileges.
 */
angular.module('superdesk.core.privileges', ['superdesk.core.preferences'])
    .service('privileges', PrivilegesService);
