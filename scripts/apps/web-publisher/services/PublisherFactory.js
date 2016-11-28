/**
 * @ngdoc service
 * @module superdesk.apps.web_publisher
 * @name publisher
 * @requires pubapi
 * @description Publisher service
 */
PublisherFactory.$inject = ['pubapi'];
export function PublisherFactory(pubapi) {

    class Publisher {

        /**
         * @ngdoc method
         * @name publisher#setTenant
         * @param {String} tenant
         * @returns Object
         * @description Change the tenant we are using the api for
         */
        setTenant(tenant) {
            pubapi.setTenant(tenant);
            return this;
        }

        /**
         * @ngdoc method
         * @name publisher#manageSite
         * @param {Object} site - site which is edited
         * @param {String} code - code of site which is edited
         * @returns {Promise}
         * @description Add or edit site
         */
        manageSite(site, code) {
            return pubapi.save('tenants', site, code);
        }

        /**
         * @ngdoc method
         * @name publisher#removeSite
         * @param {String} code - code of site which is deleted
         * @returns {Promise}
         * @description Delete site
         */
        removeSite(code) {
            return pubapi.remove('tenants', code);
        }

        /**
         * @ngdoc method
         * @name publisher#querySites
         * @returns {Promise}
         * @description Query sites
         */
        querySites() {
            return pubapi.query('tenants');
        }

        /**
         * @ngdoc method
         * @name publisher#manageRoute
         * @param {Object} route - route which is edited
         * @param {String} id - id of route which is edited
         * @returns {Promise}
         * @description Add or edit route
         */
        manageRoute(route, id) {
            return pubapi.save('content/routes', route, id);
        }

        /**
         * @ngdoc method
         * @name publisher#removeRoute
         * @param {String} id - id of route which is deleted
         * @returns {Promise}
         * @description Delete route
         */
        removeRoute(id) {
            return pubapi.remove('content/routes', id);
        }

        /**
         * @ngdoc method
         * @name publisher#queryRoutes
         * @param {String} type - which routes to query
         * @returns {Promise}
         * @description Query routes
         */
        queryRoutes(type) {
            return pubapi.query('content/routes', type);
        }

        /**
         * @ngdoc method
         * @name publisher#queryMenus
         * @returns {Promise}
         * @description Query menus
         */
        queryMenus() {
            return pubapi.query('menus');
        }
    }

    return new Publisher();
}
