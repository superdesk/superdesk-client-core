ItemRepo.$inject = [
    '$location', 'asset', 'metadata', 'searchProviderService', '$filter', 'gettext', 'api'
];

export function ItemRepo(
	$location, asset, metadata, searchProviderService, $filter, gettext, api
) {
    return {
        scope: {
            repo: '=',
            context: '='
        },
        templateUrl: asset.templateUrl('superdesk-search/views/item-repo.html'),
        link: function(scope, elem) {

            /*
             * init function to setup the directive initial state and
             * called by $locationChangeSuccess event
             */
            function init() {
                var params = $location.search();
                scope.query = params.q;

                scope.search_config = metadata.search_config;
                scope.scanpix_subscriptions = [{
                    name: 'subscription',
                    label: gettext('inside subscription'),
                }, {
                    name: 'all',
                    label: gettext('all photos'),
                }];

                searchProviderService.getAllowedProviderTypes().then(function(providerTypes) {
                    scope.searchProviderTypes = providerTypes;
                });

                if (params.repo) {
                    var param_list = params.repo.split(',');
                    scope.repo.archive = param_list.indexOf('archive') >= 0;
                    scope.repo.ingest = param_list.indexOf('ingest') >= 0;
                    scope.repo.published = param_list.indexOf('published') >= 0;
                    scope.repo.archived = param_list.indexOf('archived') >= 0;
                } else {
                    // No repo is selected so reset the repos
                    scope.repo = {
                        ingest: true, archive: true,
                        published: true, archived: true,
                        search: 'local'
                    };
                }

                if (!scope.repo) {
                    scope.repo = {'search': 'local'};
                } else {
                    if (!scope.repo.archive && !scope.repo.ingest &&
                        !scope.repo.published && !scope.repo.archived) {
                        scope.repo.search = params.repo;
                    } else {
                        scope.repo.search = 'local';
                    }
                }

                fetchProviders(params);
            }

            init();

            /*
             * Initialize the search providers
             */
            function fetchProviders(params) {
                return api.search_providers.query({max_results: 200})
                    .then(function(result) {
                        scope.providers = $filter('sortByName')(result._items, 'search_provider');
                        setDefaultSearch(params);
                    });
            }

            function setDefaultSearch(params) {
                if (scope.providers.length > 0 && (!params || !params.repo)) {
                    scope.providers.forEach(function(provider, index, array) {
                        if (provider.is_default) {
                            scope.repo = {'search': provider.source};
                        }
                    });
                }
            }

            function getActiveRepos() {
                var repos = [];

                if (scope.repo.search === 'local') {
                    // turn off other providers
                    scope.providers.forEach(function(provider, index, array) {
                        scope.repo[provider.source] = false;
                    });

                    angular.forEach(scope.repo, function(val, key) {
                        if (val && val !== 'local') {
                            repos.push(key);
                        }
                    });

                    return repos.length ? repos.join(',') : null;

                } else {
                    return scope.repo.search;
                }
            }

            scope.$on('$locationChangeSuccess', function() {
                if (getActiveRepos() !== $location.search().repo) {
                    init();
                }
            });

            scope.isDefault = function(provider) {
                return scope.repo && scope.repo.search && provider.source && scope.repo.search === provider.source;
            };

            scope.toggleRepo = function(repoName) {
                scope.repo[repoName] = !scope.repo[repoName];
                $location.search('repo', getActiveRepos());
            };
        }
    };
}
