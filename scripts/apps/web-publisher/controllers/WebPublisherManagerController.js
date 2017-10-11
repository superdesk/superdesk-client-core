/**
 * @ngdoc controller
 * @module superdesk.apps.web_publisher
 * @name WebPublisherManagerController
 * @requires publisher
 * @requires modal
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @description WebPublisherManagerController holds a set of functions used for web publisher manager
 */
WebPublisherManagerController.$inject = ['$scope', 'publisher', 'modal', 'privileges', '$window', 'WizardHandler'];
export function WebPublisherManagerController($scope, publisher, modal, privileges, $window, WizardHandler) {
    class WebPublisherManager {
        constructor() {
            this.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';
            $scope.loading = true;
            publisher.setToken().then(this._refreshSites);
            this.livesitePermission = privileges.userHasPrivileges({livesite: 1});
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
         * @name WebPublisherManagerController#toggleEditSite
         * @description Toggles modal window for editing site
         */
        toggleEditSite() {
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
            publisher.setTenant();
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#activateLiveSite
         * @param {Object} site - site which is edited
         * @description Opens site in new tab with live site activated
         */
        activateLiveSite(site) {
            publisher.setTenant(site);
            publisher.activateLiveSite().then((response) => {
                $window.open(response.url, '_blank');
            });
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
            publisher.setTenant(site);
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
                    publisher.setTenant(site);
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
                () => publisher.removeSite(code)
                .then(() => {
                    publisher.setTenant();
                    this._refreshSites();
                })
            );
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#isObjEmpty
         * @param {Object} value
         * @returns {Boolean}
         * @description Checks if object is empty
         */
        isObjEmpty(value) {
            return angular.equals({}, value);
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toogleCreateRoute
         * @param {Boolean} paneOpen - should pane be open
         * @description Opens window for creating new route
         */
        toogleCreateRoute(paneOpen) {
            this.selectedRoute = {};
            $scope.newRoute = {};
            this.routePaneOpen = paneOpen;
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
         * @param {Boolean} paneOpen - should pane be open
         * @description Creates a new menu
         */
        toogleCreateMenu(paneOpen) {
            this.selectedMenu = {};
            $scope.newMenu = {};
            this.menuPaneOpen = paneOpen;
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
         * @name WebPublisherManagerController#reorderMenu
         * @param {Object} list - object where list of menu items is
         * @param {Object} item - object which is moved
         * @param {Number} index - index where item would be moved
         * @description Move menu to different position
         */
        reorderMenu(list, item, index) {
            if (index !== -1) {
                let parentId = list.children[0].parent;
                let removedItem = _.find(list.children, {id: item.id});

                if (removedItem) {
                    removedItem.removed = true;
                }

                list.children = list.children.slice(0, index)
                    .concat(item)
                    .concat(list.children.slice(index))
                    .filter((item) => !item.removed);

                let menuPosition = list.children.indexOf(item);

                if (menuPosition !== item.position || parentId !== item.parent) {
                    list.children[menuPosition].position = menuPosition;

                    publisher.reorderMenu({menu_move: {parent: parentId, position: menuPosition}}, item.id)
                        .then(this._refreshCurrentMenu.bind(this));
                }
            }
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toggleInfoCarousel
         * @description Toggles info carousel
         */
        toggleInfoCarousel() {
            this.infoCarouselActive = !this.infoCarouselActive;
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#toggleSiteWizard
         * @description Toggles site creation wizard
         */
        toggleSiteWizard() {
            this.wizard = {
                busy: false,
                step: 'details',
                errorMessage: null,
                themeDetailsActive: false,
                site: null,
                theme: null,
                ready: false
            };
            this.siteWizardActive = !this.siteWizardActive;
            $scope.newSite = {};
            publisher.setTenant();
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#siteWizardSaveSite
         * @description Saves new tenant and continues to theme install step in site wizard
         */
        siteWizardSaveSite() {
            this.wizard.busy = true;
            publisher.manageSite({tenant: $scope.newSite})
                .then((site) => {
                    this.wizard.errorMessage = false;
                    this.wizard.site = site;
                    publisher.setTenant(site);
                    this._refreshSites();
                    publisher.getOrganizationThemes().then((response) => {
                        this.wizard.organizationThemes = response._embedded._items;
                        angular.forEach(this.wizard.organizationThemes, (theme) => {
                            let previewSetting = theme.config.filter((setting) => setting.preview_url);

                            if (previewSetting.length) {
                                theme.preview_url = previewSetting[0].preview_url;
                            }
                        });
                        this.wizard.busy = false;
                        WizardHandler.wizard('siteWizard').next();
                    });
                })
                .catch((error) => {
                    this.wizardBusy = false;
                    if (error.status === 409) {
                        this.wizard.errorMessage = 'Site already exists';
                    } else {
                        this.wizard.errorMessage = 'Error. Try again later.';
                    }
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#openWizardThemeDetails
         * @param {Object} theme - selected theme
         * @description Opens theme details in site wizard
         */
        openWizardThemeDetails(theme) {
            this.wizard.themeDetailsActive = true;
            this.wizard.theme = theme;
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#siteWizardInstallTheme
         * @param {Object} theme - selected theme
         * @description Installs selected theme
         */
        siteWizardInstallTheme(theme) {
            this.wizard.step = 'installation';
            publisher.installTenantTheme({theme_install: {name: theme.name}})
                .then(() => {
                    this.wizard.step = 'finish';
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#siteWizardActivateTheme
         * @description Activates selected theme
         */
        siteWizardActivateTheme() {
            publisher.manageSite({tenant: {themeName: this.wizard.theme.name}}, this.wizard.site.code)
                .then(() => {
                    this.wizard.themeDetailsActive = false;
                    this.wizard.ready = true;
                    this.wizard.theme.active = true;
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#siteWizardConfigureSite
         * @description Clears site wizard data and redirects user to site configuration
         */
        siteWizardConfigureSite() {
            let site = this.wizard.site;

            this.toggleSiteWizard();
            this.editSite(site);
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
            }
        }

        /**
         * @ngdoc method
         * @name WebPublisherManagerController#_refreshSites
         * @private
         * @description Loads list of sites
         */
        _refreshSites() {
            $scope.loading = true;
            publisher.querySites().then((sites) => {
                $scope.sites = sites;
                $scope.loading = false;
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
                $scope.menusInTree = this._flattenTree(menu);
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
    }

    return new WebPublisherManager();
}
