/**
 * @ngdoc service
 * @module superdesk.apps.web_publisher
 * @name publisher
 * @requires pubapi
 * @description Publisher service
 */
PublisherFactory.$inject = ['pubapi'];
export function PublisherFactory(pubapi) {
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
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
=======

    class Publisher {
>>>>>>> Added web publisher module

        /**
         * @ngdoc method
         * @name publisher#setTenant
         * @param {String} tenant
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
         * @returns {Object}
=======
         * @returns Object
>>>>>>> Added web publisher module
         * @description Change the tenant we are using the api for
         */
        setTenant(tenant) {
            pubapi.setTenant(tenant);
            return this;
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
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
         * @description List all sites in publisher
=======
         * @description Query sites
>>>>>>> Added web publisher module
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
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
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
=======
         * @returns {Promise}
         * @description Query routes
         */
        queryRoutes() {
            return pubapi.query('content/routes');
>>>>>>> Added web publisher module
        }

        /**
         * @ngdoc method
         * @name publisher#queryMenus
         * @returns {Promise}
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
         * @description List all menus
=======
         * @description Query menus
>>>>>>> Added web publisher module
         */
        queryMenus() {
            return pubapi.query('menus');
        }
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e

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
         * @name publisher#queryLists
         * @param {String} id - id of content list
         * @returns {Promise}
         * @description List all articles for selected content list
         */
        queryArticles(id) {
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
=======
>>>>>>> Added web publisher module
    }

    return new Publisher();
}
