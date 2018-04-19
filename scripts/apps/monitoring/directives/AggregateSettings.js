import _ from 'lodash';

AggregateSettings.$inject = ['desks', 'workspaces', 'session', 'preferencesService', 'WizardHandler', '$filter'];
export function AggregateSettings(desks, workspaces, session, preferencesService, WizardHandler, $filter) {
    return {
        templateUrl: 'scripts/apps/monitoring/views/aggregate-settings-configuration.html',
        scope: {
            modalActive: '=',
            desks: '=',
            deskStages: '=',
            searches: '=',
            deskLookup: '=',
            stageLookup: '=',
            searchLookup: '=',
            groups: '=',
            editGroups: '=',
            onclose: '&',
            widget: '=',
            settings: '=',
            currentStep: '=',
            displayOnlyCurrentStep: '=',
            columnsLimit: '=',
        },
        link: function(scope, elem) {
            var PREFERENCES_KEY = 'agg:view';
            var defaultMaxItems = 10;

            scope.showGlobalSavedSearches = false;
            scope.showPrivateSavedSearches = true;
            scope.privateSavedSearches = [];
            scope.globalSavedSearches = [];

            desks.initialize()
                .then(() => {
                    scope.userLookup = desks.userLookup;
                    scope.setCurrentStep();
                });

            scope.$watch('step.current', (step) => {
                if (step === 'searches') {
                    workspaces.getActiveId().then((activeWorkspace) => {
                        if (activeWorkspace.type === 'workspace') {
                            scope.showPrivateSavedSearches = true;
                        } else {
                            scope.showGlobalSavedSearches = true;
                            scope.showPrivateSavedSearches = false;
                        }
                    });

                    scope.initGlobalSavedSearches();
                    scope.initPrivateSavedSearches();
                }
            });

            scope.closeModal = function() {
                scope.step.current = 'desks';
                scope.modalActive = false;
                scope.showGlobalSavedSearches = false;
                scope.onclose();
            };

            scope.previous = function() {
                WizardHandler.wizard('aggregatesettings').previous();
            };

            scope.next = function() {
                WizardHandler.wizard('aggregatesettings').next();
            };

            /**
             * @description Returns true if this step in wizard should need to hide, false otherwise.
             * Only current step will be shown when displayOnlyCurrentStep is defined.
             * @param {String} code name of this step in wizard, i.e: desks, searches, reorder, maxitems
             * @returns {Boolean}
             */
            scope.shouldHideStep = function(code) {
                return !_.isNil(scope.displayOnlyCurrentStep) && !(scope.displayOnlyCurrentStep
                    && scope.currentStep === code);
            };

            /**
             * @description Sets current step in wizard, default is 'desks'.
             */
            scope.setCurrentStep = function() {
                scope.step = {
                    current: scope.currentStep || 'desks',
                };
            };

            scope.cancel = function() {
                scope.closeModal();
            };

            scope.setDeskInfo = function(_id) {
                var item = scope.editGroups[_id];

                item._id = _id;
                item.type = 'desk';
                item.order = 0;

                var deskOutput = scope.editGroups[_id + ':output'];

                if (deskOutput) {
                    deskOutput.selected = item.selected;
                }

                var scheduledDeskOutput = scope.editGroups[_id + ':scheduled'];

                if (scheduledDeskOutput) {
                    scheduledDeskOutput.selected = item.selected;
                }
            };

            scope.setStageInfo = function(_id) {
                var item = scope.editGroups[_id];

                if (!item.type) {
                    item._id = _id;
                    item.type = 'stage';
                    item.max_items = defaultMaxItems;
                    item.order = _.size(scope.editGroups);
                }
            };

            scope.setDeskOutputInfo = function(_id) {
                var item = scope.editGroups[_id];

                item._id = _id;
                item.type = 'deskOutput';
                item.max_items = defaultMaxItems;
                item.order = _.size(scope.editGroups);

                scope.editGroups[_id] = item;
            };

            scope.setScheduledDeskOutputInfo = function(_id) {
                var item = scope.editGroups[_id];

                item._id = _id;
                item.type = 'scheduledDeskOutput';
                item.max_items = defaultMaxItems;
                item.order = _.size(scope.editGroups);

                scope.editGroups[_id] = item;
            };

            scope.setSearchInfo = function(_id) {
                var item = scope.editGroups[_id];

                if (!item.type) {
                    item._id = _id;
                    item.type = 'search';
                    item.max_items = defaultMaxItems;
                    item.order = _.size(scope.editGroups);
                }
            };

            scope.setPersonalInfo = function() {
                var item = scope.editGroups.personal;

                if (!item.type) {
                    item._id = 'personal';
                    item.type = 'personal';
                    item.max_items = defaultMaxItems;
                    item.order = _.size(scope.editGroups);
                }
            };

            /**
             * Init private saved searches with all saved searches for this user
             */
            scope.initPrivateSavedSearches = function() {
                var user = session.identity._id;

                if (scope.privateSavedSearches.length > 0) {
                    scope.privateSavedSearches.length = 0;
                }
                _.each($filter('sortByName')(scope.searches), (item) => {
                    if (item.user === user && !item.is_global) {
                        scope.privateSavedSearches.push(item);
                    }
                });
            };

            /**
             * Init global saved searches with all saved searches for all users
             * where is_global flag is true
             */
            scope.initGlobalSavedSearches = function() {
                if (scope.globalSavedSearches.length > 0) {
                    scope.globalSavedSearches.length = 0;
                }
                _.each($filter('sortByName')(scope.searches), (item) => {
                    if (item.is_global) {
                        scope.globalSavedSearches.push(item);
                        var group = scope.editGroups[item._id];

                        if (group && group.selected) {
                            scope.showGlobalSavedSearches = true;
                        }
                    }
                });
            };

            /**
             * Return the list of selected groups (stages, personal or saved searches)
             * @return {Array} list of groups
             */
            scope.getValues = function() {
                var values = Object.keys(scope.editGroups).map((key) => scope.editGroups[key]);

                values = _.filter(values, (item) => {
                    if (item.type === 'desk' || !item.selected) {
                        return false;
                    }
                    if (item.type === 'stage') {
                        var stage = scope.stageLookup[item._id];

                        return scope.editGroups[stage.desk].selected;
                    }

                    if (item.type === 'personal') {
                        return scope.editGroups.personal.selected;
                    }
                    return true;
                });
                values = _.sortBy(values, (item) => item.order);

                _.each(values, (item) => {
                    if (desks.isOutputType(item.type)) {
                        var deskId = item._id.substring(0, item._id.indexOf(':'));

                        item.name = desks.deskLookup[deskId].name;
                    }
                });

                return values;
            };

            scope.reorder = function(start, end, uiItem) {
                var values = scope.getValues();

                if (end.index !== start.index) {
                    values.splice(end.index, 0, values.splice(start.index, 1)[0]);
                    _.each(values, (item, index) => {
                        item.order = index;
                    });
                }
            };

            scope.save = function() {
                var groups = [];

                _.each(scope.getValues(), (item, index) => {
                    if (item.selected && item.type !== 'desk') {
                        groups.push({
                            _id: item._id,
                            type: item.type,
                            max_items: item.max_items,
                        });
                    }
                });

                if (scope.widget) {
                    workspaces.getActive()
                        .then((workspace) => {
                            var widgets = angular.copy(workspace.widgets);

                            _.each(widgets, (widget) => {
                                if (scope.widget._id === widget._id
                                    && scope.widget.multiple_id === widget.multiple_id) {
                                    widget.configuration = {};
                                    widget.configuration.groups = groups;
                                    if (scope.widget.configuration.label) {
                                        widget.configuration.label = scope.widget.configuration.label;
                                    }
                                }
                            });
                            workspaces.save(workspace, {widgets: widgets})
                                .then(() => {
                                    scope.showGlobalSavedSearches = false;
                                    scope.onclose();
                                });
                        });
                } else if (scope.settings && scope.settings.desk) {
                    desks.save(scope.deskLookup[scope.settings.desk._id], {monitoring_settings: groups})
                        .then(() => {
                            WizardHandler.wizard('aggregatesettings').finish();
                        });
                } else {
                    workspaces.getActiveId()
                        .then((activeWorkspace) => {
                            if (activeWorkspace.type === 'workspace' || activeWorkspace.type === 'desk') {
                                preferencesService.get(PREFERENCES_KEY)
                                    .then((preferences) => {
                                        var updates = {};

                                        if (preferences) {
                                            updates[PREFERENCES_KEY] = preferences;
                                        }
                                        updates[PREFERENCES_KEY][activeWorkspace.id] = {groups: groups};
                                        preferencesService.update(updates, PREFERENCES_KEY)
                                            .then(() => {
                                                WizardHandler.wizard('aggregatesettings').finish();
                                            });
                                    });
                            }
                        });
                    scope.showGlobalSavedSearches = false;
                    scope.onclose();
                }
            };
        },
    };
}
