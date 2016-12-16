import _ from 'lodash';

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

    this.isDeskChanged = function() {
        return desks.changeDesk;
    };

    this.highlightsDeskChanged = function() {
        if (desks.changeDesk) {
            $location.url('/workspace/monitoring');
        }
    };

    var self = this;

    self.switchView(self.viewColumn);

    function preview(item) {
        self.previewItem = item;
        self.state['with-preview'] = !!item;
        let sendPreviewEvent = config.list && config.list.thinRows && config.list.narrowView;

        if (!_.isNil(self.previewItem)) {
            self.showHistoryTab = self.previewItem.state !== 'ingested';
        }

        if (!item) {
            self.selectedGroup = null;
        }

        if (self.state['with-preview'] && sendPreviewEvent) {
            $rootScope.$broadcast('item:previewed');
        }
    }

    function closePreview() {
        preview(null);
        $rootScope.$broadcast('item:unselect');
        if (self.viewColumn) {
            $rootScope.$broadcast('resize:header');
        }
    }

    function edit(item) {
        self.editItem = item;
        self.state['with-authoring'] = !!item;
    }
    function viewSingleGroup(group, type) {
        group.singleViewType = type;
        self.singleGroup = group;
    }

    function viewMonitoringHome() {
        self.singleGroup.singleViewType = null;
        self.singleGroup = null;
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
        self.viewColumn = viewColumn;

        self.columnsLimit = self.viewColumn ? config.features.swimlane.columnsLimit : null;

        return self.columnsLimit;
    }

    function selectGroup(group) {
        self.selectedGroup = self.selectedGroup && self.selectedGroup._id === group._id ? null : group;
        return self.selectedGroup;
    }
}
