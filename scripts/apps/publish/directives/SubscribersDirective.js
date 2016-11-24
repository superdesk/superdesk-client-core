SubscribersDirective.$inject = [
    'gettext', 'notify', 'api', 'subscribersService', 'adminPublishSettingsService', 'modal',
    'metadata', 'contentFilters', '$q', '$filter', 'products'
];

export function SubscribersDirective(
    gettext, notify, api, subscribersService, adminPublishSettingsService,
    modal, metadata, contentFilters, $q, $filter, products) {

    return {
        templateUrl: 'scripts/apps/publish/views/subscribers.html',
        link: function($scope) {
            $scope.subscriber = null;
            $scope.origSubscriber = null;
            $scope.subscribers = null;
            $scope.newDestination = null;
            $scope.contentFilters = null;
            $scope.availableProducts = null;
            $scope.subTypes = null;

            if (angular.isDefined(metadata.values.subscriber_types)) {
                $scope.subTypes = metadata.values.subscriber_types;
            } else {
                metadata.fetchMetadataValues().then(function() {
                    $scope.subTypes = metadata.values.subscriber_types;
                });
            }

            /**
             * Fetches all subscribers from backend
             */
            function fetchSubscribers() {
                subscribersService.fetchSubscribers().then(
                    function(result) {
                        $scope.subscribers = result;
                    }
                );
            }

            /**
             * Fetches content filters from backend and returns the same.
             *
             * @return {*}
             */
            var fetchProducts = function() {
                return products.fetchAllProducts().then(function(items) {
                    $scope.availableProducts = items;
                    $scope.productLookup = [];
                    _.each(items, function(item) {
                        $scope.productLookup[item._id] = item;
                    });
                });
            };

            /**
             * Initializes the Global Filters on the selected subscriber.
             */
            var initGlobalFilters = function() {
                if (!$scope.subscriber) {
                    return;
                }

                if (!$scope.subscriber.global_filters) {
                    $scope.subscriber.global_filters = {};
                }

                _.each($scope.globalFilters, function(filter) {
                    if (!(filter._id in $scope.subscriber.global_filters)) {
                        $scope.subscriber.global_filters[filter._id] = true;
                    }
                });
            };

            /**
             * Fetches list of global content filters and returns the same.
             *
             * @return {*}
             */
            var fetchGlobalContentFilters = function() {
                return contentFilters.getGlobalContentFilters().then(function(filters) {
                    $scope.globalFilters = filters;
                });
            };

            /**
             * Fetch list of publish errors from the backend allowing the user to configure for the selected subscriber.
             *
             * @return {*}
             */
            function fetchPublishErrors() {
                return adminPublishSettingsService.fetchPublishErrors().then(function(result) {
                    $scope.all_errors = result._items[0].all_errors;
                });
            }

            /**
             * Initializes the new destination object.
             */
            $scope.addNewDestination = function() {
                $scope.newDestination = {};
            };

            /**
             * Reverts the changes made to the new destination object
             */
            $scope.cancelNewDestination = function() {
                $scope.newDestination = null;
            };

            /**
             * Saves the destination and adds it to the destinations list of the selected subscriber
             */
            $scope.saveNewDestination = function() {
                $scope.destinations.push($scope.newDestination);
                $scope.newDestination = null;
            };

            /**
             * Removes the selected destination from the destinations list of the selected subscriber.
             */
            $scope.deleteDestination = function(destination) {
                _.remove($scope.destinations, destination);
            };

            /**
             * Upserts the selected subscriber.
             */
            $scope.save = function() {

                $scope.subscriber.destinations = $scope.destinations;
                $scope.subscriber.products = _.map($scope.subscriber.products, '_id');

                api.subscribers.save($scope.origSubscriber, $scope.subscriber)
                    .then(
                        function() {
                            notify.success(gettext('Subscriber saved.'));
                            $scope.cancel();
                        },
                        function(response) {
                            if (angular.isDefined(response.data._issues)) {
                                if (angular.isDefined(response.data._issues['validator exception'])) {
                                    notify.error(gettext('Error: ' + response.data._issues['validator exception']));
                                } else if (angular.isDefined(response.data._issues.name) &&
                                    angular.isDefined(response.data._issues.name.unique)) {
                                    notify.error(gettext('Error: Subscriber with Name ' + $scope.subscriber.name +
                                        ' already exists.'));
                                } else if (angular.isDefined(response.data._issues.destinations)) {
                                    notify.error(gettext('Error: Subscriber must have at least one destination.'));
                                }
                            } else {
                                notify.error(gettext('Error: Failed to save Subscriber.'));
                            }
                        }
                    ).then(fetchSubscribers);
            };

            /**
             * Either initializes a new Subscriber object for adding a new subscriber or
             * initializes the subscriber object with the selected subscriber allowing
             * user to update the subscriber details.
             */
            $scope.edit = function(subscriber) {
                var promises = [];
                promises.push(fetchPublishErrors());
                promises.push(fetchProducts());
                promises.push(fetchGlobalContentFilters());

                $q.all(promises).then(function() {
                    $scope.origSubscriber = subscriber || {};
                    $scope.subscriber = _.create($scope.origSubscriber);
                    $scope.subscriber.critical_errors = $scope.origSubscriber.critical_errors;
                    $scope.subscriber.sequence_num_settings = $scope.origSubscriber.sequence_num_settings;

                    if (!('is_targetable' in $scope.origSubscriber)) {
                        $scope.subscriber.is_targetable = true;
                    }

                    $scope.subscriber.products = [];
                    if ($scope.origSubscriber.products) {
                        _.each($scope.origSubscriber.products, function(p) {
                            $scope.subscriber.products.push($scope.productLookup[p]);
                        });
                    }
                    $scope.subscriber.products = $filter('sortByName')($scope.subscriber.products);

                    $scope.subscriber.global_filters = $scope.origSubscriber.global_filters || {};

                    $scope.destinations = [];
                    if (angular.isDefined($scope.subscriber.destinations)
                        && !_.isNull($scope.subscriber.destinations) &&
                        $scope.subscriber.destinations.length > 0) {

                        $scope.destinations = _.clone($scope.subscriber.destinations, true);
                    }

                    $scope.subscriberType = $scope.subscriber.subscriber_type || '';
                    $scope.changeFormats($scope.subscriberType);
                    initGlobalFilters();
                }, function() {
                    notify.error(gettext('Subscriber could not be initialized!'));
                });
            };

            /**
             * Reverts any changes made to the subscriber
             */
            $scope.cancel = function() {
                $scope.origSubscriber = null;
                $scope.subscriber = null;
                $scope.newDestination = null;
            };

            /**
             * Invoked when Subscriber Type is changed. Responsible for populating $scope.formats variable.
             * The $scope.formats variable is used to display format field in destination. The new value is changed.
             */
            $scope.changeFormats = function(newSubscriberType) {
                var formats = _.result(_.find($scope.subTypes, {qcode: newSubscriberType}), 'formats');

                if ($scope.destinations.length > 0 && $scope.subscriberType !== '' &&
                    $scope.subscriberType !== newSubscriberType) {

                    var oldFormats = _.result(_.find($scope.subTypes, {qcode: $scope.subscriberType}), 'formats');
                    if (!_.isEqual(oldFormats, formats)) {
                        notify.error(gettext('Error: Please re-assign new format for each destination as the changed ' +
                            'subscriber type has formats which are not supported by existing destination(s).'));

                        _.each($scope.destinations, function(destination) {
                            destination.format = null;
                        });
                    }
                }

                $scope.subscriberType = $scope.subscriber.subscriber_type;
                $scope.formats = formats;
            };

            fetchSubscribers();
        }
    };
}
