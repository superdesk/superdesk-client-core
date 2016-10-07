WebPublisherManagerController.$inject = ['$scope', 'api'];
export function WebPublisherManagerController($scope, api) {
	$scope.sites = ['content'];
	$scope.manageSite = false;
	
    $scope.toogleCreateSite = function() {
    	$scope.new = {};
        $scope.manageSite = !$scope.manageSite;
    };

    $scope.save = function() {
  //       content.createSite($scope.new)
  //           .then(function() {
		//             refreshSites();
		//             $scope.toogleCreateSite();
		//         }
		// );
    };

    function refreshSites() {
        // return content.getSites().then(function(sites) {
        //     $scope.sites = sites;
        // });
    }
}
