/**
 * @ngdoc service
 * @module superdesk.apps.web_publisher
 * @name publisher
 * @requires pubapi
 * @description Publisher service
 */
PublisherFactory.$inject = ['pubapi'];
export function PublisherFactory(pubapi) {
    class Publisher {
        /**
         * @ngdoc method
         * @name publisher#setToken
         * @returns {Promise}
         * @description Sets token
         */
        setToken() {
            return pubapi.setToken();
        }

        /**
         * @ngdoc method
         * @name publisher#setTenant
         * @param {String} tenant
         * @returns {Object}
         * @description Change the tenant we are using the api for
         */
        setTenant(tenant) {
            pubapi.setTenant(tenant);
            return this;
        }

        /**
         * @ngdoc method
         * @name publisher#setOrganization
         * @returns {Object}
         * @description Set organization id for articles on monitoring
         */
        setOrganization() {
            return pubapi.setOrganization();
        }

        /**
         * @ngdoc method
         * @name publisher#manageSite
         * @param {Object} site - site which is edited
         * @param {String} code - code of site which is edited
         * @returns {Promise}
         * @description Add or edit site
         */
        manageSite(site, code) {
            return pubapi.save('tenants', site, code);
        }

        /**
         * @ngdoc method
         * @name publisher#removeSite
         * @param {String} code - code of site which is deleted
         * @returns {Promise}
         * @description Delete site
         */
        removeSite(code) {
            return pubapi.remove('tenants', code);
        }

        /**
         * @ngdoc method
         * @name publisher#querySites
         * @returns {Promise}
         * @description List all sites in publisher
         */
        querySites() {
            return pubapi.query('tenants');
        }

        /**
         * @ngdoc method
         * @name publisher#manageRoute
         * @param {Object} route - route which is edited
         * @param {String} id - id of route which is edited
         * @returns {Promise}
         * @description Add or edit route
         */
        manageRoute(route, id) {
            return pubapi.save('content/routes', route, id);
        }

        /**
         * @ngdoc method
         * @name publisher#removeRoute
         * @param {String} id - id of route which is deleted
         * @returns {Promise}
         * @description Delete route
         */
        removeRoute(id) {
            return pubapi.remove('content/routes', id);
        }

        /**
         * @ngdoc method
         * @name publisher#queryRoutes
         * @param {Object} type - which routes to query (collection or content)
         * @returns {Promise}
         * @description List all routes for defined type
         */
        queryRoutes(type) {
            return pubapi.query('content/routes', type);
        }

        /**
         * @ngdoc method
         * @name publisher#getMenu
         * @param {String} id - id of menu to get
         * @returns {Promise}
         * @description Get a single menu by id
         */
        getMenu(id) {
            return pubapi.get('menus', id);
        }

        /**
         * @ngdoc method
         * @name publisher#manageMenu
         * @param {Object} menu - menu which is edited
         * @param {String} id - id of menu which is edited
         * @returns {Promise}
         * @description Create or update a menu
         */
        manageMenu(menu, id) {
            return pubapi.save('menus', menu, id);
        }

        /**
         * @ngdoc method
         * @name publisher#removeMenu
         * @param {String} id - id of menu which is deleted
         * @returns {Promise}
         * @description Remove a menu in the system.
         */
        removeMenu(id) {
            return pubapi.remove('menus', id);
        }

        /**
         * @ngdoc method
         * @name publisher#queryMenus
         * @returns {Promise}
         * @description List all menus
         */
        queryMenus() {
            return pubapi.query('menus');
        }

        /**
         * @ngdoc method
         * @name publisher#manageList
         * @param {Object} list - list which is edited
         * @param {String} id - id of list which is edited
         * @returns {Promise}
         * @description Create or update a content list
         */
        manageList(list, id) {
            return pubapi.save('content/lists', list, id);
        }

        /**
         * @ngdoc method
         * @name publisher#removeList
         * @param {String} id - id of list which is deleted
         * @returns {Promise}
         * @description Remove a content list
         */
        removeList(id) {
            return pubapi.remove('content/lists', id);
        }

        /**
         * @ngdoc method
         * @name publisher#queryLists
         * @returns {Promise}
         * @description List all content lists
         */
        queryLists() {
            return pubapi.query('content/lists');
        }

        /**
         * @ngdoc method
         * @name publisher#queryListArticles
         * @param {String} id - id of content list
         * @returns {Promise}
         * @description List all articles for selected content list
         */
        queryListArticles(id) {
            return pubapi.query('content/lists/' + id + '/items');
        }

        /**
         * @ngdoc method
         * @name publisher#pinArticle
         * @param {String} listId - id of content list
         * @param {String} articleId - id of article
         * @param {Object} article - article which is edited
         * @returns {Promise}
         * @description Pin article in list of articles
         */
        pinArticle(listId, articleId, article) {
            return pubapi.save('content/lists/' + listId + '/items', article, articleId);
        }

        /**
         * @ngdoc method
         * @name publisher#pinArticle
         * @param {String} listId - id of content list
         * @param {String} articleId - id of article
         * @param {Object} article - article which is edited
         * @returns {Promise}
         * @description Pin article in list of articles
         */
        saveManualList(list, listId) {
            return pubapi.patch('content/lists/' + listId + '/items', list);
        }

        /**
         * @ngdoc method
         * @name publisher#queryTenantArticles
         * @param {String} articleStatus - params passed to API (limit, status, route)
         * @returns {Promise}
         * @description List all articles for selected tenant
         */
        queryTenantArticles(articleStatus) {
            return pubapi.queryWithDetails('content/articles', articleStatus);
        }

        /**
         * @ngdoc method
         * @name publisher#queryMonitoringArticles
         * @param {String} articleStatus - status of articles (new, published, unpublished, canceled)
         * @returns {Promise}
         * @description List all articles for monitoring view
         */
        queryMonitoringArticles(articleStatus) {
            return pubapi.queryWithDetails('packages', articleStatus);
        }

        publishArticle(article, articleId) {
            return pubapi.save('packages/' + articleId + '/publish', article);
        }

        unPublishArticle(tenants, articleId) {
            return pubapi.save('packages/' + articleId + '/unpublish', tenants);
        }
    }

    return new Publisher();
}
