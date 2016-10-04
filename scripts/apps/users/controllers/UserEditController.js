UserEditController.$inject = ['$scope', 'server', 'superdesk', 'user', 'session'];
export function UserEditController($scope, server, superdesk, user, session) {
    $scope.user = user;
    $scope.profile = $scope.user._id === session.identity._id;
}
