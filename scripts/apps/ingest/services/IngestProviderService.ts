import _ from 'lodash';

IngestProviderService.$inject = ['api', '$q', 'preferencesService', '$filter', 'searchProviderService', 'config'];
export function IngestProviderService(api, $q, preferencesService, $filter, searchProviderService, config) {
    var _getAllIngestProviders = function(criteria = {}, page = 1, providers = []) {
        return api.query('ingest_providers', _.extend({max_results: 200, page: page}, criteria))
            .then((result) => {
                let pg = page;
                let merged = providers.concat(result._items);

                if (result._links.next) {
                    pg++;
                    return _getAllIngestProviders(criteria, pg, merged);
                }
                return $filter('sortByName')(merged);
            });
    };

    var _getAllFeedParsersAllowed = function(criteria = {}, page = 1, parsers = []) {
        return api.query('feed_parsers_allowed', _.extend({max_results: 200, page: page}, criteria))
            .then((result) => {
                let pg = page;
                let merged = parsers.concat(result._items);

                if (result._links.next) {
                    pg++;
                    return _getAllFeedParsersAllowed(criteria, pg, merged);
                }
                return $filter('sortByName')(merged, 'label');
            });
    };

    var _getAllFeedingServicesAllowed = function(criteria = {}, page = 1, services = []) {
        return api.query('feeding_services_allowed', _.extend({max_results: 200, page: page}, criteria))
            .then((result) => {
                let pg = page;
                // if we have a registered service map for the service return that instead
                // of default result from api
                let merged = services.concat(result._items);

                if (result._links.next) {
                    pg++;
                    return _getAllFeedingServicesAllowed(criteria, pg, merged);
                }
                return $filter('sortByName')(merged, 'label');
            });
    };

    var _forcedExtend = function(dest, src) {
        _.each(config.ingest.PROVIDER_DASHBOARD_DEFAULTS, (value, key) => {
            if (_.has(src, key)) {
                dest[key] = src[key];
            } else {
                dest[key] = config.ingest.PROVIDER_DASHBOARD_DEFAULTS[key];
            }
        });
    };

    var service = {
        providers: null,
        providersLookup: {},
        fetched: null,
        fetchProviders: function() {
            var self = this;
            var providersPromise = $q.all([_getAllIngestProviders(), searchProviderService.getSearchProviders()]);

            return providersPromise.then((results) => {
                self.providers = [];

                results.forEach((result) => {
                    self.providers = self.providers.concat(result);
                });
            });
        },
        generateLookup: function() {
            var self = this;

            this.providersLookup = _.keyBy(self.providers, '_id');

            return $q.when();
        },
        initialize: function() {
            if (!this.fetched) {
                this.fetched = this.fetchProviders()
                    .then(angular.bind(this, this.generateLookup));
            }

            return this.fetched;
        },
        fetchAllFeedingServicesAllowed: function(criteria) {
            return _getAllFeedingServicesAllowed(criteria, 1, []);
        },
        fetchAllIngestProviders: function(criteria) {
            return _getAllIngestProviders(criteria);
        },
        fetchAllFeedParsersAllowed: function(criteria) {
            return _getAllFeedParsersAllowed(criteria);
        },
        fetchDashboardProviders: function() {
            var deferred = $q.defer();

            _getAllIngestProviders().then((result) => {
                var ingestProviders = result;

                preferencesService.get('dashboard:ingest').then((userIngestProviders) => {
                    _.forEach(ingestProviders, (provider) => {
                        var userProvider = _.find(
                            _.isArray ? userIngestProviders : [userIngestProviders],
                            (item) => item._id === provider._id,
                        );

                        provider.dashboard_enabled = !!userProvider;
                        _forcedExtend(provider,
                            userProvider ? userProvider : config.ingest.PROVIDER_DASHBOARD_DEFAULTS);
                    });

                    deferred.resolve(ingestProviders);
                }, (error) => {
                    deferred.reject(error);
                });
            }, (error) => {
                deferred.reject(error);
            });

            return deferred.promise;
        },
    };

    return service;
}
