import {gettext} from 'core/ui/components/utils';

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
        var criteria = query.getCriteria(true);

        criteria.repo = 'archive,published';
        api.query('search', criteria)
            .then((result) => {
                $scope.contentItems = _.uniqBy(result._items, '_id');
            });
    }

    $scope.openPackage = function(packageItem) {
        if (packageItem._type === 'published') {
            superdesk.intent('view', 'item', packageItem);
        } else {
            superdesk.intent('edit', 'item', packageItem);
        }
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
                    personal: false,
                },
            });
    }])
    .controller('PackagesWidgetCtrl', PackagesCtrl);
