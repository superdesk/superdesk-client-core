import _ from 'lodash';

/**
 * @ngdoc controller
 * @module superdesk.apps.monitoring
 * @name MonitoringController
 *
 * @requires $rootscope
 * @requires $location
 * @requires desks
 * @requires config
 * @requires superdeskFlags
 * @requires search
 *
 * @description MonitoringController is responsible for providing functionalities in monitoring view of the application
 */
MonitoringController.$inject = ['$rootScope', '$scope', '$location', 'desks', 'config', 'superdeskFlags',
    'search', '$filter', 'preferencesService', '$q'];
export function MonitoringController($rootScope, $scope, $location, desks, config, superdeskFlags,
    search, $filter, preferencesService, $q) {
    this.state = {};

    this.preview = preview;
    this.closePreview = closePreview;
    this.previewItem = null;

    this.selectedGroup = null;

    this.singleGroup = null;
    this.viewSingleGroup = viewSingleGroup;
    this.viewMonitoringHome = viewMonitoringHome;

    this.hasSwimlaneView = config.features && config.features.swimlane ? 1 : 0;
    this.columnsLimit = null;

    // init swimlane view using preferences - use session preferences if set, or fallback to user preferences
    $q.all({
        userPreference: preferencesService.get('monitoring:view'),
        sessionPreference: preferencesService.get('monitoring:view:session'),
    }).then(({userPreference, sessionPreference}) => {
        this.viewColumn = sessionPreference !== null ?
            sessionPreference === 'swimlane' : userPreference.view === 'swimlane';
        this.switchViewColumn(this.viewColumn);
    });

    this.selectGroup = selectGroup;
    this.switchViewColumn = switchViewColumn;

    this.queryParam = $location.search();

    this.edit = edit;
    this.editItem = null;

    this.totalItems = '';
    this.showRefresh = false;

    this.showHistoryTab = true;

    this.scrollTop = false;

    this.getGroupLabel = getGroupLabel;

    this.isDeskChanged = function() {
        return desks.changeDesk;
    };

    this.highlightsDeskChanged = function() {
        if (desks.changeDesk) {
            $location.url('/workspace/monitoring');
        }
    };

    var self = this;

    function preview(item) {
        self.previewItem = item;
        self.state['with-preview'] = superdeskFlags.flags.previewing = !!item;
        const sendPreviewEvent = _.get(config, 'list.narrowView')
            && search.singleLine && superdeskFlags.flags.authoring;
        const evnt = item ? 'rowview:narrow' : 'rowview:default';

        if (!_.isNil(self.previewItem)) {
            self.showHistoryTab = self.previewItem.state !== 'ingested' &&
            !_.includes(['archived', 'externalsource'], self.previewItem._type);
        }

        if (!item) {
            self.selectedGroup = null;
        }

        if (sendPreviewEvent) {
            $rootScope.$broadcast(evnt);
        }
    }

    function closePreview() {
        preview(null);
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
     * @param {Boolean} updateSession if set it will update user session setting.
     * @returns {Number|null} function returns columnsLimit null if viewColumn is false.
     */
    function switchViewColumn(viewColumn, updateSession, numberOfColumns) {
        self.viewColumn = viewColumn;

        if (self.viewColumn) {
            self.columnsLimit = numberOfColumns ? numberOfColumns : config.features.swimlane.defaultNumberOfColumns;
        } else {
            self.columnsLimit = null;
        }

        $scope.$broadcast('view:column', {viewColumn: self.viewColumn});
        if (updateSession) {
            preferencesService.update({'monitoring:view:session': viewColumn}, 'monitoring:view:session');
        }
        return self.columnsLimit;
    }

    function selectGroup(group) {
        self.selectedGroup = self.selectedGroup && self.selectedGroup._id === group._id ? null : group;
        return self.selectedGroup;
    }

    function getGroupLabel(group, activeWorkspace) {
        let groupLabel;

        if (group.subheader) {
            groupLabel = activeWorkspace === 'workspace' ?
                group.header + ' ' + group.subheader : group.subheader;
        } else {
            groupLabel = group.header + ' ' + $filter('splitText')(group.type);
        }

        return groupLabel;
    }
}
