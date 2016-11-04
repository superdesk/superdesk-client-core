
PubAPIFactory.$inject = ['config', '$http', '$q'];
export function PubAPIFactory(config, $http, $q) {

    function urljoin() {
        return Array.prototype.map.call(arguments, piece => {
            return piece.replace(/\/$/, '').replace(/^\//, '');
        }).join('/');
    }

    /**
     * Publisher API service
     */
    class PubAPI {

        constructor() {
            let pubConfig = config.publisher || {};
            this._server = pubConfig.server || '';
            this._base = pubConfig.base || '';
            this._protocol = pubConfig.protocol || 'http';
            this._tenant = pubConfig.tenant || 'default';
            this._domain = pubConfig.domain || '';
        }

        /**
         * Change the tenant we are using the api for
         *
         * @param {string} tenant
         * @return void
         */
        setTenant(tenant) {
            this._tenant = tenant;
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
         * @param {string} code
         * @return {Promise}
         */
        save(resource, item, code) {
            return this.req({
                url: this.resourceURL(resource, code),
                method: code ? 'PATCH' : 'POST',
                data: item
            }).then(response => {
                angular.extend(item, response);
                return response;
            });
        }

        /**
         * Remove an item
         *
         * @param {string} resource
         * @param {string} code
         * @return {Promise}
         */
        remove(resource, code) {
            return this.req({
                url: this.resourceURL(resource, code),
                method: 'DELETE'
            });
        }

        /**
         * Get resource url
         *
         * @param {string} resource
         * @param {string} code
         * @return {string}
         */
        resourceURL(resource, code='') {
            return `${this._protocol}://${this._tenant}.${this._domain}/${this._base}/${resource}/${code}`
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
