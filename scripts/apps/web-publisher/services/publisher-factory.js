
PublisherFactory.$inject = ['pubapi'];
export function PublisherFactory(pubapi) {

    class Publisher {

        /**
         * Create new site
         *
         * @param {Object} site
         * @return {Promise}
         */
        createSite(site) {
            return pubapi.save('tenants', site);
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
