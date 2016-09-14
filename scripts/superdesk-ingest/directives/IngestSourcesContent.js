import * as constant from 'superdesk-ingest/constants';

IngestSourcesContent.$inject = ['feedingServices', 'feedParsers', 'gettext', 'notify', 'api', '$location',
    'modal', '$filter', 'config'];
export function IngestSourcesContent(feedingServices, feedParsers, gettext, notify, api, $location, modal, $filter, config) {
    return {
        templateUrl: 'scripts/superdesk-ingest/views/settings/ingest-sources-content.html',
        link: function($scope) {
            $scope.provider = null;
            $scope.origProvider = null;

            $scope.feedingServices = $filter('sortByName')(feedingServices, 'label');
            $scope.feedParsers = $filter('sortByName')(_.concat(feedParsers, config.feedParsers || []));
            $scope.fileTypes = ['text', 'picture', 'composite', 'video', 'audio'];
            $scope.minutes = [0, 1, 2, 3, 4, 5, 8, 10, 15, 30, 45];
            $scope.seconds = [0, 5, 10, 15, 30, 45];
            $scope.hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

            // a list of all data field names in retrieved content
            // expected by the server
            // XXX: have this somewhere in config? probably better
            $scope.contentFields = [
                'body_text', 'guid', 'published_parsed',
                'summary', 'title', 'updated_parsed'
            ];

            // a list of data field names currently *not* selected in any
            // of the dropdown menus in the field aliases section
            $scope.fieldsNotSelected = angular.copy($scope.contentFields);

            // a list of field names aliases - used for fields in retrieved
            // content whose names differ from what the server expects
            $scope.fieldAliases = [];

            function fetchProviders() {
                return api.ingestProviders.query({max_results: 200})
                    .then(function(result) {
                        result._items = $filter('sortByName')(result._items);
                        $scope.providers = result;
                    });
            }

            function openProviderModal() {
                var provider_id = $location.search()._id;
                var provider;
                if (provider_id) {
                    if ($scope.providers && $scope.providers._items) {
                        provider = _.find($scope.providers._items, function (item) {
                            return item._id === provider_id;
                        });
                    }

                    if (provider == null) {
                        api.ingestProviders.getById(provider_id).then(function (result) {
                            provider = result;
                        });
                    }

                    if (provider) {
                        $scope.edit(provider);
                    }
                }
            }

            fetchProviders().then(function() {
                openProviderModal();
            });

            api('rule_sets').query().then(function(result) {
                $scope.rulesets = $filter('sortByName')(result._items);
            });

            api('routing_schemes').query().then(function(result) {
                $scope.routingScheme = $filter('sortByName')(result._items);
            });

            $scope.fetchSourceErrors = function() {
                if ($scope.provider && $scope.provider.feeding_service) {
                    return api('io_errors').query({'source_type': $scope.provider.feeding_service})
                        .then(function (result) {
                            $scope.provider.source_errors = result._items[0].source_errors;
                            $scope.provider.all_errors = result._items[0].all_errors;
                        });
                }
            };

            $scope.remove = function(provider) {
                modal.confirm(gettext('Are you sure you want to delete Ingest Source?')).then(
                    function removeIngestProviderChannel() {
                        api.ingestProviders.remove(provider)
                            .then(
                                function () {
                                    notify.success(gettext('Ingest Source deleted.'));
                                },
                                function(response) {
                                    if (angular.isDefined(response.data._message)) {
                                        notify.error(response.data._message);
                                    } else {
                                        notify.error(gettext('Error: Unable to delete Ingest Source'));
                                    }
                                }
                            ).then(fetchProviders);
                    }
                );
            };

            $scope.edit = function(provider) {
                var aliases;

                $scope.origProvider = provider || {};
                $scope.provider = _.create($scope.origProvider);
                $scope.provider.update_schedule = $scope.origProvider.update_schedule || constant.DEFAULT_SCHEDULE;
                $scope.provider.idle_time = $scope.origProvider.idle_time || constant.DEFAULT_IDLE_TIME;
                $scope.provider.notifications = $scope.origProvider.notifications;
                $scope.provider.config = $scope.origProvider.config;
                $scope.provider.critical_errors = $scope.origProvider.critical_errors;
                $scope.provider._id = $scope.origProvider._id;
                $scope.provider.content_types = $scope.origProvider.content_types;

                // init the lists of field aliases and non-selected fields
                $scope.fieldAliases = [];
                aliases = (angular.isDefined($scope.origProvider.config) && $scope.origProvider.config.field_aliases) || [];

                var aliasObj = {};
                aliases.forEach(function (item) {
                    _.extend(aliasObj, item);
                });

                Object.keys(aliasObj).forEach(function (fieldName) {
                    $scope.fieldAliases.push(
                        {fieldName: fieldName, alias: aliasObj[fieldName]});
                });

                $scope.fieldsNotSelected = $scope.contentFields.filter(
                    function (fieldName) {
                        return !(fieldName in aliasObj);
                    }
                );
            };

            $scope.cancel = function() {
                $scope.origProvider = null;
                $scope.provider = null;
            };

            $scope.setConfig = function(provider) {
                $scope.provider.config = provider.config;
            };

            /**
            * Updates provider configuration object. It also clears the
            * username and password fields, if authentication is not
            * needed for an RSS source.
            *
            * @method setRssConfig
            * @param {Object} provider - ingest provider instance
            */
            $scope.setRssConfig = function (provider) {
                if (!provider.config.auth_required) {
                    provider.config.username = null;
                    provider.config.password = null;
                }
                $scope.provider.config = provider.config;
            };

            /**
            * Appends a new (empty) item to the list of field aliases.
            *
            * @method addFieldAlias
            */
            $scope.addFieldAlias = function () {
                $scope.fieldAliases.push({fieldName: null, alias: ''});
            };

            /**
            * Removes a field alias from the list of field aliases at the
            * specified index.
            *
            * @method removeFieldAlias
            * @param {Number} itemIdx - index of the item to remove
            */
            $scope.removeFieldAlias = function (itemIdx) {
                var removed = $scope.fieldAliases.splice(itemIdx, 1);
                if (removed[0].fieldName) {
                    $scope.fieldsNotSelected.push(removed[0].fieldName);
                }
            };

            /**
            * Updates the list of content field names not selected in any
            * of the dropdown menus.
            *
            * @method fieldSelectionChanged
            */
            $scope.fieldSelectionChanged = function () {
                var selectedFields = {};

                $scope.fieldAliases.forEach(function (item) {
                    if (item.fieldName) {
                        selectedFields[item.fieldName] = true;
                    }
                });

                $scope.fieldsNotSelected = $scope.contentFields.filter(
                    function (fieldName) {
                        return !(fieldName in selectedFields);
                    }
                );
            };

            /**
            * Calculates a list of content field names that can be used as
            * options in a dropdown menu.
            *
            * The list is comprised of all field names that are currently
            * not selected in any of the other dropdown menus and
            * of a field name that should be selected in the current
            * dropdown menu (if any).
            *
            * @method availableFieldOptions
            * @param {String} [selectedName] - currently selected field
            * @return {String[]} list of field names
            */
            $scope.availableFieldOptions = function (selectedName) {
                var fieldNames = angular.copy($scope.fieldsNotSelected);

                // add current field selection, if available
                if (selectedName) {
                    fieldNames.push(selectedName);
                }
                return fieldNames;
            };

            $scope.save = function() {
                var newAliases = [];

                $scope.fieldAliases.forEach(function (item) {
                    if (item.fieldName && item.alias) {
                        var newAlias = {};
                        newAlias[item.fieldName] = item.alias;
                        newAliases.push(newAlias);
                    }
                });

                if (typeof($scope.provider.config) !== 'undefined') {
                    $scope.provider.config.field_aliases = newAliases;
                }
                delete $scope.provider.all_errors;
                delete $scope.provider.source_errors;

                api.ingestProviders.save($scope.origProvider, $scope.provider)
                .then(function() {
                    notify.success(gettext('Provider saved!'));
                    $scope.cancel();
                }).then(fetchProviders);
            };

            $scope.gotoIngest = function(source) {
                $location.path('/search').search({'repo': 'ingest', 'source': angular.toJson([source])});
            };

            /**
             * Add or remove the current 'fileType' from the provider.
             *
             * @param {string} fileType
             */
            $scope.addOrRemoveFileType = function(fileType) {
                if (!$scope.provider.content_types) {
                    $scope.provider.content_types = [];
                }

                var index = $scope.provider.content_types.indexOf(fileType);
                if (index > -1) {
                    $scope.provider.content_types.splice(index, 1);
                } else {
                    $scope.provider.content_types.push(fileType);
                }
            };

            /**
             * Return true if the 'fileType' is in provider.content_types list.
             *
             * @param {string} fileType
             * @return boolean
             */
            $scope.hasFileType = function(fileType) {
                return $scope.provider && $scope.provider.content_types &&
                    $scope.provider.content_types.indexOf(fileType) > -1;
            };

            /**
             * Initializes the configuration for the selected feeding service if the config is not defined.
             */
            $scope.initProviderConfig = function () {
                var service = getCurrentService();
                if (service && service.config) {
                    $scope.provider.config = angular.extend({}, service.config);
                } else {
                    $scope.provider.config = {};
                }
            };

            /**
             * Returns the templateURL for the selected feeding service.
             * @returns {string}
             */
            $scope.getConfigTemplateURL = function() {
                var feedingService = getCurrentService();
                return feedingService ? feedingService.templateUrl : '';
            };

            function getCurrentService() {
                return _.find($scope.feedingServices, {value: $scope.provider.feeding_service});
            }
        }
    };
}
