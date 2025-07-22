import _ from 'lodash';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {
    format,
    startOfDay,
    parseISO,
    addDays,
} from 'date-fns';
import {formatDate} from 'core/get-superdesk-api-implementation';

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
            $scope.subscriber = null;
            $scope.origSubscriber = null;
            $scope.subscribers = $scope.subscribersList || null;
            $scope.newDestination = null;
            $scope.contentFilters = null;
            $scope.apiProducts = null;
            $scope.directProducts = null;
            $scope.search = {};
            $scope.highPriorityQueueEnabled = appConfig.high_priority_queue_enabled;
            $scope.scheduleErrors = [];
            $scope.minEndDate = null;

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

                let diff = {};

                _.forOwn($scope.subscriber, (value, key) => {
                    if (_.includes(['api_products', 'products'], key)) {
                        diff[key] = _.map(value, '_id');
                        return;
                    }
                    diff[key] = value;
                });

                const {start_date, end_date} = $scope.subscriber.schedule || {};

                if (start_date != null && end_date != null) {
                    diff['schedule'] = {
                        start_date: format(start_date, 'yyyy-MM-dd'),
                        end_date: format(end_date, 'yyyy-MM-dd'),
                    };
                } else if ((start_date != null && end_date == null) || (start_date == null && end_date != null)) {
                    let msg = gettext(
                        'Both start and end date need to be filled in (or cleared) to save the subscriber.',
                    );

                    $scope.scheduleErrors = [msg];
                    notify.error(msg);
                    $scope.saveEnabled = false;
                    return;
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
                    $scope.subscriber = _.cloneDeep($scope.origSubscriber);
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
                            start_date: null,
                            end_date: null,
                        };
                    } else {
                        const {start_date, end_date} = $scope.subscriber.schedule;

                        $scope.subscriber.schedule.start_date = start_date ? startOfDay(parseISO(start_date)) : null;
                        $scope.subscriber.schedule.end_date = end_date ? startOfDay(parseISO(end_date)) : null;
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
                'subscriber.is_active',
                'subscriber.schedule.start_date',
                'subscriber.schedule.end_date',
            ], () => {
                $scope.validateScheduleDates();
            });


            $scope.updateStartDate = (date) => $scope.updateScheduleDate('start_date', date);
            $scope.updateEndDate = (date) => $scope.updateScheduleDate('end_date', date);

            /**
            * Updates schedule dates and triggers validation
            */
            $scope.updateScheduleDate = function(key, value) {
                if (!$scope.subscriber || !$scope.subscriber.schedule) return;

                $scope.subscriber.schedule[key] = value;

                if (key === 'start_date') {
                    if (value) {
                        const start = new Date(value);
                        const endDate = $scope.subscriber.schedule.end_date;

                        $scope.minEndDate = addDays(new Date(value), 1);

                        // Reset end_date if it's now invalid i.e before start date
                        if (endDate && new Date(endDate) < start) {
                            $scope.subscriber.schedule.end_date = null;
                        }
                    } else {
                        $scope.minEndDate = null;
                    }
                }

                $scope.$applyAsync(() => {
                    $scope.validateScheduleDates();
                });
            };

            /**
            * Validates schedule dates against status of subscriber and inform the user
            */
            $scope.validateScheduleDates = function() {
                if (!$scope.subscriber || !$scope.subscriber.schedule) return;

                $scope.scheduleErrors = [];

                const {start_date, end_date} = $scope.subscriber.schedule;
                const now = startOfDay(new Date());
                const start = start_date ? startOfDay(new Date(start_date)) : null;
                const end = end_date ? startOfDay(new Date(end_date)) : null;

                if ($scope.subscriber.is_active) {
                    if (start != null && start > now) {
                        $scope.scheduleErrors.push(gettext(
                            'The subscriber is set to start on {{date}}, ' +
                            'but the Active switch will override this and activate the subscriber on save.',
                            {date: formatDate(start)},
                        ));
                    }

                    if (end != null && end < now) {
                        $scope.scheduleErrors.push(gettext(
                            'The subscriber schedule ended on {{date}}, ' +
                            'but the Active switch will keep the subscriber active on save.',
                            {date: formatDate(end)},
                        ));
                    }
                } else if (
                    start != null && end != null &&
                    start <= now && end >= now
                ) {
                    $scope.scheduleErrors.push(gettext(
                        'The subscriber is currently inactive, but the schedule from ' +
                        '{{start}} to {{end}} is valid. The subscriber will be activated on save.',
                        {start: formatDate(start), end: formatDate(end)},
                    ));
                }
            };

            /**
             * Function to generate and set appropriate schedule/label messages
            */
            $scope.getScheduleOrStatusLabel = function(subscriber) {
                if (!subscriber) return '';

                const hasSchedule = subscriber.schedule?.start_date != null && subscriber.schedule?.end_date != null;

                if (hasSchedule) {
                    const {start_date, end_date} = subscriber.schedule;
                    const now = startOfDay(new Date());
                    const start = startOfDay(new Date(start_date));
                    const end = startOfDay(new Date(end_date));

                    if (subscriber.is_active) {
                        return gettext('Active until {{end}}', {end: formatDate(end)});
                    } else {
                        return gettext('Scheduled from {{start}} to {{end}}', {
                            start: formatDate(start),
                            end: formatDate(end),
                        });
                    }
                } else if (!subscriber.is_active) {
                    return gettext('Not Active');
                }

                return gettext('Active');
            };
        },
    };
}
