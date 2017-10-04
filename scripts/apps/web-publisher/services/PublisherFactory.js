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
         * @name publisher#getToken
         * @returns {String}
         * @description Gets token
         */
        getToken() {
            return pubapi._token;
        }

        /**
         * @ngdoc method
         * @name publisher#setTenant
         * @param {String} site
         * @returns {Object}
         * @description Change the tenant we are using the api for
         */
        setTenant(site) {
            pubapi.setTenant(site);
            return this;
        }

        /**
         * @ngdoc method
         * @name publisher#activateLiveSite
         * @returns {Promise}
         * @description Open tenant with livesite editor in new tab
         */
        activateLiveSite() {
            return pubapi.save('livesite/auth/livesite_editor');
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
            let params = type ? type : {};

            params.limit = 1000;
            return pubapi.query('content/routes', params);
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
         * @name publisher#reorderMenu
         * @param {Object} menu - menu which is moved
         * @param {String} id - id of menu which is moved
         * @returns {Promise}
         * @description Move menu to different position
         */
        reorderMenu(menu, id) {
            return pubapi.patch('menus/' + id + '/move', menu);
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

        /**
         * @ngdoc method
         * @name publisher#removeArticle
         * @param {Object} update - contains status of article
         * @param {String} articleId - id of article
         * @returns {Promise}
         * @description Remove article from incoming list
         */
        removeArticle(update, articleId) {
            return pubapi.patch('packages/' + articleId, update);
        }

        /**
         * @ngdoc method
         * @name publisher#publishArticle
         * @param {Object} destinations - contains array of destionations where to publish article
         * @param {String} articleId - id of article
         * @returns {Promise}
         * @description Publish article to different tenants
         */
        publishArticle(destinations, articleId) {
            return pubapi.save('packages/' + articleId + '/publish', destinations);
        }

        /**
         * @ngdoc method
         * @name publisher#unPublishArticle
         * @param {String} tenants - containts array of tenants from wchic to unpublish article
         * @param {String} articleId - id of article
         * @returns {Promise}
         * @description Unpublish article from different tenants
         */
        unPublishArticle(tenants, articleId) {
            return pubapi.save('packages/' + articleId + '/unpublish', tenants);
        }

        /**
         * @ngdoc method
         * @name publisher#getSettings
         * @returns {Promise}
         * @description Gets Publisher settings
         */
        getSettings() {
            return pubapi.get('settings');
        }

        /**
         * @ngdoc method
         * @name publisher#saveSettings
         * @returns {Promise}
         * @description Saves Publisher settings
         */
        saveSettings(settings) {
            return pubapi.patch('settings', settings);
        }

        /**
         * @ngdoc method
         * @name publisher#loadOrganizationRules
         * @returns {Promise}
         * @description Loads Organization Rules
         */
        queryOrganizationRules(params) {
            return pubapi.query('organization/rules', params);
        }

        /**
         * @ngdoc method
         * @name publisher#removeOrganizationRule
         * @param {Number} ruleId - id of rule which is deleted
         * @returns {Promise}
         * @description Delete organization rule
         */
        removeOrganizationRule(ruleId) {
            return pubapi.remove('organization/rules', ruleId);
        }

         /**
         * @ngdoc method
         * @name publisher#manageOrganizationRule
         * @param {Object} rule - rule which is edited
         * @param {String} id - id of rule which is edited
         * @returns {Promise}
         * @description Add or edit organization rule
         */
        manageOrganizationRule(rule, id) {
            return pubapi.save('organization/rules', rule, id);
        }

        /**
         * @ngdoc method
         * @name publisher#getOrganizationThemes
         * @returns {Promise}
         * @description Gets available themes
         */
        getOrganizationThemes() {
            return pubapi.get('organization/themes');
        }

        /**
         * @ngdoc method
         * @name publisher#installTenantTheme
         * @param {Object} themeInstall - object with params to save
         * @returns {Promise}
         * @description Add or edit organization rule
         */
        installTenantTheme(themeInstall) {
            return pubapi.save('themes', themeInstall);
        }

    }

    return new Publisher();
}
