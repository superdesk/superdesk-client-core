AggregateCtrl.$inject = ['$scope', 'api', 'desks', 'workspaces', 'preferencesService', 'storage',
    'gettext', 'multi', 'config', '$timeout', 'savedSearch'];

export function AggregateCtrl($scope, api, desks, workspaces, preferencesService, storage,
        gettext, multi, config, $timeout, savedSearch) {
    var PREFERENCES_KEY = 'agg:view';
    var defaultMaxItems = 10;
    var self = this;
    this.loading = true;
    this.selected = null;
    this.groups = [];
    this.spikeGroups = [];
    this.modalActive = false;
    this.searchLookup = {};
    this.deskLookup = {};
    this.stageLookup = {};
    this.fileTypes = ['all', 'text', 'picture', 'composite', 'takesPackage', 'highlightsPackage', 'video', 'audio'];
    this.selectedFileType = $scope.type === 'monitoring' ? storage.getItem('selectedFileType') || [] : [];
    this.monitoringSearch = false;
    this.searchQuery = null;

    if (config.features && config.features.noTakes) {
        this.fileTypes = this.fileTypes.filter(type => type !== 'takesPackage');
    }

    this.isOutputType = desks.isOutputType;

    desks.initialize()
    .then(angular.bind(this, function() {
        this.desks = desks.desks._items;
        this.deskLookup = desks.deskLookup;
        this.deskStages = desks.deskStages;
        _.each(this.desks, function(desk) {
            _.each(self.deskStages[desk._id], function(stage) {
                self.stageLookup[stage._id] = stage;
            });
        });
    }))
    .then(angular.bind(this, function() {
        return savedSearch.getAllSavedSearches().then(angular.bind(this, function(searchesList) {
               this.searches = searchesList;
               _.each(this.searches, function(item) {
                   self.searchLookup[item._id] = item;
               });
           }));
    }))
    .then(angular.bind(this, function() {
        return this.readSettings()
            .then(angular.bind(this, function(settings) {
                initGroups(settings);
                setupCards();
                this.loading = false;
                this.settings = settings;
            }));
    }));

    $scope.$on('savedsearch:update', angular.bind(savedSearch, savedSearch.resetSavedSearches));

    /**
     * If view showed as widget set the current widget
     *
     *@param {object} widget
     */
    this.setWidget = function(widget) {
        this.widget = widget;
    };

    /**
     * Read the setting for current selected workspace(desk or custom workspace)
     * If the view is showed in a widget, read the settings from widget configuration
     * If the current selected workspace is a desk the settings are read from desk
     * If the current selected workspace is a custom workspace the settings are read from
     * user preferences
     * @returns {Object} promise - when resolved return the list of settings
     */
    this.readSettings = function() {
        if (self.widget) {
            return workspaces.readActive()
            .then(function(workspace) {
                var groups = [];
                self.widget.configuration = self.widget.configuration || {groups: [], label: ''};
                _.each(workspace.widgets, function(widget) {
                    if (widget.configuration && self.widget._id === widget._id && self.widget.multiple_id === widget.multiple_id) {
                        groups = widget.configuration.groups || groups;
                        self.widget.configuration.label = widget.configuration.label || '';
                    }
                });
                return {'type': 'desk', 'groups': groups};
            });
        } else {
            return workspaces.getActiveId()
                .then(function(activeWorkspace) {
                    if (self.settings != null && self.settings.desk) {
                        return deskMonitoringConfig(self.settings.desk);
                    } else if (activeWorkspace.type === 'workspace') {
                        return preferencesService.get(PREFERENCES_KEY)
                            .then(function(preference) {
                                if (preference && preference[activeWorkspace.id] && preference[activeWorkspace.id].groups) {
                                    return {'type': 'workspace', 'groups': preference[activeWorkspace.id].groups};
                                }
                                return {'type': 'workspace', 'groups': []};
                            });
                    } else if (activeWorkspace.type === 'desk') {
                        var desk = self.deskLookup[activeWorkspace.id];
                        if (desk && desk.monitoring_settings) {
                            return {'type': 'desk', 'groups': desk.monitoring_settings};
                        }
                    }
                    return {'type': 'desk', 'groups': []};
                });
        }
    };

    function deskMonitoringConfig(objDesk) {
        var desk = self.deskLookup[objDesk._id];
        if (desk && desk.monitoring_settings) {
            return {'type': 'desk', 'groups': desk.monitoring_settings, 'desk': objDesk};
        }
        return {'type': 'desk', 'groups': [], 'desk': objDesk};
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
            _.each(settings.groups, function(item) {
                if (item.type === 'stage' && !self.stageLookup[item._id]) {
                    return;
                }
                if (item.type === 'search' && !self.searchLookup[item._id]) {
                    return;
                }
                self.groups.push(item);
            });
        } else if (settings && settings.groups.length === 0 && settings.type === 'desk' && settings.desk == null) {
            _.each(self.stageLookup, function(item) {
                if (item.desk === desks.getCurrentDeskId()) {
                    self.groups.push({_id: item._id, type: 'stage', header: item.name});
                }
            });

            var currentDesk = desks.getCurrentDesk();
            if (currentDesk) {
                self.groups.push({_id: currentDesk._id + ':output', type: 'deskOutput', header: currentDesk.name});
                if (config.monitoring && config.monitoring.scheduled) {
                    self.groups.push({_id: currentDesk._id + ':scheduled', type: 'scheduledDeskOutput', header: currentDesk.name});
                }
            }
        } else if (settings && settings.groups.length === 0 && settings.desk != null) {
            _.each(self.stageLookup, function(item) {
                if (item.desk === settings.desk._id) {
                    self.groups.push({_id: item._id, type: 'stage', header: item.name});
                }
            });

            var editingDesk = settings.desk;
            if (editingDesk) {
                self.groups.push({_id: editingDesk._id + ':output', type: 'deskOutput', header: editingDesk.name});
            }
        }
        initSpikeGroups(settings.type === 'desk');
        updateFileTypeCriteria();
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
        var spikeDesks = {};
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

        _.each(self.groups, function(item, index) {
            if (item.type === 'stage') {
                var stage = self.stageLookup[item._id];
                spikeDesks[stage.desk] = self.deskLookup[stage.desk];
            } else if (item.type === 'personal') {
                spikeDesks.personal = {_id: 'personal', name: 'personal'};
            }
        });

        _.each(spikeDesks, function(item) {
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
            .then(function(settings) {
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
    $scope.$watch(function() {
        return workspaces.active;
    }, refresh);

    /**
     * Return true if the 'fileType' filter is selected
     * param {string} fileType
     * @return boolean
     */
    this.hasFileType = function(fileType) {
        if (fileType === 'all') {
            return this.selectedFileType.length === 0;
        }
        return this.selectedFileType.indexOf(fileType) > -1;
    };

    /**
     * Return selected file types if the 'fileType' filter(s) is selected
     * @return [{string}] fileType
     */
    this.getSelectedFileTypes = function() {
        return (this.selectedFileType.length === 0) ? null: JSON.stringify(this.selectedFileType);
    };

    /**
     * Update the type filter criteria
     */
    function updateFileTypeCriteria() {
        var value = (self.selectedFileType.length === 0) ? null: JSON.stringify(self.selectedFileType);

        _.each(self.groups, function(item) {
            item.fileType = value;
        });
        _.each(self.spikeGroups, function(item) {
            item.fileType = value;
        });
    }

    /**
     * Set the current 'fileType' filter
     * param {string} fileType
     */
    this.setFileType = function(fileType) {
        multi.reset();
        if (fileType === 'all') {
            this.selectedFileType = [];
        } else {
            var index = this.selectedFileType.indexOf(fileType);
            if (index > -1) {
                this.selectedFileType.splice(index, 1);
            } else {
                this.selectedFileType.push(fileType);
            }
        }
        if ($scope.type === 'monitoring') {
            storage.setItem('selectedFileType', this.selectedFileType);
        }
        updateFileTypeCriteria();
    };

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
                card.subheader = stage.name;
            } else if (desks.isOutputType(card.type)) {
                var desk_id = card._id.substring(0, card._id.indexOf(':'));
                card.header = self.deskLookup[desk_id].name;
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
    this.edit = function() {
        this.editGroups = {};
        var _groups = this.groups;
        this.refreshGroups().then(function() {
            _.each(_groups, function(item, index) {
                self.editGroups[item._id] = {
                    _id: item._id,
                    selected: true,
                    type: item.type,
                    max_items: item.max_items || defaultMaxItems,
                    order: index
                };
                if (item.type === 'stage') {
                    var stage = self.stageLookup[item._id];
                    self.editGroups[stage.desk] = {
                        _id: stage._id,
                        selected: true,
                        type: 'desk',
                        order: 0
                    };
                } else if (desks.isOutputType(item.type)) {
                    var desk_id = item._id.substring(0, item._id.indexOf(':'));
                    self.editGroups[desk_id] = {
                        _id: item._id,
                        selected: true,
                        type: 'desk',
                        order: 0
                    };
                }
            });
        });
        this.modalActive = true;
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
        _.each(this.groups, function(item) {
            item.query = query;
        });
        _.each(this.spikeGroups, function(item) {
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
        return (this.state.expanded[key] === undefined) ? true : this.state.expanded[key];
    };

    this.setSoloGroup = function(group) {
        this.state.solo = group;
        storage.setItem('agg:state', this.state);
    };

    this.getMaxHeightStyle = function(maxItems) {
        var maxHeight = 32 * (maxItems || defaultMaxItems);
        return {'max-height':  maxHeight.toString() + 'px'};
    };

    $scope.$on('open:archived_kill', function(evt, item) {
        $scope.archived_kill = item;
    });

    $scope.$on('open:resend', function(evt, item) {
        $scope.resend = item;
    });
}
