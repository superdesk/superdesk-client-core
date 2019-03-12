import _ from 'lodash';
import {isSuperdeskContent} from 'apps/workspace/helpers/isSuperdeskContent';
import {gettext} from 'core/utils';

PublishQueueController.$inject = [
    '$scope',
    'subscribersService',
    'api',
    '$q',
    'notify',
    '$location',
    'ingestSources',
    'vocabularies',
];

export function PublishQueueController($scope, subscribersService, api, $q, notify, $location, ingestSources,
    vocabularies) {
    $scope.subscribers = null;
    $scope.subscriberLookup = {};
    $scope.ingestProviders = null;
    $scope.ingestProvidersLookup = {};
    $scope.publish_queue = [];
    $scope.contentTypes = null;
    $scope.selectedFilterSubscriber = null;
    $scope.selectedFilterIngestProvider = null;
    $scope.selectedFilterContentType = null;
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

    $scope.$watch('page', () => {
        $scope.reload();
    });

    var promises = [];

    promises.push(subscribersService.fetchSubscribers().then((items) => {
        $scope.subscribers = items;
        $scope.subscriberLookup = _.keyBy(items, '_id');
    }));

    promises.push(ingestSources.fetchAllIngestProviders().then((items) => {
        $scope.ingestProviders = items;
        $scope.ingestProvidersLookup = _.keyBy($scope.ingestProviders, '_id');
    }));

    promises.push(vocabularies.getVocabulary('type').then((items) => {
        $scope.contentTypes = items.items;
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
    function populatePublishQueue() {
        fetchPublishQueue().then((queue) => {
            var queuedItems = queue._items;

            _.forEach(queuedItems, (item) => {
                angular.extend(item, {selected: false});
            });

            $scope.publish_queue = queuedItems;
            $scope.lastRefreshedAt = new Date();
            $scope.showResendBtn = false;
            $scope.showCancelSelectionBtn = false;
            $scope.maxPage = Math.ceil(queue._meta.total / $scope.pageSize);
        });
    }
    /*
    * Fetch the publish queue on the basis of built criteria.
    */
    function fetchPublishQueue() {
        var criteria = criteria || {};

        criteria.max_results = $scope.pageSize;
        criteria.page = $scope.page;

        var orTerms = null;

        if (!_.isEmpty($scope.searchQuery)) {
            orTerms = {$or: [
                {headline: {
                    $regex: $scope.searchQuery,
                    $options: '-i'},
                }, {unique_name: $scope.searchQuery},
            ]};
        }

        var filterTerms = [];

        if (!_.isNil($scope.selectedFilterSubscriber)) {
            filterTerms.push({subscriber_id: $scope.selectedFilterSubscriber._id});
        }
        if (!_.isNil($scope.selectedFilterStatus)) {
            filterTerms.push({state: $scope.selectedFilterStatus});
        }

        if (!_.isNil($scope.selectedFilterIngestProvider)) {
            filterTerms.push({ingest_provider: $scope.selectedFilterIngestProvider._id});
        }

        if (!_.isNil($scope.selectedFilterContentType)) {
            filterTerms.push({content_type: $scope.selectedFilterContentType.qcode});
        }

        var andTerms = [];

        _.each(filterTerms, (term) => {
            andTerms.push(term);
        });

        if (orTerms !== null) {
            andTerms.push(orTerms);
        }

        if (!_.isEmpty(andTerms)) {
            criteria.where = JSON.stringify({
                $and: andTerms,
            });
        }
        return api.publish_queue.query(criteria);
    }

    $scope.reload = function() {
        $q.all(promises).then(() => {
            populatePublishQueue();
            previewItem();
        });
    };

    $scope.buildNewSchedule = function(item) {
        var pickFields = ['item_id', 'item_version', 'publishing_action', 'formatted_item', 'headline',
            'content_type', 'subscriber_id', 'unique_name', 'destination', 'ingest_provider',
            'item_encoding', 'encoded_item_id'];

        var newItem = _.pick(item, pickFields);

        return newItem;
    };

    $scope.scheduleToSend = function(item) {
        var queueItems = [];

        if (angular.isDefined(item)) {
            queueItems.push($scope.buildNewSchedule(item));
        } else if ($scope.multiSelectCount > 0) {
            _.forEach($scope.selectedQueueItems, (item) => {
                queueItems.push($scope.buildNewSchedule(item));
            });
        }

        api.publish_queue.save([], queueItems).then(
            (response) => {
                $scope.reload();
                $scope.cancelSelection();
            },
            (response) => {
                if (angular.isDefined(response.data._issues)) {
                    if (angular.isDefined(response.data._issues['validator exception'])) {
                        notify.error(gettext('Error: ' + response.data._issues['validator exception']));
                    }
                } else {
                    notify.error(gettext('Error: Failed to re-schedule'));
                }
            },
        );
    };

    $scope.cancelSend = function(item) {
        var itemList = [];

        if (angular.isDefined(item)) {
            itemList.push(item);
        } else if ($scope.multiSelectCount > 0) {
            _.forEach($scope.selectedQueueItems, (item) => {
                if (item.state === 'pending' || item.state === 'retrying') {
                    item.state = 'canceled';
                    itemList.push(item);
                }
            });
        }

        _.forEach(itemList, (item) => {
            api.publish_queue.update(item, {state: 'canceled'});
        });
        $scope.cancelSelection();
    };

    $scope.filterPublishQueue = function(item, type) {
        switch (type) {
        case 'subscriber':
            $scope.selectedFilterSubscriber = item;
            break;
        case 'ingest_provider':
            $scope.selectedFilterIngestProvider = item;
            break;
        case 'status':
            $scope.selectedFilterStatus = item;
            break;
        case 'type':
            $scope.selectedFilterContentType = item;
            break;
        default:
            $scope.selectedFilterSubscriber = null;
            $scope.selectedFilterIngestProvider = null;
            $scope.selectedFilterStatus = null;
            $scope.selectedFilterContentType = null;
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
        var idx = _.findIndex($scope.selectedQueueItems,
            (item: any) => _.includes(['pending', 'in-progress', 'retrying'], item.state));

        /* All selected items can be resent */
        if (idx === -1) {
            $scope.showResendBtn = true;
            $scope.showCancelBtn = false;
            $scope.showCanceSelectionlBtn = false;
        } else {
            /* Find the index of any item that can be resent */
            idx = _.findIndex($scope.selectedQueueItems,
                (item: any) => item.state === 'success' || item.state === 'in-progress' || item.state === 'canceled' ||
                    item.state === 'error' || item.state === 'retrying');
            /* Nothing to resend found */
            if (idx === -1) {
                $scope.showResendBtn = false;
                $scope.showCancelSelectionBtn = true;
                /* look for items that can be canceled */
                idx = _.findIndex($scope.selectedQueueItems,
                    (item: any) => item.state === 'pending' || item.state === 'retrying');
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

    function refreshQueueState(data) {
        var item = _.find($scope.publish_queue, {_id: data.queue_id});

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
        var queueItem: any = _.find($scope.publish_queue, {_id: $location.search()._id}) || null;

        $scope.selected.extensionPoint = false;

        if (queueItem) {
            if (isSuperdeskContent(queueItem.content_type)) {
                api.archive.getById(queueItem.item_id, {version: queueItem.item_version})
                    .then((item) => {
                        $scope.selected.preview = item;
                    });
            } else {
                $scope.selected.preview = queueItem;
                $scope.selected.extensionPoint = true;
            }
        } else {
            $scope.selected.preview = null;
        }
    }

    $scope.$on('$routeUpdate', previewItem);

    $scope.$on('publish_queue:update', (evt, data) => {
        refreshQueueState(data);
    });
    $scope.reload();
}
