var angular = require('angular');

/**
 * @ngdoc provider
 * @name apiProvider
 * @module superdesk.core.api
 * @description This provider allows registering API configuration.
 */
function APIProvider() {
    var apis = {};

    /**
     * @ngdoc method
     * @name apiProvider#api_
     * @public
     * @param {string} name
     * @param {Object} config
     * @description
     * > **WARNING** This method is actually called `api` but can not named that
     *  because of a bug in dgeni. So replace `api_` with `api` when calling.
     *
     * Register an api.
     */
    this.api = function(name, config) {
        apis[name] = config;
        return this;
    };

    /**
     * @ngdoc service
     * @name api
     * @module superdesk.core.api
     * @requires $injector
     * @requires $q
     * @requires $http
     * @requires urls
     * @requires lodash
     * @requires HttpEndpointFactory
     * @description Raw API operations.
     */
    this.$get = apiServiceFactory;

    apiServiceFactory.$inject = ['$injector', '$q', '$http', 'urls', 'lodash', 'HttpEndpointFactory'];
    function apiServiceFactory($injector, $q, $http, urls, _, HttpEndpointFactory) {
        const CACHE_TTL = 100;

        var endpoints = {
            http: HttpEndpointFactory
        };

        function isOK(response) {
            function isErrData(data) {
                return data && data._status && data._status === 'ERR';
            }

            return response.status >= 200 && response.status < 300 && !isErrData(response.data);
        }

        var cache = {};

        /**
         * Call $http once url is resolved
         *
         * Detect duplicate requests and serve these from cache.
         */
        function http(config) {
            return $q.when(config.url)
                .then((url) => {
                    config.url = url;

                    if (config.method !== 'GET') {
                        return $http(config);
                    }

                    let now = Date.now();
                    let key = config.url + angular.toJson(config.params || {});
                    let last = cache[key] || null;

                    if (last && now - last.now < CACHE_TTL) {
                        console.warn('duplicate request',
                            config.url,
                            'after', now - last.now, 'ms',
                            config.params
                        );
                        return last.promise;
                    }

                    let promise = $http(config);

                    cache[key] = {
                        now: now,
                        promise: promise
                    };

                    return promise;
                })
                .then((response) => isOK(response) ? response.data : $q.reject(response));
        }

        /**
         * Remove keys prefixed with '_'
         */
        function clean(data, keepId) {
            var blacklist = {
                    _status: 1,
                    _updated: 1,
                    _created: 1,
                    _etag: 1,
                    _links: 1,
                    _id: keepId ? 0 : 1
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
         * Get headers for given item
         */
        function getHeaders(item) {
            var headers = {};

            if (item && item._etag) {
                headers['If-Match'] = item._etag;
            }

            return headers;
        }

        /**
         * API Resource instance
         */
        function Resource(resource, parent) {
            /**
             * @ngdoc property
             * @name api#resource
             * @type {string}
             * @public
             * @description API resource
             */
            this.resource = resource;

            /**
             * @ngdoc property
             * @name api#parent
             * @public
             * @type {string}
             * @description Resource parent.
             */
            this.parent = parent;
        }

        /**
         * @ngdoc method
         * @name api#url
         * @public
         * @description
         * Get resource url.
         */
        Resource.prototype.url = function(_id) {
            function resolve(urlTemplate, data) {
                return urlTemplate.replace(/<.*>/, data._id);
            }

            return urls.resource(this.resource)
                .then(angular.bind(this, function(url) {
                    let addr = url;

                    if (this.parent) {
                        var newUrl = resolve(url, this.parent);

                        if (newUrl !== addr) {
                            return newUrl;
                        }
                    }

                    if (_id) {
                        addr = url + '/' + _id;
                    }

                    return addr;
                }));
        };

        /**
         * @ngdoc method
         * @name api#save
         * @public
         * @description
         * Save an item
         */
        Resource.prototype.save = function(item, diff, params) {
            if (diff && diff._etag) {
                item._etag = diff._etag;
            }

            return http({
                method: item._links ? 'PATCH' : 'POST',
                url: item._links ? urls.item(item._links.self.href) : this.url(),
                data: diff ? clean(diff, !item._links) : clean(item, !item._links),
                params: params,
                headers: getHeaders(item)
            }).then((data) => {
                angular.extend(item, diff || {});
                angular.extend(item, data);
                return item;
            });
        };

        /**
         * @ngdoc method
         * @name api#replace
         * @public
         * @description
         * Replace an item
         */
        Resource.prototype.replace = function(item) {
            return http({
                method: 'PUT',
                url: this.url(item._id),
                data: clean(item)
            });
        };

        /**
         * @ngdoc method
         * @name api#query
         * @public
         * @param {Object} params
         * @param {bool} cache
         * @description
         * Query resource
         */
        Resource.prototype.query = function(params, cache) {
            return http({
                method: 'GET',
                url: this.url(),
                params: params,
                cache: cache
            });
        };

        /**
         * @ngdoc method
         * @name api#getAll
         * @public
         * @param {Object} params
         * @description
         * Retrieve all items of a query
         */
        Resource.prototype.getAll = function(params) {
            function _getAll(page = 1, items = []) {
                return this.query(Object.assign({max_results: 199, page: page}, params))
                    .then((result) => {
                        let pg = page;
                        let merged = items.concat(result._items);

                        if (result._links.next) {
                            pg++;
                            // p = p.then(_getAll.call(this, pg, merged));
                            return _getAll.call(this, pg, merged);
                        } else {
                            // deferred.resolve(merged);
                            return merged;
                        }
                    });
            }
            return _getAll.call(this);
        };

        /**
         * @ngdoc method
         * @name api#getById
         * @public
         *
         * @param {String} _id
         * @param {Object} params
         * @param {bool} cache
         *
         * @description
         * Get an item by _id
         */
        Resource.prototype.getById = function(_id, params, cache) {
            return http({
                method: 'GET',
                url: this.url(_id),
                params: params,
                cache: cache
            });
        };

        /**
         * @ngdoc method
         * @name api#remove
         * @public
         *
         * @param {Object} item
         * @param {Object} params
         *
         * @description Remove an item
         */
        Resource.prototype.remove = function(item, params) {
            return http({
                method: 'DELETE',
                url: urls.item(item._links.self.href),
                params: params,
                headers: getHeaders(item)
            });
        };

        // api service
        var api = function apiService(resource, parent) {
            return new Resource(resource, parent);
        };

        /**
         * @alias api(resource).getById(id)
         */
        api.find = function apiFind(resource, id, params, cache) {
            return api(resource).getById(id, params, cache);
        };

        /**
         * @alias api(resource).save(dest, diff)
         */
        api.save = function apiSave(resource, dest, diff, parent, params) {
            return api(resource, parent).save(dest, diff, params);
        };

        /**
         * Remove a given item.
         */
        api.remove = function apiRemove(item, params, resource) {
            var url = resource ? getResourceUrl(resource, item, item._id) : urls.item(item._links.self.href);

            return http({
                method: 'DELETE',
                url: url,
                params: params,
                headers: getHeaders(item)
            });
        };

        /**
         * Update item via given resource
         *
         * @param {string} resource
         * @param {Object} item
         * @param {Object} updates
         * @param {Object} params
         */
        api.update = function apiUpdate(resource, item, updates, params) {
            return http({
                method: 'PATCH',
                url: getResourceUrl(resource, item, item._id),
                data: updates,
                params: params,
                headers: getHeaders(item)
            });
        };

        /**
         * Query qiven resource
         *
         * @param {string} resource
         * @param {Object} query
         * @param {Object} parent
         * @param {boolean} cache
         */
        api.query = function apiQuery(resource, query, parent, cache) {
            return api(resource, parent).query(query, cache);
        };

        function getResourceUrl(resource, item, id) {
            return api(resource, item).url(id);
        }

        /**
         * @ngdoc method
         * @name api#get
         * @public
         *
         * @param {string} url
         *
         * @description Get on a given url
         */
        api.get = function apiGet(url, params) {
            return http({
                method: 'GET',
                url: urls.item(url),
                params: params
            });
        };

        api.getAll = function apiGetAll(resource, params) {
            return api(resource).getAll(params);
        };

        angular.forEach(apis, (config, apiName) => {
            var service = config.service || _.noop;

            service.prototype = new endpoints[config.type](apiName, config.backend);
            api[apiName] = $injector.instantiate(service, {resource: service.prototype});
        });

        return api;
    }
}

angular.module('superdesk.core.api.service', [])
    .provider('api', APIProvider);
