import _ from 'lodash';

export default angular.module('superdesk.core.services.entity', [])
    /**
     * @ngdoc service
     * @module superdesk.core.services
     * @name locationParams
     *
     * @requires https://docs.angularjs.org/api/ng/service/$location $location
     * @requires https://docs.angularjs.org/api/ng/service/$route $route
     *
     * @description Location Params service holds default params for given page
     * and combines those with current params.
     */
    .service('locationParams', ['$location', '$route', function($location, $route) {
        return {
            defaults: {},

            /**
             * @ngdoc method
             * @name locationParams#query
             * @public
             * @return {Object} defaults + current
             *
             * @param {Object} defaults
             *
             * @description Set default params
             */
            reset: function(defaults) {
                this.defaults = _.extend(defaults, {page: 1});
                this.params = _.extend({}, this.defaults, $route.current.params);
                return this.params;
            },

            /**
             * @ngdoc method
             * @name locationParams#get
             * @public
             *
             * @param {string} key
             * @return {Object|null}
             *
             * @description Get parameter
             */
            get: function(key) {
                return this.params && this.params[key] ? this.params[key] : null;
            },

            /**
             * @ngdoc method
             * @name locationParams#set
             * @public
             * @return {Object} locationParams
             *
             * @param {string} key
             * @param {mixed} val
             *
             * @description Set location parameter and hits the $location.search
             * if parameter value is same as default one it will remove it from $location
             */
            set: function(key, val) {
                var locVar = key in this.defaults && angular.equals(this.defaults[key], val) ? null : val;

                $location.search(key, locVar);
                return this;
            },

            /**
             * @ngdoc method
             * @name locationParams#getQuery
             * @public
             * @return {String}
             *
             * @description Returns query string compiled from current params
             * if parameter value is same as default one it will remove it from query
             *
             */
            getQuery: function() {
                return this.makeQuery(this.params, this.defaults);
            },

            /**
             * @ngdoc method
             * @name locationParams#makeQuery
             * @public
             * @return {String}
             *
             * @description Returns query string compiled from given params if
             * parameter value is same as default one it will remove it from query
             */
            makeQuery: function(params, defaults = {}) {
                var parts = [];

                _.forEach(params, (val, key) => {
                    if (!angular.equals(defaults[key], val)) {
                        _.forEach(_.isArray(val) ? val : [val], (item) => {
                            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(item));
                        });
                    }
                });
                var query = parts.length === 0 ? '' : '?' + parts.join('&');

                return query;
            },

            /**
             * @ngdoc method
             * @name locationParams#path
             * @public
             *
             * @param {String} path
             *
             * @description Updates url with given path, keeping parameters
             * if parameter value is same as default one it will remove it
             * from query.
             */
            path: function(path) {
                $location.path(path);
            },

            /**
             * @ngdoc method
             * @name locationParams#reload
             * @public
             * @description Activates controller based on current url. Does not refresh the page.
             */
            reload: function() {
                $route.reload();
            },

            /**
             * @ngdoc method
             * @name locationParams#replace
             * @public
             * @description Replace history
             */
            replace: function() {
                $location.replace();
            },
        };
    }])

    /**
     * @ngdoc service
     * @module superdesk.core.services
     * @name em
     *
     * @requires server
     *
     * @description Entity manager service.
     */
    .service('em', ['server', function(server) {
        /**
         * Entity repository
         */
        function Repository(entity) {
            /**
             * @ngdoc method
             * @name em#find
             * @private
             * @return {Object}
             *
             * @param {String} id
             *
             * @description Find entity by given id
             */
            this.find = function(id) {
                return server.readById(entity, id);
            };

            /**
             * @ngdoc method
             * @name em#matching
             * @private
             * @return {Object}
             *
             * @param {Object} criteria
             *
             * @description Find entities matching given criteria
             */
            this.matching = function(criteria = {}) {
                return server.list(entity, criteria);
            };

            /**
             * @ngdoc method
             * @name em#all
             * @private
             *
             * @return {Object}
             *
             * @description Find all entities.
             */
            this.all = function() {
                return this.matching();
            };
        }

        var repos = {};

        /**
         * @ngdoc method
         * @name em#getRepository
         * @public
         * @return {Object} Repository
         *
         * @param {String} entity
         *
         * @description Get repository for given entity
         */
        this.getRepository = function(entity) {
            if (!(entity in repos)) {
                repos[entity] = new Repository(entity);
            }

            return repos[entity];
        };

        /**
         * Shortcut for getRepository
         */
        this.repository = this.getRepository;

        /**
         * @ngdoc method
         * @name em#delete
         * @public
         * @return {Object}
         *
         * @param {Object} item
         *
         * @description Remove given item.
         */
        this.delete = function(item) {
            return server.delete(item);
        };

        /**
         * @ngdoc method
         * @name em#update
         * @public
         *
         * @param {Object} item
         * @param {Object} updates
         * @return {Object}
         *
         * @description Update given item
         */
        this.update = function(item, updates) {
            return server.update(item, updates);
        };

        /**
         * @ngdoc method
         * @name em#create
         * @public
         *
         * @param {string} resource
         * @param {Object} item
         * @return {Object}
         *
         * @description Persist given item
         */
        this.create = function(resource, item) {
            return server.create(resource, item);
        };

        /**
         * @ngdoc method
         * @name em#remove
         * @public
         *
         * @param {Object} item
         * @return {Object}
         *
         * @description Remove given item from repository
         */
        this.remove = function(item) {
            return this.delete(item);
        };

        /**
         * @ngdoc method
         * @name em#save
         * @public
         *
         * @param {string} resource
         * @param {Object} item
         * @return {Object}
         *
         * @description Save item
         */
        this.save = function(resource, item) {
            if ('_etag' in item) {
                return this.update(item);
            }

            return this.create(resource, item);
        };

        /**
         * @ngdoc method
         * @name em#save
         * @public
         * @return {Object}
         *
         * @param {String} resource
         * @param {String} id
         *
         * @description Shortcut for em.repository(resource).find(id)
         */
        this.find = function(resource, id) {
            return this.repository(resource).find(id);
        };
    }]);
