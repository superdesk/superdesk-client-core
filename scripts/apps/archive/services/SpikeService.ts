import {gettext} from 'core/utils';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';

/**
 * @ngdoc service
 * @module superdesk.apps.archive
 * @name spike
 *
 * @requires $location
 * @requires api
 * @requires notify
 * @requires send
 * @requires $q
 * @requires authoring
 * @requires authoringWorkspace
 * @requires superdeskFlags
 *
 * @description Spike Service is responsible for proving item (single and multiple) spike/un-spike functionality
 */

SpikeService.$inject = ['$location', 'api', 'notify', 'send', '$q', 'authoringWorkspace', 'lock', 'desks'];
export function SpikeService($location, api, notify, send,
    $q, authoringWorkspace: AuthoringWorkspaceService, lock, desks) {
    var SPIKE_RESOURCE = 'archive_spike',
        UNSPIKE_RESOURCE = 'archive_unspike';

    /**
     * Spike given item.
     *
     * @param {Object} item
     * @returns {Promise}
     */
    this.spike = function(item) {
        return (
            item.state !== 'unpublished'
                ? Promise.resolve(item)
                : api.find('archive', item._id)
                    .then((updateItem) => {
                        return Promise.resolve(updateItem);
                    })
        ).then((result) => {
            return api.update(SPIKE_RESOURCE, result, {state: 'spiked'})
                .then(() => {
                    if ($location.search()._id === result._id) {
                        $location.search('_id', null);
                    }
                    closeAuthoring(result);
                    return result;
                }, (response) => {
                    result.error = response;
                    if (angular.isDefined(response.data._issues) &&
                        angular.isDefined(response.data._issues['validator exception'])) {
                        notify.error(gettext(response.data._issues['validator exception']));
                    }
                });
        });
    };

    /**
     * Spike given items.
     *
     * @param {Object} items
     * @returns {Promise}
     */
    this.spikeMultiple = function spikeMultiple(items) {
        return $q.all(items.map(this.spike));
    };

    function setStageDeskForUnpublishItems(items) {
        return Promise.all(items.map((item) => {
            return api.find('archive', item._id).then((result) => {
                if (result.revert_state === 'unpublished') {
                    const currentDesk = desks.getCurrentDesk();

                    return Promise.resolve({
                        item: item,
                        desk: currentDesk._id,
                        stage: currentDesk.working_stage,
                    });
                } else {
                    return Promise.resolve({
                        item: item,
                        desk: null,
                        stage: null,
                    });
                }
            });
        }));
    }

    /**
     * Unspike given item.
     *
     * @param {Object} item
     */
    this.unspike = function(item) {
        return setStageDeskForUnpublishItems([item]).then((items) => {
            items.map((_item: any) => {
                if (_item.desk != null && _item.stage != null) {
                    var data = {
                        stage: _item.stage,
                        desk: _item.desk,
                    };

                    return unspike(_item.item, data);
                }
                return getUnspikeDestination().then((config) => unspike(_item.item, config));
            });
        });
    };

    function getUnspikeDestination() {
        return send.startConfig();
    }

    function unspike(item, config) {
        var data = {
            task: {
                desk: config.desk || null,
                stage: config.stage || null,
            },
        };

        return api.update(UNSPIKE_RESOURCE, item, data)
            .then(() => {
                if ($location.search()._id === item._id) {
                    $location.search('_id', null);
                }
                closeAuthoring(item);
                return item;
            }, (response) => {
                item.error = response;
            });
    }

    /**
     * Unspike given items.
     *
     * @param {Object} items
     */
    this.unspikeMultiple = function unspikeMultiple(items) {
        return setStageDeskForUnpublishItems(items).then((_items) => {
            const unpublishItemLength = _items.filter((item: any) => item.desk != null && item.stage != null).length;

            if (unpublishItemLength !== _items.length) {
                getUnspikeDestination().then((config) => {
                    _items.forEach((item: any) => {
                        if (item.desk != null && item.stage != null) {
                            var data = {desk: item.desk, stage: item.stage};

                            unspike(item.item, data);
                        } else {
                            unspike(item.item, config);
                        }
                    });
                });
            } else {
                _items.forEach((item: any) => {
                    var data = {desk: item.desk, stage: item.stage};

                    unspike(item.item, data);
                });
            }
        });
    };

    /**
     * @ngdoc method
     * @name spike#closeAuthoring
     * @private
     * @description Checks if the item is locked (and open by authoring). If yes, unlocks (and closes) it
     * @param {Object} item
     */
    function closeAuthoring(item) {
        const authoringItem = authoringWorkspace.getItem();
        let closeWorkSpace;

        if (authoringItem && authoringItem._id === item._id) {
            closeWorkSpace = true;
        }

        if (item.state === 'spiked' && closeWorkSpace) { // Unspiked item opened in authoring
            authoringWorkspace.close();
        } else if (item.lock_user) { // lock is held by session user (verified at activity.additionalCondition)
            lock.unlock(item);
            if (closeWorkSpace) {
                authoringWorkspace.close(true);
            }
        }
    }
}
