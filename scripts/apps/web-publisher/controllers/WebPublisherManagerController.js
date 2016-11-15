/**
 * @ngdoc controller
 * @module superdesk.apps.web_publisher
 * @name WebPublisherManagerController
 * @requires publisher
 * @requires modal
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @description WebPublisherManagerController holds a set of functions used for web publisher
 */
WebPublisherManagerController.$inject = ['$scope', 'publisher', 'modal'];
export function WebPublisherManagerController($scope, publisher, modal) {

    class WebPublisherManager {

        constructor() {
            this.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';
            this._refreshSites();
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#changeTab
         * @param {String} newTabName - name of the new active tab
         * @description Sets the active tab name to the given value
         */
        changeTab(newTabName) {
            this.activeTab = newTabName;
            this._loadLists(newTabName);
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#changeRouteFilter
         * @param {String} type - type of routes
         * @description Sets type for routes
         */
        changeRouteFilter(type) {
            this.routeType = type;
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toogleCreateSite
         * @description Opens modal window for creating new site
         */
        toogleCreateSite() {
            this.openSiteModal = !this.openSiteModal;
            if (!this.openSiteModal && this.selectedSite.subdomain) {
                /**
                 * @ngdoc event
                 * @name WebPublisherManagerController#refreshRoutes
                 * @eventType broadcast on $scope
                 * @param {String} subdomain - subdomain for which to refresh routes
                 * @description event is thrown when modal window is closed and saved site is selected
                 */
                $scope.$broadcast('refreshRoutes', this.selectedSite.subdomain);
            }

            this.selectedSite = {};
            $scope.newSite = {};
            publisher.setTenant('default');
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#editSite
         * @param {Object} site - site which is edited
         * @description Opens modal window for editing site
         */
        editSite(site) {
            this.selectedSite = site;
            $scope.newSite = angular.extend({}, site);
            this.openSiteModal = true;
            publisher.setTenant(site.subdomain);
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#saveSite
         * @description Saving site
         */
        saveSite() {
            publisher.manageSite({tenant: _.pick($scope.newSite, this._updatedKeys($scope.newSite, this.selectedSite))}, this.selectedSite.code)
                .then(site => {
                    this.siteForm.$setPristine();
                    this.selectedSite = site;
                    publisher.setTenant(site.subdomain);
                    this.changeTab('routes');
                });
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#deleteSite
         * @param {String} code - code of site which is deleted
         * @description Deleting site
         */
        deleteSite(code) {
            modal.confirm(gettext('Please confirm you want to delete website.')).then(
                () => publisher.removeSite(code).then(this._refreshSites)
            );
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toogleCreateRoute
         * @description Opens window for creating new route
         */
        toogleCreateRoute() {
            this.selectedRoute = {};
            $scope.newRoute = {};
            this.routePaneOpen = !this.routePaneOpen;
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#editRoute
         * @param {Object} route - route which is edited
         * @description Opens window for editing route
         */
        editRoute(route) {
            this.routeForm.$setPristine();
            this.selectedRoute = route;
            $scope.newRoute = angular.extend({}, route);
            this.routePaneOpen = true;
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#saveRoute
         * @description Saving route
         */
        saveRoute() {
            publisher.manageRoute({route: _.pick($scope.newRoute, this._updatedKeys($scope.newRoute, this.selectedRoute))}, this.selectedRoute.id)
                .then(route => {
                    this.routePaneOpen = false;
                    this._refreshRoutes();
                });
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#deleteRoute
         * @param {String} id - id of route which is deleted
         * @description Deleting route
         */
        deleteRoute(id) {
            modal.confirm(gettext('Please confirm you want to delete route.')).then(
                () => publisher.removeRoute(id).then(this._refreshRoutes));
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toogleCreateMenuCard
         * @description Creates a new unsaved menu card in navigation.
         */
        toogleCreateMenuCard() {
            this.selectedMenu = {};
            $scope.newMenu = {};
            $scope.menus.push($scope.newMenu);
            this.menuAdd = true;
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#editMenuCard
         * @param {Object} menu - menu card which is edited
         * @description Edit menu card in navigation.
         */
        editMenuCard(menu) {
            this.selectedMenu = menu;
            $scope.newMenu = angular.extend({}, menu);
            this.menuAdd = true;
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#saveMenu
         * @param {Function} refreshList - refreshing proper list after save
         * @description Creates menu in navigation or in menu tree
         */
        saveMenu(refreshList) {
            publisher.manageMenu({menu: _.pick($scope.newMenu, this._updatedKeys($scope.newMenu, this.selectedMenu))}, this.selectedMenu.id)
                .then(refreshList.bind(this));
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#deleteMenu
         * @param {String} id - id of menu which is deleted
         * @description Deleting menu
         */
        deleteMenu(id) {
            modal.confirm(gettext('Please confirm you want to delete menu.'))
                .then(() => {
                    if (id){
                        publisher.removeMenu(id).then(this._refreshMenus.bind(this));
                    } else {
                        this.menuAdd = false;
                        $scope.menus.pop();
                    }
                });
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#editMenuTree
         * @param {Object} menu - root menu object for the tree
         * @description Opens the menu tree edit page.
         */
        editMenuTree(menu) {
            $scope.menu = menu;
            $scope.menusInTree = this._flattenTree(menu);
            publisher.queryRoutes().then(routes => $scope.routes = routes);
            this.changeTab('navigation-menu');
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toogleCreateMenu
         * @description Creates a new menu
         */
        toogleCreateMenu() {
            this.selectedMenu = {};
            $scope.newMenu = {};
            this.menuPaneOpen = !this.menuPaneOpen;
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#editMenu
         * @param {Object} menu - menu which is edited
         * @description Edit menu in tree
         */
        editMenu(menu) {
            this.menuForm.$setPristine();
            this.selectedMenu = menu;
            $scope.newMenu = angular.extend({}, menu);
            this.menuPaneOpen = true;
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#removeMenu
         * @param {Object} menu - menu object to remove
         * @description Removes this menu from the site.
         */
        removeMenu(menu) {
            modal.confirm(gettext('Please confirm you want to delete menu.'))
                .then(() => {
                    publisher.removeMenu(menu.id).then(this._refreshCurrentMenu.bind(this));
                });
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_editMode
         * @private
         * @param {Object} menu - menu for which to check mode
         * @returns {Boolean}
         * @description Checking if menu card is in edit mode
         */
        _editMode(menu) {
            return !menu.id || (this.selectedMenu && menu.id == this.selectedMenu.id && this.menuAdd);
        };

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_updatedKeys
         * @private
         * @param {Object} a
         * @param {Object} b
         * @returns {Array}
         * @description Compares 2 objects and returns keys of fields that are updated
         */
        _updatedKeys(a, b) {
            return _.reduce(a, (result, value, key) => {
                return _.isEqual(value, b[key]) ?
                    result : result.concat(key);
            }, []);
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_flattenTree
         * @private
         * @param {Object} tree
         * @returns {Array}
         * @description Returns all children objects from tree
         */
        _flattenTree(tree, flattened=[]) {
            flattened.push(tree);

            if (tree.children.length) {
                for (let node of tree.children) {
                    this._flattenTree(node, flattened);
                }
            }

            return flattened;
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_loadLists
         * @private
         * @param {String} tabName - name of selected tab
         * @description Loads lists dependent on selected tab
         */
        _loadLists(tabName) {
            switch (tabName) {
                case 'routes':
                    this.changeRouteFilter('');
                    this._refreshRoutes();
                    break;
                case 'navigation':
                    this._refreshMenus();
                    break;
            }
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_refreshSites
         * @private
         * @description Loads list of sites
         */
        _refreshSites() {
            publisher.querySites().then(sites => $scope.sites = sites);
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_refreshRoutes
         * @private
         * @description Loads list of routes
         */
        _refreshRoutes() {
            publisher.queryRoutes().then(routes => $scope.routes = routes);
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_refreshCurrentMenu
         * @private
         * @description Loads child menus for selected menu
         */
        _refreshCurrentMenu() {
            this.menuPaneOpen = false;
            publisher.getMenu($scope.menu.id).then(menu => $scope.menu = menu);
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_refreshMenus
         * @private
         * @description Loads list of menus
         */
        _refreshMenus() {
            this.menuAdd = false;
            this.menuPaneOpen = false;
            publisher.queryMenus().then(menus => $scope.menus = menus);
        }
    }

    return new WebPublisherManager();
}
