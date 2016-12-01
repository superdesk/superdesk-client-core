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
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
    class WebPublisherManager {
        constructor() {
            this.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';
            publisher.setToken().then(() => this._refreshSites());
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
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#changeRouteFilter
         * @param {String} type - type of routes
         * @description Sets type for routes
         */
        changeRouteFilter(type) {
            this.routeType = type;
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#changeListFilter
         * @param {String} type - type of content lists
         * @description Sets type for content lists
         */
        changeListFilter(type) {
            this.listType = type;
        }

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
        }

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
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#cancelEditSite
         * @description Canceles changes to site
         */
        cancelEditSite() {
            $scope.newSite = angular.extend({}, this.selectedSite);
            this.siteForm.$setPristine();
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#saveSite
         * @description Saving site
         */
        saveSite() {
            let updatedKeys = this._updatedKeys($scope.newSite, this.selectedSite);

            publisher.manageSite({tenant: _.pick($scope.newSite, updatedKeys)}, this.selectedSite.code)
                .then((site) => {
                    this.siteForm.$setPristine();
                    this.selectedSite = site;
                    publisher.setTenant(site.subdomain);
                    this.changeTab('routes');
                    this._refreshSites();
                });
        }

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
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toogleCreateRoute
         * @description Opens window for creating new route
         */
        toogleCreateRoute() {
            this.selectedRoute = {};
            $scope.newRoute = {};
            this.routePaneOpen = !this.routePaneOpen;
        }

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
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#saveRoute
         * @description Saving route
         */
        saveRoute() {
            let updatedKeys = this._updatedKeys($scope.newRoute, this.selectedRoute);

            // only for updating, parent is received as object but for update id is needed
            if ($scope.newRoute.parent && $scope.newRoute.parent.id) {
                $scope.newRoute.parent = $scope.newRoute.parent.id;
            }
            publisher.manageRoute({route: _.pick($scope.newRoute, updatedKeys)}, this.selectedRoute.id)
                .then((route) => {
                    this.routePaneOpen = false;
                    this._refreshRoutes();
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#deleteRoute
         * @param {String} id - id of route which is deleted
         * @description Deleting route
         */
        deleteRoute(id) {
            modal.confirm(gettext('Please confirm you want to delete route.')).then(
                () => publisher.removeRoute(id).then(this._refreshRoutes));
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#createMenuCard
         * @description Creates a new unsaved menu card in navigation.
         */
        createMenuCard() {
            this.selectedMenu = {};
            $scope.newMenu = {};
            $scope.menus.push($scope.newMenu);
            this.menuAdd = true;
        }

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
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#cancelEditMenuCard
         * @description Canceling update of menu card
         */
        cancelEditMenuCard() {
            $scope.newMenu = angular.extend({}, this.selectedMenu);
            this.menuAdd = false;
            if (!this.selectedMenu.id) {
                $scope.menus.pop();
            }
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#saveMenu
         * @param {Function} refreshList - refreshing proper list after save
         * @description Creates menu in navigation or in menu tree
         */
        saveMenu(refreshList) {
            let updatedKeys = this._updatedKeys($scope.newMenu, this.selectedMenu);

            publisher.manageMenu({menu: _.pick($scope.newMenu, updatedKeys)}, this.selectedMenu.id)
                .then(refreshList.bind(this));
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#deleteMenu
         * @param {String} id - id of menu which is deleted
         * @description Deleting menu
         */
        deleteMenu(id) {
            modal.confirm(gettext('Please confirm you want to delete menu.'))
                .then(() => {
                    publisher.removeMenu(id).then(this._refreshMenus.bind(this));
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#editMenuTree
         * @param {Object} menu - root menu object for the tree
         * @description Opens the menu tree edit page.
         */
        editMenuTree(menu) {
            $scope.menu = menu;
            $scope.menusInTree = this._flattenTree(menu);
            publisher.queryRoutes().then((routes) => {
                $scope.routes = routes;
            });
            this.changeTab('navigation-menu');
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toogleCreateMenu
         * @description Creates a new menu
         */
        toogleCreateMenu() {
            this.selectedMenu = {};
            $scope.newMenu = {};
            this.menuPaneOpen = !this.menuPaneOpen;
        }

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
        }

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
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#createListCard
         * @param {String} listType - type of content list
         * @description Creates a new unsaved content list card
         */
        createListCard(listType) {
            this.selectedList = {};
            $scope.newList = {type: listType, cacheLifeTime: 0};
            $scope.lists.push($scope.newList);
            this.listAdd = true;
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#editListCard
         * @param {Object} list - content list card which is edited
         * @description Edit content list card
         */
        editListCard(list) {
            this.selectedList = list;
            $scope.newList = angular.extend({}, list);
            this.listAdd = true;
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#cancelEditListCard
         * @description Canceling update of content list card
         */
        cancelEditListCard() {
            $scope.newList = angular.extend({}, this.selectedList);
            this.listAdd = false;
            if (!this.selectedList.id) {
                $scope.lists.pop();
            }
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#editListCardSettings
         * @param {Object} list - list for editing
         * @description Opens modal window for editing settings
         */
        editListCardSettings(list) {
            this.selectedList = list;
            $scope.newList = angular.extend({}, list);
            this.settingsModal = true;
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#cancelListCardSettings
         * @description Cancels editing settings for list
         */
        cancelListCardSettings() {
            this.selectedList = {};
            $scope.newList = {};
            this.settingsModal = false;
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#saveList
         * @description Creates content list
         */
        saveList() {
            let updatedKeys = this._updatedKeys($scope.newList, this.selectedList);

            publisher.manageList({content_list: _.pick($scope.newList, updatedKeys)}, this.selectedList.id)
                .then(this._refreshLists.bind(this));
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#deleteList
         * @param {String} id - id of content list which is deleted
         * @description Deleting content list
         */
        deleteList(id) {
            modal.confirm(gettext('Please confirm you want to delete list.'))
                .then(() => {
                    publisher.removeList(id).then(this._refreshLists.bind(this));
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#openListCriteria
         * @param {Object} list - list for editing
         * @description Opens list criteria page
         */
        openListCriteria(list) {
            this.selectedList = list;
            $scope.newList = angular.extend({}, list);
            this.metadataList = [];
            this.selectedRoutes = [];
            if (!$scope.newList.filters) {
                $scope.newList.filters = {};
            }

            if ($scope.newList.filters.metadata) {
                angular.forEach($scope.newList.filters.metadata, (value, key) => {
                    this.metadataList.push({metaName: key, metaValue: value});
                });
            }

            publisher.queryRoutes().then((routes) => {
                $scope.routes = routes;

                if ($scope.newList.filters.route && $scope.newList.filters.route.length > 0) {
                    routes.forEach((item) => {
                        if ($scope.newList.filters.route.indexOf(item.id + '') !== -1) {
                            this.selectedRoutes.push(item);
                        }
                    });
                }
            });

            this.changeTab(list.type === 'automatic' ? 'content-list-automatic' : '');
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#saveListCriteria
         * @description Update criteria for content list
         */
        saveListCriteria() {
            var updatedFilters = _.pickBy($scope.newList.filters, _.identity);

            updatedFilters.metadata = {};
            this.metadataList.forEach((item) => {
                if (item.metaName) {
                    updatedFilters.metadata[item.metaName] = item.metaValue;
                }
            });

            delete updatedFilters.route;
            if (this.selectedRoutes.length > 0) {
                updatedFilters.route = [];
                this.selectedRoutes.forEach((item) => {
                    updatedFilters.route.push(item.id);
                });
            }

            /**
             * @ngdoc event
             * @name WebPublisherManagerController#refreshArticles
             * @eventType broadcast on $scope
             * @param {Object} $scope.newList - list which will refresf articles
             * @description event is thrown when criteria is updated
             */
            publisher.manageList({content_list: {filters: updatedFilters}}, this.selectedList.id)
                .then(() => $scope.$broadcast('refreshArticles', $scope.newList));
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#addAuthor
         * @description Adds author in criteria filters list
         */
        addAuthor() {
            if (!$scope.newList.filters.author) {
                $scope.newList.filters.author = [];
            }

            $scope.newList.filters.author.push('');
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#removeAuthor
         * @param {Number} itemIdx - index of the item to remove
         * @description Removes author from criteria filters list
         */
        removeAuthor(itemIdx) {
            $scope.newList.filters.author.splice(itemIdx, 1);
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#addMetadata
         * @description Adds metadata in criteria filters list
         */
        addMetadata() {
            this.metadataList.push({metaName: '', metaValue: ''});
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#removeMetadata
         * @param {Number} itemIdx - index of the item to remove
         * @description Removes metadata from criteria filters list
         */
        removeMetadata(itemIdx) {
            this.metadataList.splice(itemIdx, 1);
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_editMode
         * @private
         * @param {Object} card - card for which to check mode
         * @param {Object} selected - selected card(for edit)
         * @param {Boolean} addFlag - is card added
         * @returns {Boolean}
         * @description Checking if card is in edit mode
         */
        _editMode(card, selected, addFlag) {
            return !card.id || selected && card.id === selected.id && addFlag;
        }

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
            return _.reduce(a, (result, value, key) => _.isEqual(value, b[key]) ? result : result.concat(key), []);
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_flattenTree
         * @private
         * @param {Object} tree
         * @returns {Array}
         * @description Returns all children objects from tree
         */
        _flattenTree(tree, flattened = []) {
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
            case 'content-lists':
                this.changeListFilter('');
                this._refreshLists();
                break;
            case 'content-bucket':
                this._refreshLists();
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
            publisher.querySites().then((sites) => {
                $scope.sites = sites;
            });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_refreshRoutes
         * @private
         * @description Loads list of routes
         */
        _refreshRoutes() {
            publisher.queryRoutes().then((routes) => {
                $scope.routes = routes;
            });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_refreshCurrentMenu
         * @private
         * @description Loads child menus for selected menu
         */
        _refreshCurrentMenu() {
            this.menuPaneOpen = false;
            publisher.getMenu($scope.menu.id).then((menu) => {
                $scope.menu = menu;
            });
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
            publisher.queryMenus().then((menus) => {
                $scope.menus = menus;
            });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_refreshLists
         * @private
         * @description Loads list of content lists
         */
        _refreshLists() {
            this.listAdd = false;
            this.listPaneOpen = false;
            this.settingsModal = false;
            publisher.queryLists().then((lists) => {
                $scope.lists = lists;
            });
        }
    }

    return new WebPublisherManager();
=======
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
>>>>>>> Added web publisher module
}
