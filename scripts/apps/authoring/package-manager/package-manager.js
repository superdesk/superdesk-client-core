PackageManagerCtrl.$inject = ['$scope', 'superdesk', 'api', 'search'];
function PackageManagerCtrl($scope, superdesk, api, search) {
    $scope.contentItems = [];

    function fetchPackages() {
        var query = search.query();

        query.clear_filters();
        var filter = [];

        _.forEach($scope.item.linked_in_packages, (packageRef) => {
            filter.push(packageRef.package);
        });

        query.size(25).filter({terms: {guid: filter}});
        api.archive.query(query.getCriteria(true))
        .then((result) => {
            $scope.contentItems = result._items;
        });
    }

    $scope.openPackage = function(packageItem) {
        superdesk.intent('edit', 'item', packageItem);
    };

    $scope.addToPackage = function() {
        console.log('add to pacakge');
    };

    if ($scope.item && $scope.item.linked_in_packages && $scope.item.linked_in_packages.length > 0) {
        fetchPackages();
    }
}

export default angular.module('superdesk.apps.authoring.package-manager', ['superdesk.apps.authoring.widgets'])
.config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
    authoringWidgetsProvider
    .widget('package-manager', {
        icon: 'package',
        label: gettext('Package Manager'),
        template: 'scripts/apps/authoring/package-manager/views/package-manager-widget.html',
        order: 6,
        side: 'right',
        display: {authoring: true, packages: false, killedItem: false, legalArchive: false, archived: false}
    });
}])
.controller('PackageManagerWidgetCtrl', PackageManagerCtrl);
