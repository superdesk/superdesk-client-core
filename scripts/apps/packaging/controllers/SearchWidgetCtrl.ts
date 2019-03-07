import _ from 'lodash';

SearchWidgetCtrl.$inject = ['$scope', 'packages', 'api', 'search'];
export function SearchWidgetCtrl($scope, packages, api, search) {
    $scope.selected = null;
    $scope.multiSelected = [];
    $scope.query = null;
    $scope.highlight = null;

    var packageItems = null;
    var init = false;

    $scope.groupList = packages.groupList;

    fetchContentItems();

    function fetchContentItems() {
        if (!init) {
            return;
        }

        var params: any = {};

        params.q = $scope.query;
        params.ignoreKilled = true;
        params.ignoreDigital = true;
        params.ignoreScheduled = true;
        params.onlyLastPublished = true;

        var query = search.query(params);

        query.filter({not: {exists: {field: 'embargo'}}});
        query.size(25);
        if ($scope.highlight) {
            query.filter({term: {highlights: $scope.highlight.toString()}});
        }

        var criteria = query.getCriteria(true);

        criteria.repo = 'archive,published';

        api.query('search', criteria)
            .then((result) => {
                $scope.contentItems = result._items;
            });
    }

    $scope.$watch('query', (query) => {
        fetchContentItems();
    });

    $scope.$watch('highlight', (highlight) => {
        fetchContentItems();
    });

    $scope.$watch('item', (item) => {
        $scope.highlight = item.highlight;
        if ($scope.highlight) {
            api('highlights').getById($scope.highlight)
                .then((result) => {
                    $scope.groupList = result.groups;
                    init = true;
                    fetchContentItems();
                }, (response) => {
                    init = true;
                    fetchContentItems();
                });
        } else {
            init = true;
            fetchContentItems();
        }
    });

    $scope.$watch('item.groups', () => {
        getPackageItems();
    }, true);

    /**
     * Add a content item to a given group
     * @param {Object} group
     * @param {Object} item
     */
    $scope.addItemToGroup = function(group, item) {
        packages.addItemsToPackage($scope.item, group, [item]);
        $scope.autosave($scope.item);
    };

    $scope.preview = function(item) {
        $scope.selected = item;
    };

    function getPackageItems() {
        var items = [];

        if ($scope.item.groups) {
            _.each($scope.item.groups, (group) => {
                if (group.id !== 'root') {
                    _.each(group.refs, (item) => {
                        items.push(item.residRef);
                    });
                }
            });
        }
        packageItems = items;
    }

    $scope.itemInPackage = function(item) {
        return _.indexOf(packageItems, item._id) > -1;
    };

    $scope.addToSelected = function(pitem) {
        if (pitem.multi) {
            $scope.multiSelected.push(pitem);
        } else {
            _.remove($scope.multiSelected, pitem);
        }
    };

    $scope.addMultiItemsToGroup = function(group) {
        // add to group
        packages.addItemsToPackage($scope.item, group, $scope.multiSelected);
        $scope.autosave($scope.item);

        // uncheck all
        _.each($scope.multiSelected, (item) => {
            item.multi = false;
            packages.addPackageGroupItem(group, item, false);
        });

        // clear items
        $scope.multiSelected = [];
    };
}
