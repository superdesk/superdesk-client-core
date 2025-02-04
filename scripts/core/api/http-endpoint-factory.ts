/**
 * @ngdoc factory
 * @name HttpEndpointFactory
 * @module superdesk.core.api
 * @description Http endpoint factory
 */
HttpEndpointFactory.$inject = ['$http', '$q', 'urls', 'lodash'];
function HttpEndpointFactory($http, $q, urls, _) {
    /**
     * @ngdoc method
     * @name HttpEndpointFactory#getUrl
     * @private
     *
     * @param {Object} resource
     * @returns {Promise}
     *
     * @description Get url for given resource
     */
    function getUrl(resource) {
        return urls.resource(resource.rel);
    }

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#getHeaders
     * @private
     *
     * @param {Object} resource
     * @param {Object} item
     * @returns {Object}
     *
     * @description Get headers for given resource
     */
    function getHeaders(resource, item?) {
        var headers = _.extend({}, resource.config.headers || {});

        if (item && item._etag) {
            headers['If-Match'] = item._etag;
        }
        return headers;
    }

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#http
     * @private
     *
     * @param {Object} config
     * @returns {Promise}
     *
     * @description Wrap $http call
     */
    function http(config) {
        return $q.when(config.url)
            .then((url) => {
                config.url = url;
                return $http(config);
            })
            .then((response) => {
                if (response.status >= 200 && response.status < 300 &&
                (!response.data || !response.data._status || response.data._status !== 'ERR')) {
                    return response;
                }

                return $q.reject(response);
            });
    }

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#clean
     * @private
     * @description
     * Remove keys prefixed with '_'
     */
    function clean(data, keepId) {
        var blacklist = {
                _status: 1,
                _updated: 1,
                _created: 1,
                _etag: 1,
                _links: 1,
                _id: keepId ? 0 : 1,
            },
            cleanData = {};

        angular.forEach(data, (val, key) => {
            if (!blacklist[key]) {
                cleanData[key] = val;
            }
        });

        return cleanData;
    }

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#HttpEndpoint
     * @private
     * @description
     * Http Endpoint
     */
    function HttpEndpoint(name, config) {
        this.name = name;
        this.config = config;
        this.rel = config.rel;
    }

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#getByUrl
     * @public
     *
     * @param {string} url
     * @returns {Promise}
     *
     * @description
     * Get entity by url
     */
    HttpEndpoint.prototype.getByUrl = function(url, cache) {
        return http({
            method: 'GET',
            url: urls.item(url),
            cache: cache,
        }).then((response) => response.data);
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#getById
     * @public
     *
     * @param {string} id
     * @returns {Promise}
     *
     * @description
     * Get entity by given id
     */
    HttpEndpoint.prototype.getById = function(id, params, cache) {
        return getUrl(this).then(_.bind((resourceUrl) => {
            var url = resourceUrl.replace(/\/+$/, '') + '/' + id;

            return http({
                method: 'GET',
                url: url,
                params: params,
                cache: cache,
            }).then((response) => response.data);
        }, this));
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#query
     * @public
     *
     * @param {Object} params
     *
     * @description
     * Resource query method
     */
    HttpEndpoint.prototype.query = function(params, cache) {
        return http({
            method: 'GET',
            params: params,
            url: getUrl(this),
            headers: getHeaders(this),
            cache: cache,
        }).then((response) => response.data);
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#update
     * @public
     *
     * @param {Object} item
     * @param {Object} diff
     * @param {Object} params
     * @returns {Promise}
     *
     * @description
     * Update item
     */
    HttpEndpoint.prototype.update = function(item, diff, params) {
        let diff2 = diff || angular.extend({}, item);

        if (diff2._etag) {
            item._etag = diff2._etag;
        }

        var url = item._links.self.href;

        return http({
            method: 'PATCH',
            url: urls.item(url),
            data: clean(diff2, !item._links),
            params: params,
            headers: getHeaders(this, item),
        }).then((response) => {
            _.extend(item, response.data);
            return item;
        });
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#create
     * @public
     *
     * @param {Object} itemData
     * @returns {Promise}
     *
     * @description
     * Create new item
     */
    HttpEndpoint.prototype.create = function(itemData) {
        return http({
            method: 'POST',
            url: getUrl(this),
            data: itemData,
            headers: getHeaders(this),
        }).then((response) => {
            delete response.data._status;
            _.extend(itemData, response.data);
            return itemData;
        });
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#save
     * @public
     *
     * @param {Object} item
     * @param {Object} diff
     * @returns {Promise}
     *
     * @description
     * Save item
     */
    HttpEndpoint.prototype.save = function(item, diff) {
        return item._id ? this.update(item, diff) : this.create(_.extend(item, diff));
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#replace
     * @public
     *
     * @param {Object} dest
     * @param {Object} item
     * @returns {Promise}
     *
     * @description
     * Replace item
     */
    HttpEndpoint.prototype.replace = function(dest, item) {
        return http({
            method: 'PUT',
            url: urls.item(dest),
            data: item,
            headers: getHeaders(this, item),
        }).then((response) => {
            _.extend(item, response.data);
            return item;
        });
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#remove
     * @public
     *
     * @param {Object} item
     * @returns {Promise}
     *
     * @description
     * Remove item
     */
    HttpEndpoint.prototype.remove = function(item) {
        return http({
            method: 'DELETE',
            url: urls.item(item._links.self.href),
            headers: getHeaders(this, item),
        }).then(null, (response) => response.status === 404 ? $q.when(response) : $q.reject(response));
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#getUrl
     * @public
     *
     * @returns {Promise}
     *
     * @description
     * Get resource url
     */
    HttpEndpoint.prototype.getUrl = function() {
        return getUrl(this);
    };

    /**
     * @ngdoc method
     * @name HttpEndpointFactory#getHeaders
     * @public
     *
     * @return {Object}
     *
     * @description
     * Get headers
     */
    HttpEndpoint.prototype.getHeaders = function() {
        return getHeaders(this) || {};
    };

    return HttpEndpoint;
}

angular.module('superdesk.core.api.http', [])
    .factory('HttpEndpointFactory', HttpEndpointFactory);
