WebPublisherManagerController.$inject = ['$scope', 'publisher', 'modal'];
export function WebPublisherManagerController($scope, publisher, modal) {
    var self = this;

    self.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';

    /**
    * Sets the active tab name to the given value.
    *
    * @method changeTab
    * @param {string} newTabName - name of the new active tab
    */
    self.changeTab = function (newTabName) {
        self.activeTab = newTabName;
    };

    self.toogleCreateSite = () => {
        $scope.new = {};
        self.manageSite = !self.manageSite;
    };

    self.editSite = (site) => {
        $scope.new = site;
        self.manageSite = !self.manageSite;

        publisher.setTenant(site.subdomain)
            .queryMenus().then(menus => $scope.menus = menus);
    };

    self.save = () => {
        let tenantData = _.pick($scope.new, 'name', 'subdomain');
        publisher.createSite({tenant:tenantData}, $scope.new.code).then(refreshSites);
    };

    self.remove = (code) => {
        modal.confirm(gettext('Please confirm you want to delete website.')).then(
            () => {
                publisher.removeSite(code).then(refreshSites);
            }
        );
    };

    function refreshSites() {
        self.manageSite = false;
        publisher.querySites().then(sites => $scope.sites = sites);
    }

    refreshSites();
}
