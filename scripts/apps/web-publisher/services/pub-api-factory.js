
PubAPIFactory.$inject = ['config', '$http', '$q'];
export function PubAPIFactory(config, $http, $q) {

    function urljoin() {
        return Array.prototype.map.call(arguments, piece => {
            return piece.replace(/\/$/, '').replace(/^\//, '');
        }).join('/') + '/';
    }

    /**
     * Publisher API service
     */
    class PubAPI {

        constructor() {
            let pubConfig = config.publisher || {};
            this._server = pubConfig.server || '';
            this._base = pubConfig.base || '';
        }

        /**
         * Query resource
         *
         * @param {string} resource
         * @param {Object} params
         * @return {Promise}
         */
        query(resource, params) {
            return this.req({
                url: this.resourceURL(resource),
                method: 'GET',
                params: params
            }).then(response => {
                return response._embedded._items;
            });
        }

        /**
         * Save an item
         *
         * @param {string} resource
         * @param {Object} item
         * @param {Object} updates
         * @return {Promise}
         */
        save(resource, item, updates) {
            return this.req({
                url: item.id ? this.selfURL(item) : this.resourceURL(resource),
                method: item.id ? 'PATCH' : 'POST',
                data: updates || item
            }).then(response => {
                angular.extend(item, response);
                return response;
            });
        }

        /**
         * Get resource url
         *
         * @param {string} resource
         * @return {string}
         */
        resourceURL(resource) {
            return urljoin(this._server, this._base, resource);
        }

        /**
         * Get item self url
         *
         * @param {Object} item
         * @return {string}
         */
        selfURL(item) {
            return urljoin(this._server, item._links.self.href);
        }

        /**
         * API Request
         *
         * Adds basic error reporting, eventually authentication etc
         *
         * @param {Object} config
         * @return {Promise}
         */
        req(config) {
            return $http(config).then(response => {
                if (response.status >= 200 && response.status < 300) {
                    return response.data;
                } else {
                    console.error('publisher api error', response);
                    return $q.reject(response);
                }
            });
        }
    }

    return new PubAPI();
}
