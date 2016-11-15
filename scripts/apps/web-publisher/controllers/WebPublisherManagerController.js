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
    self.changeTab = function (newTabName) {
        self.activeTab = newTabName;
    };

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
        publisher.setTenant(site.subdomain)
            .queryMenus().then(menus => $scope.menus = menus);
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
