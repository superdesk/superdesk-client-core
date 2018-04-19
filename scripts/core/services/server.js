export default angular.module('superdesk.core.services.server', [])
    /**
     * @ngdoc service
     * @module superdesk.core.services
     * @name server
     *
     * @requires https://docs.angularjs.org/api/ng/service/$q $q
     * @requires https://docs.angularjs.org/api/ng/service/$http $http
     * @requires config
     *
     * @description TODO
     */
    .service('server', ['$q', '$http', 'config', function($q, $http, config) {
        return {
            _makeUrl: function() {
                var url = config.server.url;

                for (var i = 0; i < arguments.length; i++) {
                    url += '/' + arguments[i];
                }

                return url;
            },

            _wrapUrl: function(url) {
                if (config.server.url.indexOf('https') === 0) {
                    return 'https://' + url;
                }

                return 'http://' + url;
            },
            _cleanData: function(item) {
                var data = _.cloneDeep(item);
                var fields = ['_id', '_links', 'etag', 'updated', 'created'];

                _.forEach(fields, (field) => {
                    delete data[field];
                });
                return data;
            },
            _all: function(functionName, items = datas, datas) {
                var self = this;
                var resource;

                // to make it usable with createAll
                if (datas !== undefined) {
                    resource = items;
                }

                var promises = [];

                _.forEach(items, (item) => {
                    if (resource !== undefined) {
                        promises.push(self[functionName](resource, item));
                    } else {
                        promises.push(self[functionName](item));
                    }
                });

                return $q.all(promises);
            },
            _http: function(method, url, params, data) {
                var created;

                var options = {
                    method: method.toLowerCase(),
                    url: url,
                    params: params,
                    cache: false,
                };

                if (method === 'PATCH') {
                    created = data.created;
                }
                if (method === 'DELETE' || method === 'PATCH') {
                    options.headers = {'If-Match': data.etag};
                }
                if (method === 'POST' || method === 'PATCH') {
                    options.data = this._cleanData(data);
                }

                return $http(options)
                    .then((response) => {
                        let responseData = response.data;

                        if (method === 'POST') {
                            return responseData;
                        } else if (method === 'PATCH') {
                            var fields = ['_id', '_links', 'etag', 'updated'];

                            _.forEach(fields, (field) => {
                                data[field] = responseData[field];
                            });
                            data.created = created;
                            return data;
                        }

                        return responseData;
                    });
            },

            /**
             * @ngdoc method
             * @name server#createAll
             * @public
             *
             * @param {String} resource
             * @param {Array} datas
             * @return {Array} promise
             *
             * @description Create multiple items.
             */
            createAll: function(resource, datas) {
                return this._all('create', resource, datas);
            },

            /**
             * @ngdoc method
             * @name server#readAll
             * @public
             *
             * @param {Array} items
             * @return {Array} promise
             *
             * @description Read multiple items
             */
            readAll: function(items) {
                return this._all('read', items);
            },

            /**
             * @ngdoc method
             * @name server#updateAll
             * @public
             *
             * @param {Array} items
             * @return {Array} promise
             *
             * @description Update multiple items
             */
            updateAll: function(items) {
                return this._all('update', items);
            },

            /**
             * @ngdoc method
             * @name server#deleteAll
             * @public
             *
             * @param {Array} items
             * @return {Array} promise
             *
             * @description Delete multiple items
             */
            deleteAll: function(items) {
                return this._all('delete', items);
            },

            /**
             * @ngdoc method
             * @name server#create
             * @public
             *
             * @param {string} resource
             * @param {Object} data
             * @return {Object} promise
             *
             * @description Create single item
             */
            create: function(resource, data) {
                return this._http('post',
                    this._makeUrl(resource),
                    null,
                    data
                );
            },

            /**
             * @ngdoc method
             * @name server#list
             * @public
             *
             * @param {String} resource
             * @param {Object} params
             * @return {Object} promise
             *
             * @description List items
             */
            list: function(resource, params) {
                return this._http('get',
                    this._makeUrl(resource),
                    this._convertParams(params)
                );
            },

            // transfer url params to server params
            _convertParams: function(params) {
                var serverParams = _.extend({}, _.pick(params, [
                    'filter',
                    'max_results',
                    'page',
                    'embedded',
                    'where',
                    'q',
                    'df',
                ]));

                if ('sort' in params) {
                    serverParams.sort = '[(' + angular.toJson(params.sort[0]) + ','
                        + (params.sort[1] === 'asc' ? 1 : -1) + ')]';
                }

                if ('perPage' in params) {
                    serverParams.max_results = params.perPage;
                }

                if (params.search) {
                    var search = {};

                    search[params.searchField] = params.search;
                    angular.extend(serverParams.where, search);
                }

                return serverParams;
            },

            /**
             * @ngdoc method
             * @name server#read
             * @public
             *
             * @param {Object} item
             * @return {Object} promise
             *
             * @description Read single item
             */
            read: function(item) {
                return this._http('get',
                    this._wrapUrl(item._links.self.href)
                );
            },

            /**
             * @ngdoc method
             * @name server#readById
             * @public
             *
             * @param {String} resource
             * @param {String} id
             * @return {Object} promise
             *
             * @description Read single item by given id
             */
            readById: function(resource, id) {
                return this._http('get',
                    this._makeUrl(resource, id)
                );
            },

            /**
             * @ngdoc method
             * @name server#update
             * @public
             *
             * @param {Object} item
             * @param {Object} data to be updated, if not provided will send item data
             * @return {Object} promise
             *
             * @description Update single item
             */
            update: function(item, data) {
                if (data) {
                    data._id = item._id;
                    data.created = item.created;
                    data.updated = item.updated;
                    data.etag = item.etag;
                }

                return this._http('patch',
                    this._wrapUrl(item._links.self.href),
                    {},
                    item
                );
            },
            /**
             * @ngdoc method
             * @name server#delete
             * @public
             *
             * @param {Object} item
             * @return {Object} promise
             *
             * @description Delete single item
             */
            delete: function(item) {
                return this._http('delete',
                    this._wrapUrl(item._links.self.href),
                    {},
                    item
                );
            },
        };
    }]);
