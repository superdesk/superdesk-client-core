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

    self.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';

    $scope.routes = [];
    $scope.menus = [];
    $scope.menu = undefined;
    $scope.menuObj = {};

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#changeTab
     * @param {String} newTabName - name of the new active tab
     * @description Sets the active tab name to the given value
     */

    self.changeTab = function (newTabName) {
        self.activeTab = newTabName;
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
     * @name WebPublisherManagerController#saveMenu
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
            self.menuForm.$setPristine();
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
        self.changeTab("navigation-menu");
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


    /**
     * @ngdoc method
     * @name WebPublisherManagerController#toogleCreateSite
     * @description Opens modal window for creating new site
     */
    self.toogleCreateSite = () => {
        self.siteCode = '';
        $scope.new = {};
        self.openSiteModal = !self.openSiteModal;
        publisher.setTenant('default');
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#editSite
     * @param {Object} site - site which is edited
     * @description Opens modal window for editing site
     */
    self.editSite = (site) => {
        self.siteCode = site.code;
        $scope.new = _.pick(site, 'name', 'subdomain');
        self.openSiteModal = !self.openSiteModal;
        publisher.setTenant(site.subdomain).queryMenus()
            .then((menus) => {
                $scope.menus = menus.filter((menu) => {
                    return menu.parent === null;
                });
            });
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#save
     * @description Saving site
     */
    self.save = () => {
        //$scope.createForm.$setPristine();
        publisher.manageSite({tenant: $scope.new}, self.siteCode).then(site => {
            self.createForm.$setPristine();
            self.siteCode = site.code;
            self.activeTab = 'routes';
        });
    };

    /**
     * @ngdoc method
     * @name WebPublisherManagerController#remove
     * @param {String} code - code of site which is deleted
     * @description Deleting site
     */
    self.remove = (code) => {
        modal.confirm(gettext('Please confirm you want to delete website.')).then(
            () => publisher.removeSite(code).then(refreshSites)
        );
    };

    function refreshSites() {
        self.openSiteModal = false;
        publisher.querySites().then(sites => $scope.sites = sites);
    }

    refreshSites();
}
