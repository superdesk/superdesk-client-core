import _ from 'lodash';

SubscribersService.$inject = ['api', '$q', '$filter'];
export function SubscribersService(api, $q, $filter) {
    /**
     * Recursively returns all subscribers
     *
     * @return {*}
     */
    var _getAllSubscribers = function(criteria = {}, page = 1, subscribers = []) {
        return api.query('subscribers', _.extend({max_results: 200, page: page}, criteria))
            .then((result) => {
                let pg = page;
                let merged = subscribers.concat(result._items);

                if (result._links.next) {
                    pg++;
                    return _getAllSubscribers(criteria, pg, merged);
                }

                return $filter('sortByName')(merged);
            });
    };

    var service = {
        fetched: null,
        subscribersLookup: {},
        subscribers: null,
        fetchSubscribers: function(criteria) {
            return _getAllSubscribers(criteria);
        },

        fetchActiveSubscribers: function(criteria) {
            return _getAllSubscribers(criteria).then((result) => _.filter(result, {is_active: true}));
        },

        fetchTargetableSubscribers: function(criteria) {
            return _getAllSubscribers(criteria)
                .then((result) =>
                    _.filter(result, (r) => (!('is_targetable' in r) || r.is_targetable) && r.is_active));
        },

        fetchSubscribersByKeyword: function(keyword) {
            return this.fetchSubscribers({$or: [{name: {$regex: keyword, $options: '-i'}}]});
        },

        fetchSubscribersByIds: function(ids) {
            var parts = [];

            _.each(ids, (id) => {
                parts.push({_id: id});
            });
            return this.fetchSubscribers({$or: parts});
        },
        initialize: function() {
            if (!this.fetched) {
                this.fetched = _getAllSubscribers()
                    .then((subscribers) => {
                        this.subscribers = subscribers;
                        this.subscribersLookup = _.keyBy(subscribers, '_id');
                    });
            }
            return this.fetched;
        },
    };

    return service;
}
