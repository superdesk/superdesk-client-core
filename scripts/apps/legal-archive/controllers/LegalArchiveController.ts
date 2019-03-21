import _ from 'lodash';

LegalArchiveController.$inject = ['$scope', '$location', 'legal', 'preferencesService'];
export function LegalArchiveController($scope, $location, legal, preferencesService) {
    var viewUpdate = {'archive:view': {
        allowed: ['mgrid', 'compact'],
        category: 'archive',
        view: 'mgrid',
        default: 'mgrid',
        label: 'Users archive view format',
        type: 'string'}};

    $scope.criteria = {};
    $scope.items = legal.default_items;
    $scope.loading = false;
    $scope.selected = {};
    $scope.openAdvanceSearch = false;

    // to stop itemList to fetch new items when scrolled
    $scope.noScroll = true;

    // Required to display action icons in grid view
    $scope.extras = {activity: {action: 'list'}};

    $scope.search = function() {
        $location.search('page', null);
        legal.updateSearchQuery($scope.criteria);
    };

    function refresh() {
        $scope.loading = true;
        $scope.preview(null);
        legal.query().then((items) => {
            $scope.loading = false;
            $scope.items = items;
        });
    }

    $scope.preview = function(selectedItem) {
        $scope.selected.preview = selectedItem;
        if (selectedItem) {
            $scope.deskName = selectedItem.task.desk;
            $scope.stage = selectedItem.task.stage;
        }
    };

    $scope.openLightbox = function() {
        $scope.selected.view = $scope.selected.preview;
    };

    $scope.closeLightbox = function() {
        $scope.selected.view = null;
    };

    $scope.clear = function() {
        legal.criteria = $scope.criteria = {};
        $scope.search();
    };

    $scope.$watch(function getSearchParams() {
        return _.omit($location.search(), '_id');
    }, refresh, true);

    /**
     * Sets the item view to either grid or compact. Also, saves the same in loggedInUser's preference.
     */
    $scope.setview = function(view) {
        $scope.view = view || 'mgrid';
        viewUpdate['archive:view'].view = view || 'mgrid';
        preferencesService.update(viewUpdate, 'archive:view');
    };

    $scope.search();

    preferencesService.get('archive:view').then((result) => {
        var savedView = result.view;

        $scope.view = !!savedView && savedView !== 'undefined' ? savedView : 'mgrid';
    });
}
