PackagingController.$inject = ['$scope', 'item', 'packages', 'api', 'modal', 'notify', 'superdesk'];
export function PackagingController($scope, item, packages, api, modal, notify, superdesk) {
    $scope.origItem = item;
    $scope.action = 'edit';

    $scope.lock = function() {
        superdesk.intent('author', 'package', item);
    };

    // Highlights related functionality
    $scope.highlight = !!item.highlight;
}
