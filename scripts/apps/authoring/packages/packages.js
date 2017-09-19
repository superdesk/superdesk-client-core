PackagesCtrl.$inject = ['$scope', 'superdesk', 'api', 'search'];
function PackagesCtrl($scope, superdesk, api, search) {
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

    if ($scope.item && $scope.item.linked_in_packages && $scope.item.linked_in_packages.length > 0) {
        fetchPackages();
    }
}

export default angular.module('superdesk.apps.authoring.packages', ['superdesk.apps.authoring.widgets'])
    .config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
        authoringWidgetsProvider
            .widget('packages', {
                icon: 'package',
                label: gettext('Packages'),
                template: 'scripts/apps/authoring/packages/views/packages-widget.html',
                order: 5,
                side: 'right',
                display: {
                    authoring: true,
                    packages: true,
                    killedItem: true,
                    legalArchive: false,
                    archived: false,
                    picture: true,
                    personal: false
                }
            });
    }])
    .controller('PackagesWidgetCtrl', PackagesCtrl);
