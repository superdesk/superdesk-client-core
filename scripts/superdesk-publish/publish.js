/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

var app = angular.module('superdesk.publish', ['superdesk.users', 'superdesk.content_filters']);

app.value('transmissionTypes', {
    ftp: {
        label: 'FTP',
        templateUrl: 'scripts/superdesk-publish/views/ftp-config.html',
        config: {passive: true}
    },
    email: {
        label: 'Email',
        templateUrl: 'scripts/superdesk-publish/views/email-config.html'
    },
    ODBC: {
        label: 'ODBC',
        templateUrl: 'scripts/superdesk-publish/views/odbc-config.html'
    },
    File: {
        label: 'File',
        templateUrl: 'scripts/superdesk-publish/views/file-config.html'
    },
    pull: {
        label: 'Pull'
    },
    http_push: {
        label: 'HTTP Push',
        templateUrl: 'scripts/superdesk-publish/views/http-push-config.html'
    }
});

AdminPublishSettingsController.$inject = ['$scope', 'privileges'];
function AdminPublishSettingsController($scope, privileges) {
    var user_privileges = privileges.privileges;

    $scope.showSubscribers  = Boolean(user_privileges.subscribers);
    $scope.showFilterConditions  = Boolean(user_privileges.publish_filters);
}

SubscribersService.$inject = ['api', '$q', '$filter'];
function SubscribersService(api, $q, $filter) {
    /**
     * Recursively returns all subscribers
     *
     * @return {*}
     */
    var _getAllSubscribers = function(criteria, page, subscribers) {
        page = page || 1;
        subscribers = subscribers || [];
        criteria = criteria || {};

        return api.query('subscribers', _.extend({max_results: 200, page: page}, criteria))
        .then(function(result) {
            subscribers = subscribers.concat(result._items);
            if (result._links.next) {
                page++;
                return _getAllSubscribers(criteria, page, subscribers);
            }
            return $filter('sortByName')(subscribers);
        });
    };

    var service = {
        fetchSubscribers: function(criteria) {
            return _getAllSubscribers(criteria);
        },

        fetchActiveSubscribers: function(criteria) {
            return _getAllSubscribers(criteria).then(function(result) {
                return _.filter(result, {'is_active': true});
            });
        },

        fetchTargetableSubscribers: function(criteria) {
            return _getAllSubscribers(criteria).then(function(result) {
                return _.filter(result, function(r) {
                    return (!('is_targetable' in r) || r.is_targetable) && r.is_active;
                });
            });
        },

        fetchSubscribersByKeyword: function(keyword) {
            return this.fetchSubscribers({'$or': [{name: {'$regex': keyword, '$options': '-i'}}]});
        },

        fetchSubscribersByIds: function(ids) {
            var parts = [];
            _.each(ids, function(id) {
                parts.push({_id: id});
            });
            return this.fetchSubscribers({'$or': parts});
        }
    };

    return service;
}

AdminPublishSettingsService.$inject = ['api'];
function AdminPublishSettingsService(api) {
    var _fetch = function(endpoint, criteria) {
        return api[endpoint].query(criteria);
    };

    var service = {
        fetchPublishErrors: function() {
            var criteria = {'io_type': 'publish'};
            return _fetch('io_errors', criteria);
        }
    };

    return service;
}

DestinationDirective.$inject = ['transmissionTypes'];
function DestinationDirective(transmissionTypes) {
    return {
        templateUrl: 'scripts/superdesk-publish/views/destination.html',
        scope: {
            destination: '=',
            actions: '='
        },
        link: function ($scope) {
            $scope.types = transmissionTypes;

            $scope.$watch('destination.delivery_type', function(type) {
                if (type && !$scope.destination.config && $scope.types[type].config) {
                    $scope.destination.config = angular.extend({}, $scope.types[type].config);
                }
            });
        }
    };
}

DataConsistencyController.$inject = ['$scope', 'api'];
function DataConsistencyController($scope, api) {
    $scope.consistency_records = null;

    function fetchConsistencyRecords () {
        var criteria = criteria || {};
        criteria.max_results = 200;
        return api.consistency.query(criteria);
    }

    $scope.reload = function() {
        fetchConsistencyRecords().then(function(data) {
            $scope.consistency_records = data._items;
            $scope.lastRefreshedAt = new Date();
        });
    };

    $scope.reload ();
}

PublishQueueController.$inject = [
    '$scope',
    'subscribersService',
    'api',
    '$q',
    'notify',
    '$location',
    'ingestSources'
];
function PublishQueueController($scope, subscribersService, api, $q, notify, $location, ingestSources) {
    $scope.subscribers = null;
    $scope.subscriberLookup = {};
    $scope.ingestProviders = null;
    $scope.ingestProvidersLookup = {};
    $scope.publish_queue = [];
    $scope.selectedFilterSubscriber = null;
    $scope.selectedFilterIngestProvider = null;
    $scope.multiSelectCount = 0;
    $scope.selectedQueueItems = [];
    $scope.showResendBtn = false;
    $scope.showCancelBtn = false;
    $scope.showCancelSelectionBtn = false;
    $scope.queueSearch = false;
    $scope.selected = {};
    $scope.publish_queue_statuses = ['pending', 'in-progress', 'success', 'error', 'retrying', 'failed', 'canceled'];
    $scope.pageSize = 25;
    $scope.page = 1;

    $scope.$watch('page', function() {
        $scope.reload();
    });

    var promises = [];

    promises.push(subscribersService.fetchSubscribers().then(function(items) {
        $scope.subscribers = items;
        $scope.subscriberLookup = _.keyBy(items, '_id');
    }));

    promises.push(ingestSources.fetchAllIngestProviders().then(function(items) {
        $scope.ingestProviders = items;
        $scope.ingestProvidersLookup = _.keyBy($scope.ingestProviders, '_id');
    }));

    /*
    * Get search input from search box to search for headline or unique_name,
    * and perfrom reload function to populate publish queue.
    */
    $scope.search = function(query) {
        $scope.searchQuery = query;
        $scope.page = 1;
        $scope.reload();
    };

    /*
    * Populates the publish queue and update the flags after fetch operation.
    */
    function populatePublishQueue () {
        fetchPublishQueue().then(function(queue) {
            var queuedItems = queue._items;

            _.forEach(queuedItems, function(item) {
                angular.extend(item, {'selected': false});
            });

            $scope.publish_queue = queuedItems;
            $scope.lastRefreshedAt = new Date();
            $scope.showResendBtn = false;
            $scope.showCancelSelectionBtn = false;
            $scope.maxPage =  Math.ceil(queue._meta.total / $scope.pageSize);
        });
    }
    /*
    * Fetch the publish queue on the basis of built criteria.
    */
    function fetchPublishQueue () {
        var criteria = criteria || {};
        criteria.max_results = $scope.pageSize;
        criteria.page = $scope.page;

        var orTerms = null;
        if (!_.isEmpty($scope.searchQuery)) {
            orTerms = {'$or': [{'headline':{'$regex': $scope.searchQuery, '$options':'-i'}}, {'unique_name': $scope.searchQuery}]};
        }

        var filterTerms = [];
        if ($scope.selectedFilterSubscriber != null) {
            filterTerms.push({'subscriber_id': $scope.selectedFilterSubscriber._id});
        }
        if ($scope.selectedFilterStatus != null) {
            filterTerms.push({'state': $scope.selectedFilterStatus});
        }

        if ($scope.selectedFilterIngestProvider != null) {
            filterTerms.push({'ingest_provider': $scope.selectedFilterIngestProvider._id});
        }

        var andTerms = [];
        _.each(filterTerms, function(term) {
            andTerms.push(term);
        });

        if (orTerms !== null) {
            andTerms.push(orTerms);
        }

        if (!_.isEmpty(andTerms)) {
            criteria.where = JSON.stringify ({
                '$and': andTerms
            });
        }
        return api.publish_queue.query(criteria);
    }

    $scope.reload = function() {
        $q.all(promises).then(function() {
            populatePublishQueue();
            previewItem();
        });
    };

    $scope.buildNewSchedule = function (item) {
        var pick_fields = ['item_id', 'item_version', 'publishing_action', 'formatted_item', 'headline',
            'content_type', 'subscriber_id', 'unique_name', 'destination', 'ingest_provider', 'item_encoding', 'encoded_item_id'];

        var newItem = _.pick(item, pick_fields);
        return newItem;
    };

    $scope.scheduleToSend = function(item) {
        var queueItems = [];

        if (angular.isDefined(item)) {
            queueItems.push($scope.buildNewSchedule(item));
        } else if ($scope.multiSelectCount > 0) {
            _.forEach($scope.selectedQueueItems, function(item) {
                queueItems.push($scope.buildNewSchedule(item));
            });
        }

        api.publish_queue.save([], queueItems).then(
            function(response) {
                $scope.reload();
                $scope.cancelSelection();
            },
            function(response) {
                if (angular.isDefined(response.data._issues)) {
                    if (angular.isDefined(response.data._issues['validator exception'])) {
                        notify.error(gettext('Error: ' + response.data._issues['validator exception']));
                    }
                } else {
                    notify.error(gettext('Error: Failed to re-schedule'));
                }
            }
        );
    };

    $scope.cancelSend = function(item) {
        var itemList = [];
        if (angular.isDefined(item)) {
            itemList.push(item);
        } else if ($scope.multiSelectCount > 0) {
            _.forEach($scope.selectedQueueItems, function(item) {
                if (item.state === 'pending' || item.state === 'retrying') {
                    item.state = 'canceled';
                    itemList.push(item);
                }
            });
        }

        _.forEach(itemList, function(item) {
            api.publish_queue.update(item, {state: 'canceled'});
        });
        $scope.cancelSelection();
    };

    $scope.filterPublishQueue = function(item, type) {
        switch (type){
            case 'subscriber':
                $scope.selectedFilterSubscriber = item;
                break;
            case 'ingest_provider':
                $scope.selectedFilterIngestProvider = item;
                break;
            case 'status':
                $scope.selectedFilterStatus = item;
                break;
            default:
                $scope.selectedFilterSubscriber = null;
                $scope.selectedFilterIngestProvider = null;
                $scope.selectedFilterStatus = null;
        }
        populatePublishQueue();
        $scope.multiSelectCount = 0;
        $scope.selectedQueueItems = [];
        $scope.page = 1;
    };

    $scope.selectQueuedItem = function(queuedItem) {
        if (queuedItem.selected) {
            $scope.selectedQueueItems = _.union($scope.selectedQueueItems, [queuedItem]);
        } else {
            $scope.selectedQueueItems = _.without($scope.selectedQueueItems, queuedItem);
        }

        /* look for any items in states that cannot be resent */
        var idx = _.findIndex($scope.selectedQueueItems, function(item) {
            return _.includes(['pending', 'in-progress', 'retrying'], item.state);
        });

        /* All selected items can be resent */
        if (idx === -1) {
            $scope.showResendBtn = true;
            $scope.showCancelBtn = false;
            $scope.showCanceSelectionlBtn = false;
        } else {
            /* Find the index of any item that can be resent */
            idx = _.findIndex($scope.selectedQueueItems, function(item) {
                return item.state === 'success' || item.state === 'in-progress' || item.state === 'canceled' ||
                    item.state === 'error' || item.state === 'retrying';
            });
            /* Nothing to resend found */
            if (idx === -1) {
                $scope.showResendBtn = false;
                $scope.showCancelSelectionBtn = true;
                /* look for items that can be canceled */
                idx = _.findIndex($scope.selectedQueueItems, function(item) {
                    return item.state === 'pending' || item.state === 'retrying';
                });
                /* Something can be canceled so show the button */
                if (idx !== -1) {
                    $scope.showCancelBtn = true;
                } else {
                    $scope.showCancelBtn = false;
                }
            } else {
                $scope.showResendBtn = false;
                $scope.showCancelBtn = false;
                $scope.showCancelSelectionBtn = false;
            }
        }

        $scope.multiSelectCount = $scope.selectedQueueItems.length;
    };

    $scope.cancelSelection = function() {
        $scope.selectedQueueItems = [];
        $scope.multiSelectCount = 0;
        populatePublishQueue();
    };

    function refreshQueueState (data) {
        var item = _.find($scope.publish_queue, {'_id': data.queue_id});

        if (item) {
            var fields = ['error_message', 'completed_at', 'state'];
            angular.extend(item, _.pick(data, fields));
            $scope.$apply();
        }
    }

    $scope.preview = function(queueItem) {
        $location.search('_id', queueItem ? queueItem._id : queueItem);
    };

    function previewItem() {
        var queueItem = _.find($scope.publish_queue, {_id: $location.search()._id}) || null;
        if (queueItem) {
            api.archive.getById(queueItem.item_id, {'version': queueItem.item_version})
                .then(function(item) {
                    $scope.selected.preview = item;
                });
        } else {
            $scope.selected.preview = null;
        }
    }

    $scope.$on('$routeUpdate', previewItem);

    $scope.$on('publish_queue:update', function(evt, data) { refreshQueueState(data); });
    $scope.reload();
}

SubscribersDirective.$inject = [
    'gettext', 'notify', 'api', 'subscribersService', 'adminPublishSettingsService', 'modal',
    'metadata', 'contentFilters', '$q', '$filter', 'products'
];
function SubscribersDirective(
    gettext, notify, api, subscribersService, adminPublishSettingsService,
    modal, metadata, contentFilters, $q, $filter, products) {

    return {
        templateUrl: 'scripts/superdesk-publish/views/subscribers.html',
        link: function ($scope) {
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
             * Either initializes a new Subscriber object for adding a new subscriber or initializes the subscriber object with
             * the selected subscriber allowing user to update the subscriber details.
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

                    $scope.subscriber.global_filters =  $scope.origSubscriber.global_filters || {};

                    $scope.destinations = [];
                    if (angular.isDefined($scope.subscriber.destinations) && !_.isNull($scope.subscriber.destinations) &&
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

app
    .service('adminPublishSettingsService', AdminPublishSettingsService)
    .service('subscribersService', SubscribersService)
    .directive('sdAdminPubSubscribers', SubscribersDirective)
    .directive('sdDestination', DestinationDirective)
    .controller('publishQueueCtrl', PublishQueueController);

app
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/publish', {
                label: gettext('Publish'),
                templateUrl: 'scripts/superdesk-publish/views/settings.html',
                controller: AdminPublishSettingsController,
                category: superdesk.MENU_SETTINGS,
                privileges: {subscribers: 1},
                priority: 2000
            })
            .activity('/publish_queue', {
                label: gettext('Publish Queue'),
                templateUrl: 'scripts/superdesk-publish/views/publish-queue.html',
                sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html',
                controller: PublishQueueController,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                privileges: {publish_queue: 1}
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('subscribers', {
            type: 'http',
            backend: {
                rel: 'subscribers'
            }
        });
        apiProvider.api('publish_queue', {
            type: 'http',
            backend: {
                rel: 'publish_queue'
            }
        });
        apiProvider.api('consistency', {
            type: 'http',
            backend: {
                rel: 'consistency'
            }
        });
        apiProvider.api('legal_publish_queue', {
            type: 'http',
            backend: {
                rel: 'legal_publish_queue'
            }
        });
        apiProvider.api('io_errors', {
            type: 'http',
            backend: {
                rel: 'io_errors'
            }
        });
    }]);

export default app;
