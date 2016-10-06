/**
 * Service for fetching users with caching.
 * Ideally, should be used app-wide.
 */
UserListService.$inject = ['api', '$q', '$cacheFactory'];
export function UserListService(api, $q, $cacheFactory) {

    var userservice = {};

    var cache = $cacheFactory('userList');

    var DEFAULT_CACHE_KEY = '_nosearch';
    var DEFAULT_PAGE = 1;
    var DEFAULT_PER_PAGE = 20;

    userservice.getAll = function() {
        var p = $q.when();
        var deferred = $q.defer();

        function _getAll(page, items) {
            page = page || DEFAULT_PAGE;
            items = items || [];

            api('users')
                .query({max_results: 200, page: page})
                .then(function(result) {
                    items = items.concat(result._items);
                    if (result._links.next) {
                        page++;
                        p = p.then(_getAll(page, items));
                    } else {
                        cache.put(DEFAULT_CACHE_KEY, items);
                        deferred.resolve(items);
                    }
                });

            return deferred.promise;
        }

        p = _getAll();
        return p.then(function(res) {
            return res;
        });
    };

    /**
     * Fetches and caches users, or returns from the cache.
     *
     * @param {String} search
     * @param {Integer} page (Shouldn't be used at the moment)
     * @param {Integer} perPage
     * @returns {Promise}
     */
    userservice.get = function(search, page, perPage) {
        page = page || DEFAULT_PAGE;
        var key = search || DEFAULT_CACHE_KEY;
        perPage = perPage || DEFAULT_PER_PAGE;
        key = buildKey(key, page, perPage);

        var value = cache.get(key);
        if (value) {
            return $q.when(value);
        } else {
            var criteria = {
                max_results: page * perPage
            };
            if (search) {
                criteria.where = JSON.stringify({
                    '$or': [
                        {display_name: {'$regex': search, '$options': '-i'}},
                        {username: {'$regex': search, '$options': '-i'}},
                        {first_name: {'$regex': search, '$options': '-i'}},
                        {last_name: {'$regex': search, '$options': '-i'}},
                        {email: {'$regex': search, '$options': '-i'}}
                    ]
                });
            }

            return api('users').query(criteria)
            .then(function(result) {
                cache.put(key, result);
                return result;
            });
        }
    };

    /**
     * Fetch single user from default cache, or make new api call
     *
     * @param {String} id of user
     * @param {boolean} forced to bypass the cache
     * @returns {Promise}
     */
    userservice.getUser = function(id, forced) {
        return api('users').getById(id, undefined, !forced);
    };

    /**
     * Clear user cache
     */
    userservice.clearCache = function() {
        cache.removeAll();
    };

    function buildKey(key, page, perPage) {
        return key + '_' + page + '_' + perPage;
    }

    return userservice;
}
