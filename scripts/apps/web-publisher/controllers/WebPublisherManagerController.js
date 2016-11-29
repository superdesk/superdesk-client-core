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
        self.selectedSite = {};
        $scope.newSite = {};
        self.openSiteModal = !self.openSiteModal;
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
