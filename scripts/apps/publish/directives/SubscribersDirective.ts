import _ from 'lodash';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import moment from 'moment';

/**
 * @ngdoc directive
 * @module superdesk.apps.publish
 * @name sdAdminPubSubscribers
 * @requires notify
 * @requires api
 * @requires subscribersService
 * @requires adminPublishSettingsService
 * @requires modal
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
    'contentFilters', '$q', '$filter', 'products', '$rootScope',
];

export function SubscribersDirective(
    notify, api, subscribersService, adminPublishSettingsService,
    modal, contentFilters, $q, $filter, products, $rootScope,
) {
    return {
        scope: {
            subscribersList: '=',
            hideHeader: '=',
        },
        templateUrl: 'scripts/apps/publish/views/subscribers.html',
        link: function($scope) {
            const SCHEDULE_DATE_FORMAT = 'DD-MM-YYYY';

            $scope.subscriber = null;
            $scope.origSubscriber = null;
            $scope.subscribers = $scope.subscribersList || null;
            $scope.newDestination = null;
            $scope.contentFilters = null;
            $scope.apiProducts = null;
            $scope.directProducts = null;
            $scope.search = {};
            $scope.highPriorityQueueEnabled = appConfig.high_priority_queue_enabled;
            $scope.scheduleError = {
                activeBeforeStartErrorMessage: null,
                activeAfterEndErrorMessage: null,
            };

            api.query('output_formats').then((result) => {
                $scope.formats = result._items.map((format) => ({
                    name: format.name,
                    qcode: format.type,
                }));
            });

            $scope.statusFilters = [
                {label: gettext('Active'), value: true, id: 'active'},
                {label: gettext('Both'), value: null, id: 'both'},
                {label: gettext('Inactive'), value: false, id: 'inactive'},
            ];

            $scope.subTypes = [
                {name: gettext('All'), qcode: 'all'},
                {name: gettext('Digital/Internet'), qcode: 'digital'},
                {name: gettext('Wire/Paper'), qcode: 'wire'},
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
                $scope.saveEnabled = true;
            };

            /**
             * Removes the selected destination from the destinations list of the selected subscriber.
             */
            $scope.deleteDestination = function(destination) {
                _.remove($scope.destinations, destination);
                $scope.saveEnabled = true;
            };

            /**
             * Upserts the selected subscriber.
             */
            $scope.save = function() {
                $scope.subscriber.destinations = $scope.destinations;
                $scope.verifyScheduleBeforeSave();

                let diff = {};

                _.forOwn($scope.subscriber, (value, key) => {
                    if (_.includes(['api_products', 'products'], key)) {
                        diff[key] = _.map(value, '_id');
                        return;
                    }
                    diff[key] = value;
                });

                if ($scope.subscriber.schedule) {
                    diff.schedule = {
                        startDate: $scope.subscriber.schedule.startDate
                            ? moment.utc($scope.subscriber.schedule.startDate, SCHEDULE_DATE_FORMAT).startOf('day').toISOString()
                            : null,
                        endDate: $scope.subscriber.schedule.endDate
                            ? moment.utc($scope.subscriber.schedule.endDate, SCHEDULE_DATE_FORMAT).startOf('day').toISOString()
                            : null,
                    };
                }

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

                    if (!$scope.subscriber.schedule) {
                        $scope.subscriber.schedule = {
                            startDate: null,
                            endDate: null,
                        };
                    } else {
                        $scope.subscriber.schedule = {
                            startDate: $scope.subscriber.schedule.startDate
                                ? moment.utc($scope.subscriber.schedule.startDate).format(SCHEDULE_DATE_FORMAT)
                                : null,
                            endDate: $scope.subscriber.schedule.endDate
                                ? moment.utc($scope.subscriber.schedule.endDate).format(SCHEDULE_DATE_FORMAT)
                                : null,
                        };
                    }

                    $scope.destinations = [];
                    if (angular.isDefined($scope.subscriber.destinations)
                        && !_.isNull($scope.subscriber.destinations) &&
                        $scope.subscriber.destinations.length > 0) {
                        $scope.destinations = _.clone($scope.subscriber.destinations);
                    }

                    $scope.subscriberType = $scope.subscriber.subscriber_type || '';
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

            $scope.$watch('subscriber', (newValue, oldValue) => {
                if (newValue && oldValue) {
                    $scope.saveEnabled = true;
                } else {
                    $scope.saveEnabled = false;
                }
            }, true);

            $rootScope.$on('subcriber: saveEnabled', () => $scope.saveEnabled = true);

            // If subscribers list provided don't fetch subscribers
            if (!$scope.subscribersList) {
                fetchSubscribers();
            }

            $scope.$watchGroup([
                'subscriber.schedule.startDate',
                'subscriber.schedule.endDate',
                'subscriber.is_active',
            ], () => {
                $scope.updateScheduleErrors();
            });

            /**
            * Checks if the subscriber is active outside the scheduled start and end dates.
            * Sets error flags and messages if needed.
            */
            $scope.updateScheduleErrors = function() {
                if (!$scope.subscriber || !$scope.subscriber.schedule) return;

                const s = $scope.subscriber.schedule;
                const now = moment.utc();
                const startDate = s.startDate ? moment.utc(s.startDate, SCHEDULE_DATE_FORMAT).startOf('day') : null;
                const endDate = s.endDate ? moment.utc(s.endDate, SCHEDULE_DATE_FORMAT).startOf('day') : null;

                $scope.scheduleError = {
                    activeBeforeStart: false,
                    activeAfterEnd: false,
                    activeBeforeStartErrorMessage: '',
                    activeAfterEndErrorMessage: '',
                };
                
                if ($scope.subscriber.is_active) {
                    if (startDate && now.isBefore(startDate)) {
                        $scope.scheduleError.activeBeforeStartErrorMessage =
                            `This subscriber is active now but will be deactivated until ${startDate.format('LL')}`;
                    }

                    if (endDate && now.isAfter(endDate)) {
                        $scope.scheduleError.activeAfterEndErrorMessage =
                            `This subscriber is active but was scheduled to deactivate after ${endDate.format('LL')}`;
                    }
                }
            };

            /**
            * Function called before saving to check if user sets a future 
            * start date and schedule is active even with warning, so we deactivate it
            */
            $scope.verifyScheduleBeforeSave = function() {
                if (!$scope.subscriber || !$scope.subscriber.schedule) return;

                const s = $scope.subscriber.schedule;
                const startDate = s.startDate ? moment.utc(s.startDate).startOf('day').toDate() : null;
                const now = moment.utc();

                if (startDate && now.isBefore(startDate) && $scope.subscriber.is_active) {
                    $scope.subscriber.is_active = false;
                }
            };

            /**
            * Function to clear both start and end dates from the subscriber's schedule.
            */
            $scope.clearScheduleDates = function() {
                if (!$scope.subscriber || !$scope.subscriber.schedule) return;

                $scope.subscriber.schedule.startDate = null;
                $scope.subscriber.schedule.endDate = null;
                $scope.saveEnabled = true;
            };
        },
    };
}
