KnowledgeController.$inject = [
    '$scope',
    'api',
    '$q',
    'notify',
    '$location'
];

export function KnowledgeController($scope, api, $q, notify, $location) {
    $scope.conceptItems = [];
    $scope.listView = 'mgrid';

    $scope.setListView = function(view) {
        $scope.listView = view;
    };
}
