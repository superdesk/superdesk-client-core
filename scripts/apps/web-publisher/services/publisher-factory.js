
PublisherFactory.$inject = ['pubapi'];
export function PublisherFactory(pubapi) {

    class Publisher {

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
    }

    return new Publisher();
}
