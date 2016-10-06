MonitoringController.$inject = ['$rootScope', '$location', 'desks'];
export function MonitoringController($rootScope, $location, desks) {
    this.state = {};

    this.preview = preview;
    this.closePreview = closePreview;
    this.previewItem = null;

    this.selectedGroup = null;
    this.bindedItems = [];

    this.singleGroup = null;
    this.viewSingleGroup = viewSingleGroup;
    this.viewMonitoringHome = viewMonitoringHome;

    this.queryParam = $location.search();

    this.edit = edit;
    this.editItem = null;

    this.totalItems = '';
    this.showRefresh = false;
    this.showHistoryTab = true;

    this.isDeskChanged = function () {
        return desks.changeDesk;
    };

    this.highlightsDeskChanged = function () {
        if (desks.changeDesk) {
            $location.url('/workspace/monitoring');
        }
    };

    var vm = this;

    function preview(item) {
        vm.previewItem = item;
        vm.state['with-preview'] = !!item;
        vm.previewItem.state === 'ingested' ? vm.showHistoryTab = false : vm.showHistoryTab = true;
    }

    function closePreview() {
        preview(null);
        $rootScope.$broadcast('item:unselect');
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
}
