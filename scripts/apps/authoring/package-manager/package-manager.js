PackageManagerCtrl.$inject = ['$scope', 'api', 'search', 'packages', 'notify', 'gettext', 'autosave'];
function PackageManagerCtrl($scope, api, search, packages, notify, gettext, autosave) {
    $scope.contentItems = [];
    $scope.packageModal = false;

    function fetchPackages() {
        var query = search.query();

        query.clear_filters();
        var linkedPackages = [];

        _.forEach($scope.item.linked_in_packages, (packageRef) => {
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
            $scope.contentItems = result._items;
        });
    }

    function updatePackageList(_package) {
        if ($scope.item.linked_in_packages) {
            $scope.item.linked_in_packages.push({package: _package._id});
        } else {
            $scope.item.linked_in_packages = [{package: _package._id}];
        }
        return fetchPackages();
    }

    this.addToPackage = function(pitem, group) {
        var orig = _.clone(pitem);

        packages.addItemsToPackage(pitem, group.id, [$scope.item]);
        api.save('archive', orig, _.pick(pitem, 'groups')).then(() => {
            notify.success(gettext('Package Updated'));
            autosave.drop(pitem);

            return updatePackageList(pitem);
        });
    };

    fetchPackages();
}

export default angular.module('superdesk.apps.authoring.package-manager', ['superdesk.apps.authoring.widgets'])
.config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
    authoringWidgetsProvider
    .widget('package-manager', {
        icon: 'package-add',
        label: gettext('Package Manager'),
        template: 'scripts/apps/authoring/package-manager/views/package-manager-widget.html',
        order: 6,
        side: 'right',
        display: {authoring: true, packages: false, killedItem: false, legalArchive: false, archived: false}
    });
}])

.controller('PackageManagerWidgetCtrl', PackageManagerCtrl);
