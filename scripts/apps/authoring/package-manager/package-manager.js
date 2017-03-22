PackageManagerCtrl.$inject = ['$scope', 'superdesk', 'api', 'search'];
function PackageManagerCtrl($scope, superdesk, api, search) {
    var self = this;

    $scope.contentItems = [];
    this.packageModal = false;

    this.fetchPackages = function() {
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
    };

    this.openPackage = function(packageItem) {
        superdesk.intent('edit', 'item', packageItem);
    };

    this.addToPackage = function() {
        $scope.packageModal = true;
    };

    if ($scope.item && $scope.item.linked_in_packages && $scope.item.linked_in_packages.length > 0) {
        self.fetchPackages();
    }
}

PackageManagerModal.$inject = ['api', 'search', 'packages'];
function PackageManagerModal(api, search, packages) {
    return {
        scope: {
            active: '=',
            item: '='
        },
        templateUrl: 'scripts/apps/authoring/package-manager/views/package-manager-modal.html',
        link: function(scope, elem, attr, ctrl) {
            scope.items = [];

            function fetchItems() {
                var query = search.query();

                query.clear_filters();

                query.size(25).filter({terms: {type: ['composite']}});
                api.archive.query(query.getCriteria(true))
                .then((result) => {
                    scope.items = result._items;
                });
            }

            fetchItems();

            scope.addItem = function(item, group) {        
                var orig = _.clone(item);

                packages.addItemsToPackage(item, group.id, [scope.item]);
                api.save('archive', orig, item).then((_item) => {
                });
            };

            scope.close = function() {
                scope.active = false;
            };
        }
    };
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
        removeHeader: true,
        display: {authoring: true, packages: false, killedItem: false, legalArchive: false, archived: false}
    });
}])

.controller('PackageManagerWidgetCtrl', PackageManagerCtrl)
.directive('sdPackageManagerModal', PackageManagerModal);
