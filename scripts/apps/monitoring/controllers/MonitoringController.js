MonitoringController.$inject = ['$rootScope', '$location', 'desks', 'storage', 'config'];
export function MonitoringController($rootScope, $location, desks, storage, config) {
    this.state = {};

    this.preview = preview;
    this.closePreview = closePreview;
    this.previewItem = null;

    this.selectedGroup = null;
    this.bindedItems = [];

    this.singleGroup = null;
    this.viewSingleGroup = viewSingleGroup;
    this.viewMonitoringHome = viewMonitoringHome;

    this.hasSwimlaneView = config.features && config.features.swimlane ? 1 : 0;
    this.columnsLimit = null;
    this.viewColumn = JSON.parse(storage.getItem('displaySwimlane'));

    this.selectGroup = selectGroup;
    this.switchView = switchView;

    this.queryParam = $location.search();

    this.edit = edit;
    this.editItem = null;

    this.totalItems = '';
    this.showRefresh = false;

    this.showHistoryTab = true;

    this.scrollTop = false;

    this.isDeskChanged = function () {
        return desks.changeDesk;
    };

    this.highlightsDeskChanged = function () {
        if (desks.changeDesk) {
            $location.url('/workspace/monitoring');
        }
    };

    var vm = this;

    vm.switchView(vm.viewColumn);

    function preview(item) {
        vm.previewItem = item;
        vm.state['with-preview'] = !!item;

        if (vm.previewItem != null) {
            vm.showHistoryTab = vm.previewItem.state !== 'ingested';
        }

        if (!item) {
            vm.selectedGroup = null;
        }
    }

    function closePreview() {
        preview(null);
        $rootScope.$broadcast('item:unselect');
        if (vm.viewColumn) {
            $rootScope.$broadcast('resize:header');
        }
    }

    function edit(item) {
        vm.editItem = item;
        vm.state['with-authoring'] = !!item;
    }
    function viewSingleGroup(group, type) {
        group.singleViewType = type;
        vm.singleGroup = group;
    }

    function viewMonitoringHome() {
        vm.singleGroup.singleViewType = null;
        vm.singleGroup = null;
    }

    /**
     * @description Switches the view to swimlane or list in monitoring view and
     * returns a columnsLimit a number or null for swimlane or list respectively.
     * @param {Boolean} viewColumn if set to true then function returns columnsLimit
     * for swimlane as per configuration.
     * @returns {Number|null} function returns columnsLimit null if viewColumn is false.
     */
    function switchView(viewColumn) {
        storage.setItem('displaySwimlane', viewColumn);
        vm.viewColumn = viewColumn;

        vm.columnsLimit = vm.viewColumn ? config.features.swimlane.columnsLimit : null;

        return vm.columnsLimit;
    }

    function selectGroup(group) {
        vm.selectedGroup = (vm.selectedGroup && vm.selectedGroup._id === group._id) ? null : group;
        return vm.selectedGroup;
    }
}
