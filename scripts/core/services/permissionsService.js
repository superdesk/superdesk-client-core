import _ from 'lodash';

/**
 * @ngdoc service
 * @module superdesk.core.services
 * @name permissionsService
 *
 * @description
 * #### Permissions service
 *
 * Permissions service checks if a given user or role is able to perform given actions.
 *
 * Usage:
 *
 * Checking user/permissions:
 *
 * ```js
 * permissionsService.isUserAllowed(permissions, user);
 * ```
 *
 * Params:
 *
 * {Object} permissions - permissions object in {resource: {action: true/false, ...}, ...}
 * format.
 *
 * {Object} user - user object as returned from server.
 *
 * If no user is given, current logged in user will be assumed.
 *
 * Checking role/permissions:
 *
 * ```js
 * permissionsService.isRoleAllowed(permissions, role);
 * ```
 *
 * {Object} permissions - permissions object in {resource: {action: true/false, ...}, ...}
 * format.
 *
 * {Object} role - role object as returned from server.
 */
export default angular.module('superdesk.core.services.permissions', [])
    .service('permissionsService', ['$q', '$rootScope', 'em', function($q, $rootScope, em) {
        this.isUserAllowed = function(permissions, user) {
            var self = this;
            var delay = $q.defer();
            var usr = user || $rootScope.currentUser;

            if (usr.role) {
                if (typeof usr.role === 'string') {
                    em.repository('user_roles')
                        .find(usr.role)
                        .then((role) => {
                            delay.resolve(self.isRoleAllowed(permissions, role));
                        });
                } else {
                    delay.resolve(this.isRoleAllowed(permissions, usr.role));
                }
            } else {
                delay.resolve(false);
            }

            return delay.promise;
        };

        this._isRoleAllowedSingle = function(resource, method, role) {
            var self = this;

            var delay = $q.defer();

            if (role.permissions && role.permissions[resource] && role.permissions[resource][method]) {
                delay.resolve(true);
            } else if (role.extends) {
                em.repository('user_roles')
                    .find(role.extends)
                    .then((extendedFrom) => {
                        delay.resolve(self._isRoleAllowedSingle(resource, method, extendedFrom));
                    });
            }

            return delay.promise;
        };

        this.isRoleAllowed = function(permissions, role) {
            var self = this;

            var delay = $q.defer();

            var promises = [];

            _.forEach(permissions, (methods, resource) => {
                _.forEach(methods, (status, method) => {
                    promises.push(self._isRoleAllowedSingle(resource, method, role));
                });
            });

            $q.all(promises).then((results) => {
                if (results.indexOf(false) === -1) {
                    delay.resolve(true);
                } else {
                    delay.resolve(false);
                }
            });

            return delay.promise;
        };
    }]);
