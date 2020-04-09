import _ from 'lodash';
import {gettext} from 'core/utils';
import {SCHEDULED_OUTPUT, DESK_OUTPUT} from 'apps/desks/constants';
import {appConfig} from 'appConfig';
import {IMonitoringFilter} from 'superdesk-api';
import {getLabelForStage} from 'apps/workspace/content/constants';

AggregateCtrl.$inject = ['$scope', 'desks', 'workspaces', 'preferencesService', 'storage',
    'savedSearch', 'content'];
export function AggregateCtrl($scope, desks, workspaces, preferencesService, storage,
    savedSearch, content) {
    const CONTENT_PROLFILE = gettext('Content profile');
    var PREFERENCES_KEY = 'agg:view';
    var defaultMaxItems = 10;
    var self = this;

    this.loading = true;
    this.selected = null;
    this.groups = [];
    this.spikeGroups = [];
    this.modalActive = false;
    this.displayOnlyCurrentStep = false;
    this.columnsLimit = null;
    this.currentStep = 'desks';
    this.searchLookup = {};
    this.deskLookup = {};
    this.stageLookup = {};
    this.fileTypes = ['all', 'text', 'picture', 'graphic', 'composite',
        'highlightsPackage', 'video', 'audio'];
    this.monitoringSearch = false;
    this.searchQuery = null;
    this.isOutputType = desks.isOutputType;

    this.activeProfiles = [];
    this.activeFilters = {
        contentProfile: $scope.type === 'monitoring' ? storage.getItem('contentProfile') || [] : [],
        fileType: $scope.type === 'monitoring' ? storage.getItem('fileType') || [] : [],
    };
    this.activeFilterTags = {};

    desks.initialize()
        .then(angular.bind(this, function() {
            this.desks = desks.desks._items;
            this.deskLookup = desks.deskLookup;
            this.deskStages = desks.deskStages;
            _.each(this.desks, (desk) => {
                _.each(self.deskStages[desk._id], (stage) => {
                    self.stageLookup[stage._id] = stage;
                });
            });
        }))
        .then(angular.bind(this, function() {
            return savedSearch.getAllSavedSearches().then(angular.bind(this, function(searchesList) {
                this.searches = searchesList;
                _.each(this.searches, (item) => {
                    self.searchLookup[item._id] = item;
                });
            }));
        }))
        .then(angular.bind(this, function() {
            return this.readSettings()
                .then(angular.bind(this, function(settings) {
                    initGroups(settings);
                    setupCards();
                    this.settings = settings;
                    getActiveProfiles();
                }));
        }));

    /**
     * If view showed as widget set the current widget
     *
     *@param {object} widget
     */
    this.setWidget = function(widget) {
        this.widget = widget;
    };

    /**
     * Read the setting for currently selected workspace(desk or custom workspace)
     * If the view is showed in a widget, read the settings from widget configuration.
     * If the view is showed in a desk settings, read the settings from desk's monitoring settings.
     * If the current selected workspace is a custom workspace then settings are read from user preferences.
     * If the current selected workspace is a desk then settings are read from user preferences first, if
     * no user preference found then settings read from desk's monitoring settings.
     * @returns {Object} promise - when resolved return the list of settings
     */
    this.readSettings = function() {
        if (self.widget) {
            // when reading from monitoring widget
            return widgetMonitoringConfig(self.widget);
        }

        return workspaces.getActiveId().then((activeWorkspace) => {
            if (!_.isNil(self.settings) && self.settings.desk) {
                // when viewing in desk's monitoring settings
                return deskSettingsMonitoringConfig(self.settings.desk);
            }
            // when viewing in monitoring view
            return workspaceMonitoringConfig(activeWorkspace);
        });
    };

    /**
     * Read settings in monitoring view for custom or desk workspace
     * according to active workspace type
     * @param {Object} activeWorkspace - contains workspace id and type.
     **/
    function workspaceMonitoringConfig(activeWorkspace) {
        if (activeWorkspace.type === 'workspace') {
            // when custom workspace selected in monitoring view.
            return customWorkspaceMonitoringConfig(activeWorkspace);
        } else if (activeWorkspace.type === 'desk') {
            // when desk selected in monitoring view.
            return deskWorkspaceMonitoringConfig(activeWorkspace);
        }
    }

    /**
     * Read aggregate settings in monitoring view for desk workspace,
     * settings read from user preferences first, if no preferences
     * found then settings read from desk's monitoring settings.
     * @param {Object} activeWorkspace - contains workspace id and type.
     * @return {Object} {type: {String}, groups: {Array}}
     **/
    function deskWorkspaceMonitoringConfig(activeWorkspace) {
        // Read available groups from user preferences first
        return preferencesService.get(PREFERENCES_KEY).then((preference) => {
            let groups = [];
            let desk = self.deskLookup[activeWorkspace.id];
            let monitoringSettings = desk ? desk.monitoring_settings || [] : [];
            let activePrefGroups = preference[activeWorkspace.id] ? preference[activeWorkspace.id].groups || [] : [];

            if (activePrefGroups.length) {
                if (monitoringSettings.length) {
                    // compare and determine if set of groups in desk monitoring settings &
                    // user preferences are same or changed now, due to stages activated
                    // or deactivated in desk's monitoring settings.
                    let diff = _.xorBy(monitoringSettings, activePrefGroups, '_id');

                    if (diff.length) {
                        // if different, that means available stages/groups are changed now in desk monitoring settings
                        // so simply return recent desk monitoring settings.
                        groups = monitoringSettings;
                    } else {
                        // update groups in preferences with any changes in desk's monitoring settings groups.
                        activePrefGroups.forEach((group) =>
                            angular.extend(group, monitoringSettings.find((grp) => grp._id === group._id)));

                        groups = activePrefGroups;
                    }
                } else {
                    groups = activePrefGroups;
                }
            } else {
                // when no user preferences found
                groups = monitoringSettings;
            }

            return {type: 'desk', groups: groups};
        });
    }

    /**
     * Read aggregate settings in monitoring view for custom workspace
     * @param {Object} activeWorkspace - contains workspace id and type.
     * @return {Object} {type: {String}, groups: {Array}}
     **/
    function customWorkspaceMonitoringConfig(activeWorkspace) {
        return preferencesService.get(PREFERENCES_KEY).then((preference) => {
            let groups = [];

            if (preference && preference[activeWorkspace.id] && preference[activeWorkspace.id].groups) {
                groups = preference[activeWorkspace.id].groups;
            }
            return {type: 'workspace', groups: groups};
        });
    }

    /**
     * Read aggregate settings for monitoring widget
     * @param {Object} objWidget - contains widget configuration
     * @return {Object} {type: {String}, groups: {Array}}
     **/
    function widgetMonitoringConfig(objWidget) {
        return workspaces.readActive().then((workspace) => {
            let groups = [];

            self.widget.configuration = objWidget.configuration || {groups: [], label: ''};
            _.each(workspace.widgets, (widget) => {
                if (widget.configuration && self.widget._id === widget._id
                    && self.widget.multiple_id === widget.multiple_id) {
                    groups = widget.configuration.groups || groups;
                    self.widget.configuration.label = widget.configuration.label || '';
                }
            });
            return {type: 'desk', groups: groups};
        });
    }

    /**
     * Read aggregate settings for desk monitoring settings
     * @param {Object} objDesk - contains desk configuration
     * @return {Object} {type: {String}, groups: {Array}, desk: {Object}}
     **/
    function deskSettingsMonitoringConfig(objDesk) {
        let groups = [];
        let desk = self.deskLookup[objDesk._id];

        if (desk && desk.monitoring_settings) {
            groups = desk.monitoring_settings;
        }
        return {type: 'desk', groups: groups, desk: objDesk};
    }

    /**
     * Init groups by filter out from groups stages or saved searches that
     * are not available(deleted or no right on them for stages only) and return all
     * stages for current desk if monitoring setting is not set
     **/
    function initGroups(settings) {
        if (self.groups.length > 0) {
            self.groups.length = 0;
        }
        if (settings && settings.groups.length > 0) {
            _.each(settings.groups, (item) => {
                if (item.type === 'stage' && !self.stageLookup[item._id]) {
                    return;
                }
                if (item.type === 'search' && !self.searchLookup[item._id]) {
                    return;
                }
                self.groups.push(item);
            });
        } else if (settings && settings.groups.length === 0 && settings.type === 'desk' && _.isNil(settings.desk)) {
            _.each(self.stageLookup, (item) => {
                if (item.desk === desks.getCurrentDeskId()) {
                    self.groups.push({_id: item._id, type: 'stage', header: item.name});
                }
            });

            var currentDesk = desks.getCurrentDesk();

            if (currentDesk) {
                self.groups.push({_id: currentDesk._id + ':output', type: DESK_OUTPUT, header: currentDesk.name});
                if (appConfig.monitoring != null && appConfig.monitoring.scheduled) {
                    self.groups.push({
                        _id: currentDesk._id + ':scheduled',
                        type: SCHEDULED_OUTPUT,
                        header: currentDesk.name,
                    });
                }
            }
        } else if (settings && settings.groups.length === 0 && !_.isNil(settings.desk)) {
            _.each(self.stageLookup, (item) => {
                if (item.desk === settings.desk._id) {
                    self.groups.push({_id: item._id, type: 'stage', header: item.name});
                }
            });

            var editingDesk = settings.desk;

            if (editingDesk) {
                self.groups.push({_id: editingDesk._id + ':output', type: DESK_OUTPUT, header: editingDesk.name});
            }
        }
        initSpikeGroups(settings.type === 'desk');
        updateFilteringCriteria();
        self.search(self.searchQuery);
    }

    /**
     * Init the spike desks based on already initialized groups
     *
     * for desk workspace only show current desk spiked items
     *
     * @param {boolean} isDesk
     */
    function initSpikeGroups(isDesk) {
        var spikeDesks: any = {};

        if (self.spikeGroups.length > 0) {
            self.spikeGroups.length = 0;
        }

        if (isDesk) {
            var desk = desks.getCurrentDesk();

            if (desk) {
                self.spikeGroups = [{_id: desk._id, type: 'spike'}];
            }
            return;
        }

        if (self.groups.length === 0) {
            return;
        }

        _.each(self.groups, (item, index) => {
            if (item.type === 'stage') {
                var stage = self.stageLookup[item._id];

                spikeDesks[stage.desk] = self.deskLookup[stage.desk];
            } else if (item.type === 'personal') {
                spikeDesks.personal = {_id: 'personal', name: 'personal'};
            }
        });

        _.each(spikeDesks, (item: any) => {
            if (item._id === 'personal') {
                self.spikeGroups.push({_id: item._id, type: 'spike-personal', header: item.name});
            } else {
                self.spikeGroups.push({_id: item._id, type: 'spike', header: item.name});
            }
        });
    }

    /**
     * Refresh view after setup
     */
    function refresh() {
        if (self.loading) {
            return null;
        }
        return self.readSettings()
            .then((settings) => {
                initGroups(settings);
                setupCards();
                self.settings = settings;
            });
    }

    this.refreshGroups = refresh;

    /**
     * Read the settings when the current workspace
     * selection is changed
     */
    $scope.$watch(() => workspaces.active, refresh);

    /**
     * Return true if the 'fileType' filter is selected
     * param {string} fileType
     * @return boolean
     */
    this.hasFileType = function(fileType) {
        if (fileType === 'all') {
            return this.activeFilters.fileType.length === 0;
        }
        return this.activeFilters.fileType.includes(fileType);
    };

    this.getSelectedFileTypes = function(): string {
        return this.activeFilters.fileType.length === 0 ? null : JSON.stringify(this.activeFilters.fileType);
    };

    this.getSelectedContentProfiles = function(): string {
        return this.activeFilters.contentProfile.length === 0 ? null
            : JSON.stringify(this.activeFilters.contentProfile);
    };

    function updateFilteringCriteria() {
        _.forEach(self.activeFilters, (filterValue, filterType) => {
            var value = filterValue.length === 0 ? null : JSON.stringify(filterValue);

            _.each(self.groups, (item) => {
                item[filterType] = value;
            });
            _.each(self.spikeGroups, (item) => {
                item[filterType] = value;
            });
        });
    }

    this.isCustomFilterActive = (filter: IMonitoringFilter) => {
        return Object.keys(this.activeFilters.customFilters ?? {}).includes(filter.label);
    };

    this.toggleCustomFilter = (filter: IMonitoringFilter) => {
        if (typeof this.activeFilters.customFilters === 'undefined') {
            this.activeFilters.customFilters = {};
        }

        if (Object.keys(this.activeFilters.customFilters).includes(filter.label)) {
            delete this.activeFilters.customFilters[filter.label];
        } else {
            this.activeFilters.customFilters[filter.label] = filter;
        }

        updateFilterInStore();
        updateFilteringCriteria();
        $scope.$apply();
    };

    this.setFilterType = function(filterType, filterValue, $event?) {
        if (filterType === 'contentProfile') {
            if (!this.activeFilters.contentProfile.includes(filterValue._id)) {
                this.activeFilters.contentProfile.push(filterValue._id);
                const tag = {'key': filterValue._id, 'label': gettext(filterValue.label)};

                if (Array.isArray(this.activeFilterTags[CONTENT_PROLFILE])) {
                    this.activeFilterTags[CONTENT_PROLFILE].push(tag);
                } else {
                    this.activeFilterTags[CONTENT_PROLFILE] = [tag];
                }
            }
        } else if (filterType === 'file') {
            if (filterValue === 'all') {
                this.activeFilters.fileType = [];
            } else {
                let filterIndex = this.activeFilters.fileType.indexOf(filterValue);

                if (filterIndex > -1) {
                    this.activeFilters.fileType.splice(filterIndex, 1);
                } else {
                    this.activeFilters.fileType.push(filterValue);
                }
            }
        }

        updateFilterInStore();
        updateFilteringCriteria();

        if ($event?.ctrlKey) {
            $event.stopPropagation();
            return null;
        }
    };

    this.removeFilter = (filter, type?) => {
        if (filter == null) {
            this.activeFilters.contentProfile = [];
            this.activeFilterTags = {};
        } else {
            this.activeFilters.contentProfile = this.activeFilters.contentProfile
                .filter((profile) => profile !== filter);
            this.activeFilterTags[type] = this.activeFilterTags[type].filter((tags) => tags.key !== filter);
        }

        updateFilterInStore();
        updateFilteringCriteria();
    };

    // Save filters in the store
    function updateFilterInStore() {
        if ($scope.type === 'monitoring') {
            storage.setItem('fileType', self.activeFilters.fileType);
            storage.setItem('contentProfile', self.activeFilters.contentProfile);
        }
    }

    /**
     * Add card metadata into current groups
     */
    function setupCards() {
        var cards = self.groups;

        angular.forEach(cards, setupCard);
        self.cards = cards;

        /**
         * Add card metadata into group
         */
        function setupCard(card) {
            if (card.type === 'stage') {
                var stage = self.stageLookup[card._id];
                var desk = self.deskLookup[stage.desk];

                card.deskId = stage.desk;
                card.header = desk.name;
                card.subheader = getLabelForStage(stage);
            } else if (desks.isOutputType(card.type)) {
                var deskId = card._id.substring(0, card._id.indexOf(':'));

                card.header = self.deskLookup[deskId].name;
            } else if (card.type === 'search') {
                card.search = self.searchLookup[card._id];
                card.header = card.search.name;
            } else if (card.type === 'personal') {
                card.header = gettext('Personal');
            }
        }
    }

    this.preview = function(item) {
        this.selected = item;
    };

    /**
     * For edit monitoring settings add desk groups to the list
     */
    this.edit = function(currentStep, displayOnlyCurrentStep) {
        this.editGroups = {};
        var _groups = this.groups;

        this.refreshGroups().then(() => {
            _.each(_groups, (item, index) => {
                self.editGroups[item._id] = {
                    _id: item._id,
                    selected: true,
                    type: item.type,
                    max_items: item.max_items || defaultMaxItems,
                    order: index,
                };
                if (item.type === 'stage') {
                    var stage = self.stageLookup[item._id];

                    self.editGroups[stage.desk] = {
                        _id: stage._id,
                        selected: true,
                        type: 'desk',
                        order: 0,
                    };
                } else if (desks.isOutputType(item.type)) {
                    var deskId = item._id.substring(0, item._id.indexOf(':'));

                    self.editGroups[deskId] = {
                        _id: item._id,
                        selected: true,
                        type: 'desk',
                        order: 0,
                    };
                }
            });
        });

        this.modalActive = true;

        this.currentStep = currentStep || 'desks';
        this.displayOnlyCurrentStep = displayOnlyCurrentStep;
    };

    this.searchOnEnter = function($event, query) {
        var ENTER = 13;

        if ($event.keyCode === ENTER) {
            this.search(query);
            $event.stopPropagation();
        }
    };

    /**
     * Set the search set by user on all groups
     */
    this.search = function(query) {
        this.searchQuery = query;
        _.each(this.groups, (item) => {
            item.query = query;
        });
        _.each(this.spikeGroups, (item) => {
            item.query = query;
        });
    };

    this.state = storage.getItem('agg:state') || {};
    this.state.expanded = this.state.expanded || {};

    this.switchExpandedState = function(key) {
        this.state.expanded[key] = !this.getExpandedState(key);
        storage.setItem('agg:state', this.state);
    };

    this.getExpandedState = function(key) {
        return this.state.expanded[key] === undefined ? true : this.state.expanded[key];
    };

    this.setSoloGroup = function(group) {
        this.state.solo = group;
        storage.setItem('agg:state', this.state);
    };

    this.getMaxHeightStyle = function(maxItems) {
        var maxHeight = 32 * (maxItems || defaultMaxItems);

        return {'max-height': maxHeight.toString() + 'px'};
    };

    $scope.$on('open:archived_kill', (evt, item, action) => {
        $scope.archived_kill = item;
        $scope.archived_kill_action = action;
    });

    $scope.$on('open:resend', (evt, item) => {
        $scope.resend = item;
    });

    function getActiveProfiles() {
        content.getTypes(false).then((profiles) => {
            self.loading = false;
            self.activeProfiles = profiles;

            // initialize the activeFilterTags once the activeProfiles are available
            if (self.activeFilters.contentProfile.length > 0) {
                self.activeFilterTags[CONTENT_PROLFILE] = self.activeFilters.contentProfile.map((filter) => {
                    const profile = profiles.find((p) => p._id === filter);

                    return {key: profile._id, label: profile.label};
                });
            }
        });
    }
}
