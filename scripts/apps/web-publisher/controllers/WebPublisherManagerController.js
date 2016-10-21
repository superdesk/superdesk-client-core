WebPublisherManagerController.$inject = ['$scope', 'publiser'];
export function WebPublisherManagerController($scope, publisher) {
    $scope.sites = ['content'];
    $scope.manageSite = false;

    $scope.toogleCreateSite = () => {
        $scope.new = {};
        $scope.manageSite = !$scope.manageSite;
    };

    $scope.save = () => {
        publisher.createSite($scope.new).then(refreshSites);
    };

    function refreshSites() {
        publisher.querySites().then(sites => $scope.sites = sites);
    }
}
