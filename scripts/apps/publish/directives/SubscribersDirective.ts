import _ from 'lodash';
import {gettext} from 'core/utils';

/**
 * @ngdoc directive
 * @module superdesk.apps.publish
 * @name sdAdminPubSubscribers
 * @requires notify
 * @requires api
 * @requires subscribersService
 * @requires adminPublishSettingsService
 * @requires modal
 * @requires metadata
 * @requires contentFilters
 * @requires $q
 * @requires $filter
 * @requires products
 * @param {Array} subscribersList - provided list of subscribers to display
 * @param {Boolean} hideHeader - controls the visibility of the header section
 * @description SubscribersDirective handles subscriber maintenance.
 */
SubscribersDirective.$inject = [
    'notify', 'api', 'subscribersService', 'adminPublishSettingsService', 'modal',
    'metadata', 'contentFilters', '$q', '$filter', 'products',
];

export function SubscribersDirective(
    notify, api, subscribersService, adminPublishSettingsService,
    modal, metadata, contentFilters, $q, $filter, products) {
    return {
        scope: {
            subscribersList: '=',
            hideHeader: '=',
        },
        templateUrl: 'scripts/apps/publish/views/subscribers.html',
        link: function($scope) {
            $scope.subscriber = null;
            $scope.origSubscriber = null;
            $scope.subscribers = $scope.subscribersList || null;
            $scope.newDestination = null;
            $scope.contentFilters = null;
            $scope.apiProducts = null;
            $scope.directProducts = null;
            $scope.subTypes = null;
            $scope.search = {};

            if (angular.isDefined(metadata.values.subscriber_types)) {
                $scope.subTypes = metadata.values.subscriber_types;
            } else {
                metadata.fetchMetadataValues().then(() => {
                    $scope.subTypes = metadata.values.subscriber_types;
                });
            }

            $scope.statusFilters = [
                {label: gettext('Active'), value: true, id: 'active'},
                {label: gettext('Both'), value: null, id: 'both'},
                {label: gettext('Inactive'), value: false, id: 'inactive'},
            ];
            $scope.search.subscriber_status = $scope.statusFilters[0];
            /**
             * Fetches all subscribers from backend
             */
            const fetchSubscribers = () => {
                subscribersService.fetchSubscribers().then(
                    (result) => {
                        $scope.subscribers = result;
                    },
                );
            };

            /**
             * Fetches content filters from backend and returns the same.
             *
             * @return {*}
             */
            const fetchProducts = () =>
                products.fetchAllProducts().then((items) => {
                    $scope.productLookup = [];
                    _.each(items, (item) => {
                        item.name += ` [${item.product_type || 'both'}]`;
                        $scope.productLookup[item._id] = item;
                    });
                    $scope.directProducts = _.filter(items, (item) =>
                        _.includes(['direct', 'both'], item.product_type || 'both'));
                    $scope.apiProducts = _.filter(items, (item) =>
                        _.includes(['api', 'both'], item.product_type || 'both'));
                });

            /**
             * Initializes the Global Filters on the selected subscriber.
             */
            const initGlobalFilters = () => {
                if (!$scope.subscriber) {
                    return;
                }

                if (!$scope.subscriber.global_filters) {
                    $scope.subscriber.global_filters = {};
                }

                _.each($scope.globalFilters, (filter) => {
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
            const fetchGlobalContentFilters = () =>
                contentFilters.getGlobalContentFilters().then((filters) => {
                    $scope.globalFilters = filters;
                });

            /**
             * Fetch list of publish errors from the backend allowing the user to configure for the selected subscriber.
             *
             * @return {*}
             */
            const fetchPublishErrors = () =>
                adminPublishSettingsService.fetchPublishErrors().then((result) => {
                    $scope.all_errors = result._items[0].all_errors;
                });

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

                let diff = {};

                _.forOwn($scope.subscriber, (value, key) => {
                    if (_.includes(['api_products', 'products'], key)) {
                        diff[key] = _.map(value, '_id');
                        return;
                    }
                    diff[key] = value;
                });

                api.subscribers.save($scope.origSubscriber, diff)
                    .then(
                        () => {
                            notify.success(gettext('Subscriber saved.'));
                            $scope.cancel();
                        },
                        (response) => {
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
                        },
                    )
                    .then(fetchSubscribers);
            };

            /**
             * Either initializes a new Subscriber object for adding a new subscriber or
             * initializes the subscriber object with the selected subscriber allowing
             * user to update the subscriber details.
             */
            $scope.edit = function(subscriber) {
                let promises = [];

                promises.push(fetchPublishErrors());
                promises.push(fetchProducts());
                promises.push(fetchGlobalContentFilters());

                $q.all(promises).then(() => {
                    $scope.origSubscriber = subscriber || {};
                    $scope.subscriber = _.create($scope.origSubscriber);
                    $scope.subscriber.critical_errors = $scope.origSubscriber.critical_errors;
                    $scope.subscriber.sequence_num_settings = $scope.origSubscriber.sequence_num_settings;

                    if (!('is_targetable' in $scope.origSubscriber)) {
                        $scope.subscriber.is_targetable = true;
                    }

                    initSubscriberProducts('products');
                    initSubscriberProducts('api_products');

                    $scope.subscriber.global_filters = $scope.origSubscriber.global_filters || {};

                    $scope.destinations = [];
                    if (angular.isDefined($scope.subscriber.destinations)
                        && !_.isNull($scope.subscriber.destinations) &&
                        $scope.subscriber.destinations.length > 0) {
                        $scope.destinations = _.clone($scope.subscriber.destinations);
                    }

                    $scope.subscriberType = $scope.subscriber.subscriber_type || '';
                    $scope.changeFormats($scope.subscriberType);
                    initGlobalFilters();
                }, () => {
                    notify.error(gettext('Subscriber could not be initialized!'));
                });
            };

            /**
             * Initialize Subscriber Products
             * @param field
             */
            function initSubscriberProducts(field) {
                $scope.subscriber[field] = [];

                if (_.get($scope.origSubscriber, field)) {
                    _.each($scope.origSubscriber[field], (p) => {
                        $scope.subscriber[field].push($scope.productLookup[p]);
                    });
                }
                $scope.subscriber[field] = $filter('sortByName')($scope.subscriber[field]);
            }

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

                        _.each($scope.destinations, (destination) => {
                            destination.format = null;
                        });
                    }
                }

                $scope.subscriberType = $scope.subscriber.subscriber_type;
                $scope.formats = formats;
            };

            // If subscribers list provided don't fetch subscribers
            if (!$scope.subscribersList) {
                fetchSubscribers();
            }
        },
    };
}
