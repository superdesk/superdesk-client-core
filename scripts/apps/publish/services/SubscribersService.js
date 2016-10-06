SubscribersService.$inject = ['api', '$q', '$filter'];
export function SubscribersService(api, $q, $filter) {
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
