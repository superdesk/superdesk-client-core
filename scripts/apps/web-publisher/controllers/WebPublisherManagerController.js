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
    var self = this;

    $scope.routes = [];
    $scope.menu = undefined;
    $scope.menus = [];
    $scope.menuObj = {};
    self.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#changeTab
     * @param {String} newTabName - name of the new active tab
     * @description Sets the active tab name to the given value
     */
    self.changeTab = newTabName => {
        self.activeTab = newTabName;
        loadLists(newTabName);
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#changeRouteFilter
     * @param {String} type - type of routes
     * @description Sets type for routes
     */
    self.changeRouteFilter = type => {
        self.routeType = type;
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#toogleCreateSite
     * @description Opens modal window for creating new site
     */
    self.toogleCreateSite = () => {
        self.openSiteModal = !self.openSiteModal;
        if (!self.openSiteModal && self.selectedSite.subdomain) {
            /**
             * @ngdoc event
             * @name WebPublisherManagerController#refreshRoutes
             * @eventType broadcast on $scope
             * @param {String} subdomain - subdomain for which to refresh routes
             * @description event is thrown when modal window is closed and saved site is selected
             */
            $scope.$broadcast('refreshRoutes', self.selectedSite.subdomain);
        }

        self.selectedSite = {};
        $scope.newSite = {};
        publisher.setTenant('default');
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#editSite
     * @param {Object} site - site which is edited
     * @description Opens modal window for editing site
     */
    self.editSite = site => {
        self.selectedSite = site;
        $scope.newSite = angular.extend({}, site);
        self.openSiteModal = true;
        publisher.setTenant(site.subdomain);
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#saveSite
     * @description Saving site
     */
    self.saveSite = () => {
        publisher.manageSite({tenant: _.pick($scope.newSite, updatedKeys($scope.newSite, self.selectedSite))}, self.selectedSite.code)
            .then(site => {
                self.siteForm.$setPristine();
                self.selectedSite = site;
                publisher.setTenant(site.subdomain);
                self.changeTab('routes');
            });
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#deleteSite
     * @param {String} code - code of site which is deleted
     * @description Deleting site
     */
    self.deleteSite = code => {
        modal.confirm(gettext('Please confirm you want to delete website.')).then(
            () => publisher.removeSite(code).then(refreshSites)
        );
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#toogleCreateRoute
     * @description Opens window for creating new route
     */
    self.toogleCreateRoute = () => {
        self.selectedRoute = {};
        $scope.newRoute = {};
        self.routePaneOpen = !self.routePaneOpen;
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#editRoute
     * @param {Object} route - route which is edited
     * @description Opens window for editing route
     */
    self.editRoute = route => {
        self.routeForm.$setPristine();
        self.selectedRoute = route;
        $scope.newRoute = angular.extend({}, route);
        self.routePaneOpen = true;
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#saveRoute
     * @description Saving route
     */
    self.saveRoute = () => {
        publisher.manageRoute({route: _.pick($scope.newRoute, updatedKeys($scope.newRoute, self.selectedRoute))}, self.selectedRoute.id)
            .then(route => {
                self.routePaneOpen = false;
                refreshRoutes();
            });
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#deleteRoute
     * @param {String} id - id of route which is deleted
     * @description Deleting route
     */
    self.deleteRoute = id => {
        modal.confirm(gettext('Please confirm you want to delete route.')).then(
            () => publisher.removeRoute(id).then(refreshRoutes));
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#newMenu
     * @description Creates a new unsaved menu card in the UI.
     */
    self.newMenu = () => {
        $scope.menus.push({
            label: undefined
        });
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#createMenu
     * @param {Object} menu - object containing properties to save
     * @description Creates menu object and updates menu card UI.
     */
    self.createMenu = (menu) => {
        let index = $scope.menus.indexOf(menu);

        publisher.saveMenu({
            name: menu.label,
            label: menu.label
        }).then((data) => {
            $scope.menus[index] = data;
        });
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#saveMenu
     * @description Saving menu object and resetting form state.
     */
    self.saveMenu = () => {
        publisher.saveMenu($scope.menuObj).then((data) => {
            self.menuForm.$setUntouched();
            refreshCurrentMenu();

            $scope.menuObj = {
                parent: data.id
            };
        });
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#editMenuTree
     * @param {Object} menu - root menu object for the tree
     * @description Opens the menu tree edit page.
     */
    self.editMenuTree = (menu) => {
        $scope.menu = menu;
        $scope.menusInTree = flattenTree(menu);

        $scope.menuObj = {
            parent: menu.id
        };

        publisher.queryRoutes().then(routes => $scope.routes = routes);
        self.changeTab('navigation-menu');
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#editMenu
     * @param {Object} menu - menu object for form
     * @description Opens the menu object in the menu form for editing.
     */
    self.editMenu = (menu) => {
        $scope.menuObj = {
            id: menu.id,
            parent: menu.parent && menu.parent.id,
            name: menu.name,
            label: menu.label,
            route: menu.route && menu.route.id,
            uri: menu.uri
        };

        $scope.paneOpen = true;
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#removeMenu
     * @param {Object} menu - menu object to remove
     * @description Removes this menu from the site.
     */
    self.removeMenu = (menu) => {
        let index = $scope.menus.indexOf(menu);

        if (menu.id) {
            publisher.removeMenu(menu.id);
        }

        refreshCurrentMenu();
        $scope.menus.splice(index, 1);
    };

    //assumes root object with array of similar children objects in a 'children' attribute.
    function flattenTree(tree, flattened=[]) {
        flattened.push(tree);

        if (tree.children.length) {
            for (let node of tree.children) {
                flattenTree(node, flattened);
            }
        }

        return flattened;
    }

    function refreshCurrentMenu() {
        let index = $scope.menus.indexOf($scope.menu);
        publisher.getMenu($scope.menu.id).then((menu) => {
            $scope.menu = menu;
            $scope.menus[index] = menu;
        });
    }

    // compares 2 objects and returns keys of fields that are updated
    function updatedKeys(a, b) {
        return _.reduce(a, (result, value, key) => {
            return _.isEqual(value, b[key]) ?
                result : result.concat(key);
        }, []);
    }

    function loadLists(tabName) {
        switch (tabName) {
            case 'routes':
                self.changeRouteFilter('');
                refreshRoutes();
                break;
            case 'navigation':
                refreshMenus();
                break;
        }
    }

    function refreshRoutes() {
        publisher.queryRoutes().then(routes => $scope.routes = routes);
    }

    function refreshMenus() {
        publisher.queryMenus().then(menus => $scope.menus = menus);
    }

    function refreshSites() {
        publisher.querySites().then(sites => $scope.sites = sites);
    }

    refreshSites();
}
