AuthoringController.$inject = ['$scope', 'item', 'action', 'superdesk'];
export function AuthoringController($scope, item, action, superdesk) {
    $scope.origItem = item;
    $scope.action = action || 'edit';

    $scope.lock = function() {
        superdesk.intent('author', 'article', item);
    };
}
