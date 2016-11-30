SpikeService.$inject = ['$location', 'api', 'notify', 'gettext', 'send', '$q'];

export function SpikeService($location, api, notify, gettext, send, $q) {
    var SPIKE_RESOURCE = 'archive_spike',
        UNSPIKE_RESOURCE = 'archive_unspike';

    /**
     * Spike given item.
     *
     * @param {Object} item
     * @returns {Promise}
     */
    this.spike = function(item) {
        return api.update(SPIKE_RESOURCE, item, {state: 'spiked'})
            .then(() => {
                if ($location.search()._id === item._id) {
                    $location.search('_id', null);
                }
                return item;
            }, (response) => {
                item.error = response;
                if (angular.isDefined(response.data._issues) &&
                    angular.isDefined(response.data._issues['validator exception'])) {
                    notify.error(gettext(response.data._issues['validator exception']));
                }
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

    /**
     * Unspike given item.
     *
     * @param {Object} item
     */
    this.unspike = function(item) {
        return getUnspikeDestination().then((config) => unspike(item, config));
    };

    function getUnspikeDestination() {
        return send.startConfig();
    }

    function unspike(item, config) {
        var data = {
            task: {
                desk: config.desk || null,
                stage: config.stage || null
            }
        };

        return api.update(UNSPIKE_RESOURCE, item, data)
            .then(() => {
                if ($location.search()._id === item._id) {
                    $location.search('_id', null);
                }
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
        getUnspikeDestination().then((config) => {
            items.forEach((item) => {
                unspike(item, config);
            });
        });
    };
}
