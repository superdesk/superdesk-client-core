export default angular.module('superdesk.core.services.data', [])
    /**
     * @ngdoc service
     * @module superdesk.core.services
     * @name LocationStateAdapter
     *
     * @requires https://docs.angularjs.org/api/ng/service/$location $location
     *
     * @description Location State Adapter for Data Layer.
     */
    .service('LocationStateAdapter', ['$location', function($location) {
        this.get = function(key) {
            return arguments.length ? $location.search()[key] : $location.search();
        };

        this.set = function(key, val) {
            return $location.search(key, val);
        };
    }])

    /**
     * @ngdoc factory
     * @module superdesk.core.services
     * @name DataAdapter
     *
     * @requires em
     * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
     * @requires LocationStateAdapter
     *
     * @param {Object} resource Resource.
     * @param {Object} params Paramters.
     *
     * @description Returns a data provider for a given resource.
     */
    .factory('DataAdapter', ['$rootScope', 'em', 'LocationStateAdapter',
        function($rootScope, em, LocationStateAdapter) {
            return function DataAdapter(resource, params) {
                var self = this;
                var state = LocationStateAdapter; // @todo implement storage state adapter
                var cancelWatch = angular.noop;
                var defaultParams = {page: 1};

                /**
                 * Get query criteria - extend default params with current search
                 */
                function getQueryCriteria() {
                    var criteria = angular.extend({}, defaultParams, state.get());

                    angular.extend(criteria.where, _.pick(state.get(), defaultParams.filters));

                    if (criteria.hasOwnProperty('_id')) {
                        // prevent reload on preview
                        delete criteria._id;
                    }

                    return criteria;
                }

                /**
                 * Log slow query into console
                 *
                 * @param {Object} query
                 */
                function slowQueryLog(query) {
                    query.time = Date.now() - query.start;
                    if (query.time > 500) {
                        console.info('Slow query', query);
                    }
                }

                /**
                 * @ngdoc method
                 * @name DataAdapter#query
                 * @public
                 * @returns {Promise} Promise.
                 *
                 * @param {Object} criteria
                 *
                 * @description Execute query.
                 */
                this.query = function(criteria) {
                    self.loading = true;
                    var query = {resource: resource, criteria: criteria, start: Date.now()};
                    var promise = em.getRepository(resource).matching(criteria);

                    return promise.then((data) => {
                        self.loading = false;
                        slowQueryLog(query);
                        angular.extend(self, data);
                        return data;
                    });
                };

                /**
                 * @ngdoc method
                 * @name DataAdapter#page
                 * @public
                 *
                 * @param {Integer} page
                 *
                 * @description Get/set current page.
                 */
                this.page = function(page) {
                    switch (arguments.length) {
                    case 0:
                        return state.get('page') || defaultParams.page;

                    case 1:
                        if (this._items) {
                            state.set('page', page !== defaultParams.page ? page : null);
                        }
                    }
                };

                /**
                 * @ngdoc method
                 * @name DataAdapter#search
                 * @public
                 * @returns {Object} chainable
                 *
                 * @param {String} q
                 * @param {String} df
                 *
                 * @description Get/set current search query.
                 */
                this.search = function(q, df) {
                    switch (arguments.length) {
                    case 0:
                        return state.get('q');

                    case 1:
                        if (this._items) {
                            state.set('q', q);
                            state.set('df', df);
                            state.set('page', null);
                        }
                    }

                    return this;
                };

                /**
                 * @ngdoc method
                 * @name DataAdapter#where
                 * @public
                 *
                 * @param {String} key
                 * @param {String} val
                 *
                 * @description Get/set filter
                 */
                this.where = function(key, val) {
                    switch (arguments.length) {
                    case 1:
                        return state.get(key) || null;

                    case 2:
                        state.set(key, val || null);
                        state.set('page', null);
                    }

                    return this;
                };

                /**
                 * @ngdoc method
                 * @name DataAdapter#find
                 * @public
                 *
                 * @param {Object} id ID
                 *
                 * @description Get single item by ID.
                 */
                this.find = function(id) {
                    return em.find(resource, id);
                };

                /**
                 * @ngdoc method
                 * @name DataAdapter#reset
                 * @public
                 *
                 * @param {Object} params Paramters.
                 *
                 * @description Reset default params
                 */
                this.reset = function(params) {
                    cancelWatch();

                    defaultParams = angular.extend({
                        max_results: 25,
                        page: 1,
                        where: {},
                        sort: [],
                        filters: [],
                        ttl: 0,
                    }, params);

                    // main loop - update when query criteria change
                    cancelWatch = $rootScope.$watchCollection(() => getQueryCriteria(), (criteria) => {
                        self.query(criteria);
                    });
                };

                /**
                 * @ngdoc method
                 * @name DataAdapter#reset
                 * @public
                 *
                 * @description Force reload with same params
                 */
                this.reload = function() {
                    self.query(getQueryCriteria());
                };

                if (params) {
                    this.reset(params);
                }
            };
        }]);
