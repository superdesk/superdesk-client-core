ProfilingController.$inject = ['$scope', 'api'];
export function ProfilingController($scope, api) {
    $scope.profiling_data = [];
    $scope.current_profile = null;
    $scope.profiles = ['rest', 'publish:enqueue', 'publish:transmit'];
    $scope.profile_names = {
        rest: 'Rest',
        'publish:enqueue': 'Publish Enqueue',
        'publish:transmit': 'Publish Transmit',
    };

    /*
    * Populates the profiling data.
    */
    function populateProfilingData() {
        api.profiling.getById($scope.current_profile).then((profile) => {
            $scope.profiling_data = profile.profiling_data;
            $scope.lastRefreshedAt = new Date();
        });
    }

    $scope.reload = function() {
        populateProfilingData();
    };

    $scope.reset = function() {
        api.profiling.remove({_links: {self: {href: 'profiling'}}});
        $scope.reload();
    };

    $scope.loadProfile = function(profile) {
        if (profile !== $scope.current_profile) {
            $scope.current_profile = profile;
            $scope.profiling_data = [];
            $scope.reload();
        }
    };

    $scope.reload();
}
