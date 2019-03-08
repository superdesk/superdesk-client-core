/**
 * Service for fetching users with caching.
 * Ideally, should be used app-wide.
 */
UserListService.$inject = ['api', '$q', '$cacheFactory'];
export function UserListService(api, $q, $cacheFactory) {
    var userservice: any = {};

    var cache = $cacheFactory('userList');

    var DEFAULT_CACHE_KEY = '_nosearch';
    var DEFAULT_PAGE = 1;
    var DEFAULT_PER_PAGE = 20;

    userservice.getAll = () => api('users').getAll();

    /**
     * Fetches and caches users, or returns from the cache.
     *
     * @param {String} search
     * @param {Integer} page (Shouldn't be used at the moment)
     * @param {Integer} perPage
     * @returns {Promise}
     */
    userservice.get = function(search, page = DEFAULT_PAGE, perPage = DEFAULT_PER_PAGE) {
        var key = search || DEFAULT_CACHE_KEY;

        key = buildKey(key, page, perPage);

        var value = cache.get(key);

        if (value) {
            return $q.when(value);
        }

        var criteria: any = {max_results: page * perPage};

        if (search) {
            criteria.where = JSON.stringify({
                $or: [
                    {display_name: {$regex: search, $options: '-i'}},
                    {username: {$regex: search, $options: '-i'}},
                    {first_name: {$regex: search, $options: '-i'}},
                    {last_name: {$regex: search, $options: '-i'}},
                    {email: {$regex: search, $options: '-i'}},
                ],
            });
        }

        return api('users').query(criteria)
            .then((result) => {
                cache.put(key, result);
                return result;
            });
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
