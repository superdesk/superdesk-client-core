PackageManagerCtrl.$inject = ['$scope', 'superdesk', 'api', 'search'];
function PackageManagerCtrl($scope, superdesk, api, search) {
    $scope.contentItems = [];
    $scope.packageModal = false;

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

    function updatePackageList(e, _package) {
        if ($scope.item.linked_in_packages) {
            $scope.item.linked_in_packages.push({package: _package._id});
        } else {
            $scope.item.linked_in_packages = [{package: _package._id}];
        }
        return fetchPackages();
    }

    this.openPackage = function(packageItem) {
        superdesk.intent('edit', 'item', packageItem);
    };

    this.addToPackage = function() {
        $scope.packageModal = true;
    };

    if ($scope.item && $scope.item.linked_in_packages && $scope.item.linked_in_packages.length > 0) {
        fetchPackages();
    }

    $scope.$on('package:inserted', updatePackageList);
}

PackageManagerModal.$inject = ['api', 'search', 'packages', '$rootScope', 'notify', 'gettext'];
function PackageManagerModal(api, search, packages, $rootScope, notify, gettext) {
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
                var linkedPackages = [];

                query.clear_filters();

                _.forEach(scope.item.linked_in_packages, (packageRef) => {
                    linkedPackages.push(packageRef.package);
                });

                var filter = [
                    {not: {term: {state: 'spiked'}}},
                    {not: {terms: {guid: linkedPackages}}},
                    {terms: {type: ['composite']}}
                ];

                query.size(25).filter(filter);
                api.archive.query(query.getCriteria(true))
                .then((result) => {
                    scope.items = result._items;
                });
            }

            fetchItems();

            scope.addItem = function(item, group) {
                var orig = _.clone(item);

                packages.addItemsToPackage(item, group.id, [scope.item]);
                api.save('archive', orig, _.pick(item, 'groups')).then(() => {
                    $rootScope.$broadcast('package:inserted', item);
                    notify.success(gettext('Package Updated'));

                    return fetchItems();
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
