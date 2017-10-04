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
PubAPIFactory.$inject = ['config', '$http', '$q', 'session', '$location'];
export function PubAPIFactory(config, $http, $q, session, $location) {
    class PubAPI {
        constructor() {
            let pubConfig = config.publisher || {};

            this._base = pubConfig.base || '';
            this._protocol = pubConfig.protocol || $location.protocol();
            this._domain = pubConfig.domain || '';
            this._tenant = pubConfig.tenant || '';
            this.setTenant();
        }

        /**
         * @ngdoc method
         * @name pubapi#setToken
         * @returns {Promise}
         * @description Sets token
         */
        setToken() {
            return this.save('auth/superdesk', {auth_superdesk: {session_id: session.sessionId, token: session.token}})
                .then((response) => {
                    this._token = response.token.api_key;
                    return response;
                });
        }

        /**
         * @ngdoc method
         * @name pubapi#setTenant
         * @param {String} site
         * @description Change the tenant we are using the api for
         */
        setTenant(site) {
            let subdomain = this._tenant ? `${this._tenant}.` : '';
            let domainName = this._domain;

            if (site) {
                if (site.subdomain) {
                    subdomain = `${site.subdomain}.`;
                }
                if (site.domainName) {
                    domainName = site.domainName;
                }
            }

            this._server = `${this._protocol}://${subdomain}${domainName}`;
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
            }).then((response) => response._embedded._items);
        }

        /**
         * @ngdoc method
         * @name pubapi#query
         * @param {String} resource
         * @param {Object} params
         * @returns {Promise}
         * @description Query resource
         */
        queryWithDetails(resource, params) {
            return this.req({
                url: this.resourceURL(resource),
                method: 'GET',
                params: params
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
                data: item,
                add_format: 'json'
            }).then((response) => {
                if (item) {
                    angular.extend(item, response);
                }

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
        patch(resource, item) {
            return this.req({
                url: this.resourceURL(resource),
                method: 'PATCH',
                data: item
            }).then((response) => {
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
         * @param {String} id
         * @returns {String}
         * @description Get resource url
         */
        resourceURL(resource, id = '') {
            return `${this._server}/${this._base}/${resource}/${id}`;
        }

        /**
        * @ngdoc method
        * @name pubapi#req
        * @param {Object} config
        * @returns {Promise}
        * @description API Request - Adds basic error reporting
        */
        req(config) {
            config.headers = {Authorization: 'Basic ' + this._token};
            return $http(config).then((response) => {
                if (response.status >= 200 && response.status < 300) {
                    return response.data;
                }

                console.error('publisher api error', response);
                return $q.reject(response);
            });
        }
    }

    return new PubAPI();
}
