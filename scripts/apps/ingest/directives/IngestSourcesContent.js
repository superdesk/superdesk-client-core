import _ from 'lodash';

IngestSourcesContent.$inject = ['ingestSources', 'gettext', 'notify', 'api', '$location',
    'modal', '$filter', 'config', 'deployConfig', 'privileges'];

/**
 * @ngdoc directive
 * @module superdesk.apps.ingest
 * @name sdIngestSourcesContent
 *
 * @requires ingestSources
 * @requires gettext
 * @requires notify
 * @requires api
 * @requires $location
 * @requires modal
 * @requires $filter
 * @requires config
 * @requires deployConfig
 * @requires privileges
 *
 * @description Handles the management for Ingest Sources.
 */
export function IngestSourcesContent(ingestSources, gettext, notify, api, $location,
    modal, $filter, config, deployConfig, privileges) {
    return {
        templateUrl: 'scripts/apps/ingest/views/settings/ingest-sources-content.html',
        link: function($scope) {
            $scope.provider = null;
            $scope.origProvider = null;
            $scope.feedParsers = [];
            $scope.feedingServices = [];
            $scope.fileTypes = [
                {
                    type: 'text',
                    icon: 'icon-text',
                },
                {
                    type: 'picture',
                    icon: 'icon-photo',
                },
                {
                    type: 'graphic',
                    icon: 'icon-graphic',
                },
                {
                    type: 'composite',
                    icon: 'icon-composite',
                },
                {
                    type: 'video',
                    icon: 'icon-video',
                },
                {
                    type: 'audio',
                    icon: 'icon-audio',
                },
            ];

            if (_.get(privileges, 'privileges.planning')) {
                $scope.fileTypes.push({
                    type: 'event',
                    icon: 'icon-calendar',
                });
            }

            $scope.minutes = [0, 1, 2, 3, 4, 5, 8, 10, 15, 30, 45];
            $scope.seconds = [0, 5, 10, 15, 30, 45];
            $scope.hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
            $scope.ingestExpiry = deployConfig.getSync('ingest_expiry_minutes');

            function fetchProviders() {
                return api.ingestProviders.query({
                    max_results: $location.search().max_results || 25,
                    page: $location.search().page || 1,
                    sort: 'name',
                }).then((result) => {
                    $scope.providers = result;
                });
            }

            function openProviderModal() {
                var providerId = $location.search()._id;
                var provider;

                if (providerId) {
                    if ($scope.providers && $scope.providers._items) {
                        provider = _.find($scope.providers._items, (item) => item._id === providerId);
                    }

                    if (_.isNil(provider)) {
                        api.ingestProviders.getById(providerId).then((result) => {
                            provider = result;
                        });
                    }

                    if (provider) {
                        $scope.edit(provider);
                    }
                }
            }

            fetchProviders().then(() => {
                openProviderModal();
            });

            api('rule_sets').query()
                .then((result) => {
                    $scope.rulesets = $filter('sortByName')(result._items);
                });

            api('routing_schemes').query()
                .then((result) => {
                    $scope.routingScheme = $filter('sortByName')(result._items);
                });

            ingestSources.fetchAllFeedingServicesAllowed().then((result) => {
                $scope.feedingServices = result;
            });

            ingestSources.fetchAllFeedParsersAllowed().then((result) => {
                $scope.feedParsers = result;
            });

            /**
            * Returns the result of evaluation of a given expression. Identifiers enclosed in {}
            * are replaced with the values of corresponding fields.
            *
            * @method evalExpression
            * @param {String} expression
            * @return {Boolean}
            */
            function evalExpression(expression) {
                if (!$scope.currentFeedingService) {
                    return false;
                }
                let toEvaluate = expression;

                _.forEach($scope.currentFeedingService.fields, (field) => {
                    let regExp = new RegExp('{' + field.id + '}');

                    toEvaluate = toEvaluate.replace(regExp, $scope.provider.config[field.id]);
                });
                return $scope.$eval(toEvaluate);
            }

            /**
            * Returns true if the feeding service configuration field was required
            *
            * @method isConfigFieldRequired
            * @param {Object} field
            * @return {Boolean}
            */
            $scope.isConfigFieldRequired = (field) => {
                if (field.required) {
                    return true;
                }
                if (field.required_expression) {
                    return evalExpression(field.required_expression);
                }
                return false;
            };

            /**
            * Returns true if the feeding service configuration field was visible
            *
            * @method isConfigFieldVisible
            * @param {Object} field
            * @return {Boolean}
            */
            $scope.isConfigFieldVisible = (field) => {
                if (!field.show_expression) {
                    return true;
                }
                return evalExpression(field.show_expression);
            };

            /**
            * Returns the configuration field HTML identifier
            *
            * @method getConfigFieldId
            * @param {String} fieldId
            * @return {String}
            */
            $scope.getConfigFieldId = (fieldId) => {
                if (!$scope.provider.feeding_service) {
                    return null;
                }
                return $scope.provider.feeding_service + '-' + fieldId;
            };

            /**
            * Fetches the list of errors for the current feeding service
            *
            * @method fetchSourceErrors
            */
            $scope.fetchSourceErrors = function() {
                if ($scope.provider && $scope.provider.feeding_service) {
                    return api('io_errors').query({source_type: $scope.provider.feeding_service})
                        .then((result) => {
                            $scope.provider.source_errors = result._items[0].source_errors;
                            $scope.provider.all_errors = result._items[0].all_errors;
                        });
                }
            };

            /**
            * Removed the given ingest provider
            *
            * @method remove
            * @param {Object} provider
            */
            $scope.remove = function(provider) {
                modal.confirm(gettext('Are you sure you want to delete Ingest Source?')).then(
                    function removeIngestProviderChannel() {
                        api.ingestProviders.remove(provider)
                            .then(
                                () => {
                                    notify.success(gettext('Ingest Source deleted.'));
                                },
                                (response) => {
                                    if (angular.isDefined(response.data._message)) {
                                        notify.error(response.data._message);
                                    } else {
                                        notify.error(gettext('Error: Unable to delete Ingest Source'));
                                    }
                                }
                            )
                            .then(fetchProviders);
                    }
                );
            };

            function initTupleFields() {
                $scope.fieldAliases = {};
                $scope.fieldsNotSelected = {};
                $scope.currentFeedingService = $scope.provider ? _.find($scope.feedingServices,
                    {feeding_service: $scope.provider.feeding_service}) : null;

                if (!$scope.currentFeedingService) {
                    return;
                }

                _.forEach($scope.currentFeedingService.fields, (field) => {
                    if (field.type != 'mapping') {
                        return;
                    }
                    let aliases = angular.isDefined($scope.origProvider.config)
                        && $scope.origProvider.config[field.id] || [];

                    var aliasObj = {};

                    aliases.forEach((item) => {
                        _.extend(aliasObj, item);
                    });

                    $scope.fieldAliases[field.id] = [];
                    Object.keys(aliasObj).forEach((fieldName) => {
                        $scope.fieldAliases[field.id].push(
                            {fieldName: fieldName, alias: aliasObj[fieldName]});
                    });

                    $scope.fieldsNotSelected[field.id] = field.first_field_options.values.filter(
                        (fieldName) => !(fieldName in aliasObj)
                    );
                });
            }

            $scope.edit = function(provider) {
                $scope.origProvider = provider || {};
                $scope.provider = _.create($scope.origProvider);
                $scope.provider.update_schedule = $scope.origProvider.update_schedule || config.ingest.DEFAULT_SCHEDULE;
                $scope.provider.idle_time = $scope.origProvider.idle_time || config.ingest.DEFAULT_IDLE_TIME;
                $scope.provider.notifications = $scope.origProvider.notifications;
                $scope.provider.config = $scope.origProvider.config;
                $scope.provider.critical_errors = $scope.origProvider.critical_errors;
                $scope.provider._id = $scope.origProvider._id;
                $scope.provider.content_types = $scope.origProvider.content_types;

                initTupleFields();
            };

            $scope.cancel = function() {
                $scope.origProvider = null;
                $scope.provider = null;
            };

            $scope.setConfig = function(provider) {
                $scope.provider.config = provider.config;
            };

            /**
            * Appends a new (empty) item to the list of field aliases.
            *
            * @method addFieldAlias
            */
            $scope.addFieldAlias = function(fieldId) {
                if (!$scope.fieldAliases[fieldId]) {
                    $scope.fieldAliases[fieldId] = [];
                }
                $scope.fieldAliases[fieldId].push({fieldName: null, alias: ''});
            };

            /**
            * Removes a field alias from the list of field aliases at the
            * specified index.
            *
            * @method removeFieldAlias
            * @param {Number} itemIdx - index of the item to remove
            */
            $scope.removeFieldAlias = function(fieldId, itemIdx) {
                var removed = $scope.fieldAliases[fieldId].splice(itemIdx, 1);

                if (removed[0].fieldName) {
                    $scope.fieldsNotSelected[fieldId].push(removed[0].fieldName);
                }
            };

            /**
            * Updates the list of content field names not selected in any
            * of the dropdown menus.
            *
            * @method fieldSelectionChanged
            */
            $scope.fieldSelectionChanged = function(field) {
                var selectedFields = {};

                $scope.fieldAliases[field.id].forEach((item) => {
                    if (item.fieldName) {
                        selectedFields[item.fieldName] = true;
                    }
                });

                $scope.fieldsNotSelected[field.id] = field.first_field_options.values.filter(
                    (fieldName) => !(fieldName in selectedFields)
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
            $scope.availableFieldOptions = function(fieldId, selectedName) {
                if (!(fieldId in $scope.fieldsNotSelected)) {
                    return [];
                }
                var fieldNames = angular.copy($scope.fieldsNotSelected[fieldId]);

                // add current field selection, if available
                if (selectedName) {
                    fieldNames.push(selectedName);
                }
                return fieldNames;
            };

            $scope.save = function() {
                _.forEach($scope.currentFeedingService.fields, (field) => {
                    if (field.type !== 'mapping') {
                        return;
                    }
                    let newAliases = [];

                    $scope.fieldAliases[field.id].forEach((item) => {
                        if (item.fieldName && item.alias) {
                            var newAlias = {};

                            newAlias[item.fieldName] = item.alias;
                            newAliases.push(newAlias);
                        }
                    });

                    if (typeof $scope.provider.config !== 'undefined') {
                        $scope.provider.config[field.id] = newAliases;
                    }
                });
                delete $scope.provider.all_errors;
                delete $scope.provider.source_errors;

                $scope.loading = true;
                api.ingestProviders.save($scope.origProvider, $scope.provider)
                    .then(() => {
                        notify.success(gettext('Provider saved!'));
                        $scope.cancel();
                        $scope.error = null;
                        fetchProviders();
                    }, (error) => {
                        $scope.error = error.data;
                    })
                    .finally(() => {
                        $scope.loading = null;
                    });
            };

            $scope.gotoIngest = function(source) {
                $location.path('/search').search({repo: 'ingest', source: angular.toJson([source])});
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
             * Return true if given field is enabled. False if the field was forced to a certain value.
             *
             * @param {string} fieldName
             * @return boolean
             */
            $scope.isFieldEnabled = (fieldName) => $scope.currentFeedingService &&
                (!$scope.currentFeedingService.force_values ||
                 !(fieldName in $scope.currentFeedingService.force_values));

            var forcedValues = [];

            /**
             * Initializes the configuration for the selected feeding service if the config is not defined.
             */
            $scope.initProviderConfig = function() {
                var service = getCurrentService();

                if (service && service.config) {
                    $scope.provider.config = angular.extend({}, service.config);
                } else {
                    $scope.provider.config = {};
                }

                initTupleFields();

                if (forcedValues.length) {
                    _.forEach(forcedValues, (fieldName) => {
                        $scope.provider[fieldName] = null;
                    });
                    forcedValues = [];
                }
                if ($scope.currentFeedingService) {
                    _.forEach($scope.currentFeedingService.force_values, (forcedValue, forcedField) => {
                        $scope.provider[forcedField] = forcedValue;
                        forcedValues.push(forcedField);
                    });
                }
            };

            /**
             * Returns the HTML src from the templateURL (defined in superdesk-config.js
             * for the selected feeding service.
             * @returns {string}
             */
            $scope.getConfigTemplateUrl = function() {
                var feedingService = getCurrentService();

                return feedingService ? feedingService.templateUrl : '';
            };

            function getCurrentService() {
                return _.find($scope.feedingServices, {feeding_service: $scope.provider.feeding_service});
            }

            $scope.$on('$locationChangeSuccess', fetchProviders);
        },
    };
}
