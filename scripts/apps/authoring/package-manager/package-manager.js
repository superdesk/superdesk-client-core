PackageManagerCtrl.$inject = ['$scope', 'api', 'search', 'packages', 'notify', 'gettext', 'authoring'];
function PackageManagerCtrl($scope, api, search, packages, notify, gettext, authoring) {
    $scope.contentItems = [];
    $scope.packageModal = false;
    $scope.groupList = packages.groupList;

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
            {term: {type: 'composite'}},
            {not: {term: {state: 'killed'}}}
        ];

        query.size(25).filter(filter);
        var criteria = query.getCriteria(true);

        criteria.repo = 'archive,published';
        api.query('search', criteria)
        .then((result) => {
            $scope.contentItems = _.uniqBy(result._items, '_id');
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
        var onSuccess = function() {
            notify.success(gettext('Package Updated'));
            authoring.autosave(pitem);

            return updatePackageList(pitem);
        };

        var onError = function(error) {
            if (angular.isDefined(error.data._message)) {
                notify.error(error.data._message);
            } else {
                notify.error(gettext('Error. The item was not added to the package.'));
            }
        };

        if (pitem.state === 'published' || pitem.state === 'corrected') {
            return addToPublishedPackage(pitem, group, onSuccess, onError);
        }
        return addToUnpublishedPackage(pitem, group, onSuccess, onError);
    };

    function addToPublishedPackage(pitem, group, onSuccess, onError) {
        var query = {
            package_id: pitem._id,
            new_items: [{
                group: group,
                item_id: $scope.item._id
            }]
        };

        api.save('published_package_items', query).then(onSuccess, onError);
    }

    function addToUnpublishedPackage(pitem, group, onSuccess, onError) {
        var orig = _.clone(pitem);

        packages.addItemsToPackage(pitem, group, [$scope.item]);
        api.save('archive', orig, _.pick(pitem, 'groups')).then(onSuccess, onError);
    }

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
