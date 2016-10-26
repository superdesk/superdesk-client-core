WebPublisherManagerController.$inject = ['$scope', 'publisher'];
export function WebPublisherManagerController($scope, publisher) {
    $scope.sites = ['content'];
    $scope.manageSite = false;

    $scope.toogleCreateSite = () => {
        $scope.new = {};
        $scope.manageSite = !$scope.manageSite;
    };

    $scope.save = () => {
        $scope.new.domainName = 'example.com';
        $scope.new.organization = '123456';
        publisher.createSite({tenant:$scope.new}).then(refreshSites);
    };

    function refreshSites() {
        publisher.querySites().then(sites => $scope.sites = sites);
    }

    refreshSites();
}
