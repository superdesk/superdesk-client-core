export default function SearchProviderConfigDirective(searchProviderService, gettext, notify, api, modal) {
    return {
        templateUrl: 'scripts/apps/search-providers/views/search-provider-config.html',
        link: function($scope) {
            $scope.provider = null;
            $scope.origProvider = null;
            $scope.providers = null;
            $scope.newDestination = null;

            searchProviderService.getAllowedProviderTypes().then((providerTypes) => {
                $scope.providerTypes = providerTypes;
                $scope.noProvidersAllowed = !$scope.providerTypes.length;
                $scope.providerLabels = searchProviderService.getProviderLabels(providerTypes);
                $scope.providerTypesOptions = providerTypes.map((t) => ({label: t.label, value: t.search_provider}));
            });

            /**
             * Fetches all search providers from backend
             */
            function fetchSearchProviders() {
                searchProviderService.getSearchProviders().then(
                    (result) => {
                        $scope.providers = result;
                    }
                );
            }

            /**
             * Upserts the selected search provider.
             */
            $scope.save = function() {
                api.search_providers.save($scope.origProvider, $scope.provider)
                    .then(
                        () => {
                            notify.success(gettext('Search Provider saved.'));
                            $scope.cancel();
                        },
                        (response) => {
                            if (angular.isDefined(response.data._issues)) {
                                if (angular.isDefined(response.data._issues['validator exception'])) {
                                    notify.error(gettext('Error: ' + response.data._issues['validator exception']));
                                } else if (angular.isDefined(response.data._issues.search_provider) &&
                                    angular.isDefined(response.data._issues.search_provider.unique)) {
                                    notify.error(gettext('Error: A Search Provider with type ' +
                                        $scope.providerTypes[$scope.provider.search_provider] + ' already exists.'));
                                }
                            } else {
                                notify.error(gettext('Error: Failed to save Search Provider.'));
                            }
                        }
                    )
                    .then(fetchSearchProviders);
            };

            /**
             * Either initializes a new provider object for adding a new provider or initializes the provider object
             * with the selected provider allowing user to update the provider details.
             */
            $scope.edit = function(provider) {
                $scope.origProvider = provider || {};
                $scope.provider = _.create($scope.origProvider);
                $scope.provider.config = _.create($scope.origProvider.config || {});
            };

            /**
             * Removes the selected search provider.
             */
            $scope.remove = function(provider) {
                modal.confirm(gettext('Are you sure you want to delete Search Provider?')).then(
                    function removeSearchProvider() {
                        api.search_providers.remove(provider)
                            .then(
                                () => {
                                    notify.success(gettext('Search Provider deleted.'));
                                },
                                (response) => {
                                    if (angular.isDefined(response.data._message)) {
                                        notify.error(response.data._message);
                                    } else {
                                        notify.error(gettext('Error: Unable to delete Search Provider.'));
                                    }
                                }
                            )
                            .then(fetchSearchProviders);
                    }
                );
            };

            /**
             * Reverts any changes made to the provider
             */
            $scope.cancel = function() {
                $scope.origProvider = null;
                $scope.provider = null;
            };

            fetchSearchProviders();
        },
    };
}

SearchProviderConfigDirective.$inject = ['searchProviderService', 'gettext', 'notify', 'api', 'modal'];
