/**
 * @ngdoc service
 * @module superdesk.apps.web_publisher
 * @name pubapi
 *
 * @requires config
 * @requires https://docs.angularjs.org/api/ng/service/$http $http
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 *
 * @description Publisher API service
 */
PubAPIFactory.$inject = ['config', '$http', '$q'];
export function PubAPIFactory(config, $http, $q) {

    const DEFAULT_TENANT = 'default';

    class PubAPI {

        constructor() {
            let pubConfig = config.publisher || {};
            this._base = pubConfig.base || '';
            this._protocol = pubConfig.protocol || 'http';
            this._domain = pubConfig.domain || '';
            this.setTenant(pubConfig.tenant || DEFAULT_TENANT);
        }

        /**
         * @ngdoc method
         * @name pubapi#setTenant
         * @param {String} tenant
         * @description Change the tenant we are using the api for
         */
        setTenant(tenant) {
            //the default tenant may not be configured.
            if (tenant === DEFAULT_TENANT) {
                tenant = '';
            }
            this._tenant = tenant;
            this._server = this.buildServerURL();
        }

        /**
         * @ngdoc method
         * @name pubapi#buildServerURL
         * @returns {String}
         * @description Builds base server URL of the site.
         */
        buildServerURL() {
            let subdomain = this._tenant === '' ? '' : `${this._tenant}.`;
            return `${this._protocol}://${subdomain}${this._domain}`;
        }

        /**
         * @ngdoc method
         * @name pubapi#query
         * @param {String} resource
         * @param {Object} params
         * @returns {Promise}
         * @description Query resource
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
         * @ngdoc method
         * @name pubapi#get
         * @param {String} resource
         * @param {Number} id
         * @returns {Promise}
         * @description GET a given resource by id.
         */
        get(resource, id) {
            return this.req({
                url: this.resourceURL(resource, id),
                method: 'GET'
            }).then(response => {
                return response;
            });
        }

        /**
         * @ngdoc method
         * @name pubapi#save
         * @param {String} resource
         * @param {Object} item - item which is saved
         * @param {String} id - id of item which is saved
         * @returns {Promise}
         * @description Save an item
         */
        save(resource, item, id) {
            return this.req({
                url: this.resourceURL(resource, id),
                method: id ? 'PATCH' : 'POST',
                data: item
            }).then(response => {
                angular.extend(item, response);
                return response;
            });
        }

        /**
         * @ngdoc method
         * @name pubapi#remove
         * @param {String} resource
         * @param {String} id - id of item which is deleted
         * @returns {Promise}
         * @description Remove an item
         */
        remove(resource, id) {
            return this.req({
                url: this.resourceURL(resource, id),
                method: 'DELETE'
            });
        }

        /**
         * @ngdoc method
         * @name pubapi#resourceURL
         * @param {String} resource
         * @param {String} code - code of site
         * @returns {String}
         * @description Get resource url
         */
        resourceURL(resource, code = '') {
            return `${this._server}/${this._base}/${resource}/${code}`;
        }

        /**
        * @ngdoc method
        * @name pubapi#req
        * @param {Object} config
        * @returns {Promise}
        * @description API Request - Adds basic error reporting, eventually authentication
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
