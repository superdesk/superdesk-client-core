
PublisherFactory.$inject = ['pubapi'];
export function PublisherFactory(pubapi) {

    class Publisher {

        /**
         * Change the tenant we are using the api for
         *
         * @param {string} tenant
         * @return this
         */
        setTenant(tenant) {
            pubapi.setTenant(tenant);
            return this;
        }

        /**
         * Create new site
         *
         * @param {Object} site
         * @param {string} code
         * @return {Promise}
         */
        createSite(site, code) {
            return pubapi.save('tenants', site, code);
        }

        /**
         * Delete site
         *
         * @param {string} code
         * @return {Promise}
         */
        removeSite(code) {
            return pubapi.remove('tenants', code);
        }

        /**
         * Query sites
         *
         * @param {Object} params
         * @return {Promise}
         */
        querySites(params) {
            return pubapi.query('tenants', params);
        }

        /**
         * Query menus
         *
         * @param {Object} params
         * @return {Promise}
         */
        queryMenus(params) {
            return pubapi.query('menus', params);
        }
    }

    return new Publisher();
}
