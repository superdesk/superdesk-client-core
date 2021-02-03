import _ from 'lodash';
import {gettext} from 'core/utils';

export default function SearchProviderConfigDirective(searchProviderService, notify, api, modal) {
    return {
        templateUrl: 'scripts/apps/search-providers/views/search-provider-config.html',
        link: function($scope) {
            $scope.provider = null;
            $scope.origProvider = null;
            $scope.providers = null;
            $scope.newDestination = null;
            $scope.gettext = gettext;

            $scope.availableListViews = {
                '': {label: gettext('None')},
                list: {label: gettext('List View'), icon: 'th-list'},
                grid: {label: gettext('Photo Grid View'), icon: 'th'},
            };

            searchProviderService.getAllowedProviderTypes().then((providerTypes) => {
                $scope.providerTypes = providerTypes;
                $scope.noProvidersAllowed = !$scope.providerTypes.length;
                $scope.addProviderLabel = $scope.noProvidersAllowed ?
                    gettext('There are no providers available.') : gettext('Add New Search Provider');
                $scope.providerLabels = searchProviderService.getProviderLabels(providerTypes);
                $scope.providerTypesOptions = providerTypes.map((t) => ({label: t.label, value: t.search_provider}));
            });

            /**
             * Fetches all search providers from backend
             */
            function fetchSearchProviders() {
                searchProviderService.getSearchProviders({manage: 1}).then(
                    (result) => {
                        $scope.providers = result;
                    },
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
                        },
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
                                },
                            )
                            .then(fetchSearchProviders);
                    },
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

            $scope.getStatusLabel = (provider) => provider.is_closed ? gettext('Open') : gettext('Close');
            $scope.getIsDefaultLabel = (provider) => provider.is_default ? gettext('Default') : '';
        },
    };
}

SearchProviderConfigDirective.$inject = ['searchProviderService', 'notify', 'api', 'modal'];
