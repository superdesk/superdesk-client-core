ProfileService.$inject = ['api'];
export function ProfileService(api) {
    var RESOURCE = 'activity';

    /**
     * Get all activity of single user, being it content related or not
     *
     * @param {Object} user
     * @param {number} maxResults
     * @param {number} page
     * @return {Promise}
     */
    this.getUserActivity = function(user, maxResults, page) {
        var q: any = {
            where: {user: user._id},
            sort: '[(\'_created\',-1)]',
            embedded: {user: 1},
        };

        if (maxResults) {
            q.max_results = maxResults;
        }

        if (page > 1) {
            q.page = page;
        }

        return api.query(RESOURCE, q);
    };

    /**
     * Get activity of all users related to content
     *
     * This will return activity like item created/updated, but not user.updated.
     *
     * @param {number} maxResults
     * @param {number} page
     * @return {Promise}
     */
    this.getAllUsersActivity = function(maxResults, page) {
        var q: any = {
            sort: '[(\'_created\',-1)]',
            where: {user: {$exists: true}, item: {$exists: true}},
            embedded: {user: 1},
        };

        if (maxResults) {
            q.max_results = maxResults;
        }

        if (page > 1) {
            q.page = page;
        }

        return api.query(RESOURCE, q);
    };
}
