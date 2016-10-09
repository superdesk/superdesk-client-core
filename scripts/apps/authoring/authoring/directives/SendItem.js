SendItem.$inject = ['$q', 'api', 'desks', 'notify', 'authoringWorkspace',
    'superdeskFlags', '$location', 'macros', '$rootScope',
    'authoring', 'send', 'editor', 'confirm', 'archiveService',
    'preferencesService', 'multi', 'datetimeHelper', 'config', 'privileges', 'storage'];
export function SendItem($q, api, desks, notify, authoringWorkspace,
                  superdeskFlags, $location, macros, $rootScope,
                  authoring, send, editor, confirm, archiveService,
                  preferencesService, multi, datetimeHelper, config, privileges, storage) {
    return {
        scope: {
            item: '=',
            view: '=',
            orig: '=',
            _beforeSend: '&beforeSend',
            _editable: '=editable',
            _publish: '&publish',
            _action: '=action',
            mode: '@'
        },
        controller: function() {
            this.userActions = {send_to: 'send_to', publish: 'publish'};
        },
        controllerAs: 'vm',
        templateUrl: 'scripts/apps/authoring/views/send-item.html',
        link: function sendItemLink(scope, elem, attrs, ctrl) {
            scope.mode = scope.mode || 'authoring';
            scope.desks = null;
            scope.stages = null;
            scope.macros = null;
            scope.userDesks = null;
            scope.allDesks = null;
            scope.task = null;
            scope.selectedDesk = null;
            scope.selectedStage = null;
            scope.selectedMacro = null;
            scope.defaultDesk = null;
            scope.beforeSend = scope._beforeSend || $q.when;
            scope.destination_last = {send_to: null, publish: null};
            scope.origItem = angular.extend({}, scope.item);

            // key for the storing last desk/stage in the user preferences for send action.
            var PREFERENCE_KEY = 'destination:active';

            // key for the storing last user action (send to/publish) in the storage.
            var USER_ACTION_KEY = 'send_to_user_action';

            scope.$watch('item', activateItem);
            scope.$watch(send.getConfig, activateConfig);
            scope.$watch('selectedDesk', function(desk) {
                // set the default desk if publish panel is active.
                if (scope.currentUserAction === ctrl.userActions.publish && desk &&
                    scope.item && scope.item.task && desk._id === scope.item.task.desk) {
                    scope.defaultDesk = desk;
                } else {
                    scope.defaultDesk = null;
                }
            });

            scope.publish = function() {
                scope.loading = true;
                var result = scope._publish();
                return $q.resolve(result).then(null, e => $q.reject(false))
                    .finally(() => {
                        scope.loading = false;
                    });
            };

            function activateConfig(config, oldConfig) {
                if (config !== oldConfig) {
                    scope.isActive = !!config;
                    scope.item = scope.isActive ? {} : null;
                    scope.multiItems = multi.count ? multi.getItems() : null;
                    scope.config = config;
                    activate();
                }
            }

            function activateItem(item) {
                if (scope.mode === 'monitoring') {
                    superdeskFlags.flags.fetching = !!item;
                }

                scope.isActive = !!item;
                activate();
            }

            function activate() {
                if (scope.isActive) {
                    desks.initialize()
                        .then(fetchDesks)
                        .then(initialize)
                        .then(setDesksAndStages);
                }
            }

            scope.close = function() {
                if (scope.mode === 'monitoring') {
                    superdeskFlags.flags.fetching = false;
                }

                if (scope.$parent.views) {
                    scope.$parent.views.send = false;
                } else if (scope.item) {
                    scope.item = null;
                }

                $location.search('fetch', null);

                if (scope.config) {
                    scope.config.reject();
                }
            };

            scope.selectDesk = function(desk) {
                scope.selectedDesk = _.cloneDeep(desk);
                scope.selectedStage = null;
                fetchStages();
                fetchMacros();
            };

            scope.selectStage = function(stage) {
                scope.selectedStage = stage;
            };

            scope.selectMacro = function(macro) {
                if (scope.selectedMacro === macro) {
                    scope.selectedMacro = null;
                } else {
                    scope.selectedMacro = macro;
                }
            };

            scope.send = function(open) {
                return editor.countErrors()
                    .then(function(spellcheckErrors) {
                        if (scope.mode === 'authoring') {
                            return confirm.confirmSpellcheck(spellcheckErrors)
                                .then(runSend, err => false);
                        } else {
                            return runSend(open);
                        }
                    });
            };

            scope.$on('item:nextStage', function(_e, data) {
                if (scope.item && scope.item._id === data.itemId) {
                    var oldStage = scope.selectedStage;
                    scope.selectedStage = data.stage;

                    scope.send().then(function(sent) {
                        if (!sent) {
                            scope.selectedStage = oldStage;
                        }
                    });
                }
            });

            /*
             * Returns true if Destination field and Send button needs to be displayed, false otherwise.
             * @returns {Boolean}
             */
            scope.showSendButtonAndDestination = function() {
                if (scope.itemActions) {
                    var preCondition = (scope.mode === 'ingest' ||
                                        scope.mode === 'personal' ||
                                        scope.mode === 'monitoring' ||
                                        (scope.mode === 'authoring' &&
                                        scope.isSendEnabled() &&
                                        scope.itemActions.send) ||
                                        scope.mode === 'spike');

                    if (scope.currentUserAction === ctrl.userActions.publish) {
                        return preCondition && scope.showSendAndPublish();
                    }

                    return preCondition;
                }
            };

            /*
             * Returns true if Send and Send and Continue button needs to be disabled, false otherwise.
             * @returns {Boolean}
             */
            scope.disableSendButton = function() {
                if (scope.item && scope.item.task) {
                    return !scope.selectedDesk ||
                           (scope.mode !== 'ingest' && scope.selectedStage &&
                           scope.selectedStage._id === scope.item.task.stage);
                }
            };

            /*
             * Returns true if user is not a member of selected desk, false otherwise.
             * @returns {Boolean}
             */
            scope.disableFetchAndOpenButton = function() {
                var _isNonMember = _.isEmpty(_.find(desks.userDesks._items, {_id: scope.selectedDesk._id}));
                return _isNonMember;
            };

            /**
             * Returns true if Publish Schedule needs to be displayed, false otherwise.
             */
            scope.showPublishSchedule = function() {
                return scope.item && archiveService.getType(scope.item) !== 'ingest' &&
                    scope.item.type !== 'composite' && !scope.item.embargo_date && !scope.item.embargo_time &&
                    !authoring.isTakeItem(scope.item) &&
                    ['published', 'killed', 'corrected'].indexOf(scope.item.state) === -1;
            };

            /**
             * Returns true if timezone needs to be displayed, false otherwise.
             */
            scope.showTimezone = function() {
                return (scope.item.publish_schedule || scope.item.embargo) &&
                    (scope.showPublishSchedule() || scope.showEmbargo());
            };

            /**
             * Returns true if Embargo needs to be displayed, false otherwise.
             */
            scope.showEmbargo = function() {
                if (config.ui && config.ui.publishEmbargo === false) {
                    return false;
                }
                var prePublishCondition = scope.item && archiveService.getType(scope.item) !== 'ingest' &&
                    scope.item.type !== 'composite' && !scope.item.publish_schedule_date &&
                    !scope.item.publish_schedule_time && !authoring.isTakeItem(scope.item);

                if (prePublishCondition && authoring.isPublished(scope.item)) {
                    if (['published', 'corrected'].indexOf(scope.item.state) >= 0) {
                        return scope.origItem.embargo;
                    } else {
                        // for published states other than 'published', 'corrected'
                        return false;
                    }
                }

                return prePublishCondition;
            };

            /**
             * Returns true if Embargo needs to be displayed, false otherwise.
             */
            scope.isEmbargoEditable = function() {
                var publishedCondition = authoring.isPublished(scope.item) && scope.item.schedule_settings &&
                    scope.item.schedule_settings.utc_embargo &&
                    datetimeHelper.greaterThanUTC(scope.item.schedule_settings.utc_embargo);

                return scope.item && scope.item._editable &&
                    (!authoring.isPublished(scope.item) || publishedCondition);
            };

            /**
             * Send the content to different desk/stage
             * @param {Boolean} open - True to open the item.
             * @return {Object} promise
             */
            function runSend(open) {
                scope.loading = true;
                scope.item.sendTo = true;
                var deskId = scope.selectedDesk._id;
                var stageId = scope.selectedStage._id || scope.selectedDesk.incoming_stage;

                if (scope.mode === 'authoring') {
                    return sendAuthoring(deskId, stageId, scope.selectedMacro);
                } else if (scope.mode === 'archive') {
                    return sendContent(deskId, stageId, scope.selectedMacro, open);
                } else if (scope.config) {
                    // Remember last destination desk and stage
                    updateLastDestination(deskId, stageId, PREFERENCE_KEY);

                    scope.config.promise.finally(function() {
                        scope.loading = false;
                    });

                    return scope.config.resolve({
                        desk: deskId,
                        stage: stageId,
                        macro: scope.selectedMacro ? scope.selectedMacro.name : null,
                        open: open
                    });
                } else if (scope.mode === 'ingest') {
                    return sendIngest(deskId, stageId, scope.selectedMacro, open);
                }
            }

            /**
             * Enable Disable the Send and Publish button.
             * Send And Publish is enabled using `superdesk.config.js`.
             */
            scope.showSendAndPublish = () => !config.ui || angular.isUndefined(config.ui.sendAndPublish) ||
                                                config.ui.sendAndPublish;

            /**
             * Check if the Send and Publish is allowed or not.
             * Following conditions are to met for Send and Publish action
             * - Item is not Published i.e. not state Published, Corrected, Killed or Scheduled
             * - Selected destination (desk/stage) should be different from item current location (desk/stage)
             * - Mode should be authoring
             * - Publish Action is allowed on that item.
             * @return {Boolean}
             */
            scope.canSendAndPublish = function() {
                if (!scope.item) {
                    return false;
                }

                // Selected destination (desk/stage) should be different from item current location (desk/stage)
                var isDestinationChanged = (scope.selectedDesk && (scope.item.task.desk !== scope.selectedDesk._id) ||
                    scope.selectedStage && (scope.item.task.stage !== scope.selectedStage._id));

                return scope.showSendAndPublish() && !authoring.isPublished(scope.item) &&
                    isDestinationChanged && scope.mode === 'authoring' && scope.itemActions.publish;
            };

            /**
             * Check if the Send and Continue is allowed or not.
             * Send And Continue is enabled using `superdesk.config.js`.
             * @return {Boolean}
             */
            scope.canSendAndContinue = function() {
                if (config.ui && config.ui.publishSendAdnContinue === false) {
                    return false;
                }
                return !authoring.isPublished(scope.item) && _.includes(['text'], scope.item.type);
            };

            /**
             * Returns true if 'send' button should be displayed. Otherwise, returns false.
             * @return {boolean}
             */
            scope.isSendEnabled = () => scope.item && !authoring.isPublished(scope.item);

            /**
             * Send the current item (take) to different desk or stage and create a new take.
             * If publish_schedule is set then the user cannot schedule the take.
             * Fails if user has set Embargo on the item.
             */
            scope.sendAndContinue = function() {
                // cannot schedule takes.
                if (scope.item && scope.item.publish_schedule) {
                    notify.error(gettext('Takes cannot be scheduled.'));
                    return;
                }

                if (scope.item && scope.item.embargo) {
                    notify.error(gettext('Takes cannot have Embargo.'));
                    return;
                }

                return editor.countErrors()
                    .then(confirm.confirmSpellcheck)
                    .then(runSendAndContinue, err => false);
            };

            /*
             * Send the current item to different desk or stage and publish the item from new location.
             */
            scope.sendAndPublish = function() {
                return editor.countErrors()
                    .then(confirm.confirmSpellcheck)
                    .then(runSendAndPublish, err => false);
            };

            /*
             * Returns true if 'send' action is allowed, otherwise false
             * @returns {Boolean}
             */
            scope.canSendItem = function() {
                var itemType = [], typesList;
                if (scope.multiItems) {
                    angular.forEach(scope.multiItems, function(item) {
                        itemType[item._type] = 1;
                    });
                    typesList = Object.keys(itemType);
                    itemType = typesList.length === 1 ? typesList[0] : null;
                }

                return scope.mode === 'authoring' || itemType === 'archive' || scope.mode === 'spike';
            };

            /**
             * If the action is correct and kill then the publish privilege needs to be checked.
             */
            scope.canPublishItem = function() {
                if (!scope.itemActions) {
                    return false;
                }

                if (scope._action === 'edit') {
                    return scope.itemActions.publish;
                } else if (scope._action === 'correct') {
                    return privileges.privileges.publish && scope.itemActions.correct;
                } else if (scope._action === 'kill') {
                    return privileges.privileges.publish && scope.itemActions.kill;
                }
            };

            /**
             * Set the User Action.
             */
            scope.setUserAction = function(action) {
                if (scope.currentUserAction === action) {
                    return;
                }
                scope.currentUserAction = action;
                storage.setItem(USER_ACTION_KEY, action);
                setDesksAndStages();
            };

            /**
             * Send the current item to different desk or stage and then publish the item
             */
            function runSendAndPublish() {
                var deskId = scope.selectedDesk._id;
                var stageId = scope.selectedStage._id || scope.selectedDesk.incoming_stage;
                // send releases lock, increment version.
                return sendAuthoring(deskId, stageId, scope.selectedMacro, true)
                    .then(function(item) {
                        scope.loading = true;
                        // open the item for locking and publish
                        return authoring.open(scope.item._id, false);
                    })
                    .then(function(item) {
                        // update the original item to avoid 412 error.
                        scope.orig._etag = scope.item._etag = item._etag;
                        scope.orig._locked = scope.item._locked = item._locked;
                        scope.orig.task = scope.item.task = item.task;
                        // change the desk location.
                        $rootScope.$broadcast('desk_stage:change');
                        // if locked then publish
                        if (item._locked) {
                            return scope.publish();
                        } else {
                            return $q.reject();
                        }
                    })
                    .then(function(result) {
                        if (result) {
                            authoringWorkspace.close(false);
                        }
                    })
                    .catch(function(error) {
                        notify.error(gettext('Failed to send and publish.'));
                    })
                    .finally(function() {
                        scope.loading = false;
                    });
            }

            /**
             * Send the current item to different desk or stage and create a new take and open for editing.
             */
            function runSendAndContinue() {
                var deskId = scope.selectedDesk._id;
                var stageId = scope.selectedStage._id || scope.selectedDesk.incoming_stage;

                scope.item.sendTo = true;
                return sendAuthoring(deskId, stageId, scope.selectedMacro, true)
                    .then(function() {
                        var itemDeskId = null;
                        scope.loading = true;

                        if (scope.item.task && scope.item.task.desk) {
                            itemDeskId = scope.item.task.desk;
                        }
                        return authoring.linkItem(scope.item, null, itemDeskId);
                    })
                    .then(function(item) {
                        authoringWorkspace.close(false);
                        notify.success(gettext('New take created.'));
                        authoringWorkspace.edit(item);
                    })
                    .catch(function() {
                        scope.item.sendTo = false;
                        notify.error(gettext('Failed to send and continue.'));
                    })
                    .finally(function() {
                        scope.loading = false;
                    });
            }

            /**
             * Run the macro and returns to the modified item.
             * @param {Object} item
             * @param {String} macro
             * @return {Object} promise
             */
            function runMacro(item, macro) {
                if (macro) {
                    return macros.call(macro, item, true).then(function(res) {
                        return angular.extend(item, res);
                    });
                }

                return $q.when(item);
            }

            /**
             * Send to different location from authoring.
             * @param {String} deskId - selected desk Id
             * @param {String} stageId - selected stage Id
             * @param {String} macro - macro to apply
             * @param {Boolean} sendAndContinue - If "send and continue" or "send and publish"
             *                                    return deferred promise object
             * @return {Object} promise
             */
            function sendAuthoring(deskId, stageId, macro, sendAndContinue) {
                var deferred, msg;
                scope.loading = true;

                if (sendAndContinue) {
                    deferred = $q.defer();
                }

                return runMacro(scope.item, macro)
                .then(function(item) {
                    return api.find('tasks', scope.item._id)
                    .then(function(task) {
                        scope.task = task;
                        msg = sendAndContinue ? 'Send & Continue' : 'Send';
                        return scope.beforeSend({'action': msg});
                    })
                    .then(function(result) {
                        if (result && result._etag) {
                            scope.task._etag = result._etag;
                        }
                        return api.save('move', {}, {task: {desk: deskId, stage: stageId}}, scope.item);
                    })
                    .then(function(value) {
                        notify.success(gettext('Item sent.'));

                        if (scope.currentUserAction === ctrl.userActions.send_to) {
                            // Remember last destination desk and stage for send_to.
                            var last_destination = scope.destination_last[scope.currentUserAction];
                            if (!last_destination ||
                                (last_destination.desk !== deskId || last_destination.stage !== stageId)) {
                                updateLastDestination(deskId, stageId, PREFERENCE_KEY);
                            }
                        }

                        if (sendAndContinue) {
                            deferred.resolve();
                            return deferred.promise;
                        } else {
                            authoringWorkspace.close(true);
                            return true;
                        }
                    }, function(err) {
                        if (err) {
                            if (angular.isDefined(err.data._message)) {
                                notify.error(err.data._message);
                            } else {
                                if (angular.isDefined(err.data._issues['validator exception'])) {
                                    notify.error(err.data._issues['validator exception']);
                                }
                            }
                        }

                        if (sendAndContinue) {
                            deferred.reject(err);
                            return deferred.promise;
                        }
                    });
                }).finally(function() {
                    scope.loading = false;
                });
            }

            /**
             * Update the preferences to store last destinations
             * @param {String} deskId
             * @param {String} stageId
             * @param {String} key
             */
            function updateLastDestination(deskId, stageId, key) {
                var updates = {};
                updates[key] = {desk: deskId, stage: stageId};
                preferencesService.update(updates, key);
            }

            /**
             * Send content to different desk and stage
             * @param {String} deskId
             * @param {String} stageId
             * @param {String} macro
             * @param {Boolean} open - If true open the item.
             */
            function sendContent(deskId, stageId, macro, open) {
                var finalItem;
                scope.loading = true;

                return api.save('duplicate', {}, {desk: scope.item.task.desk}, scope.item)
                .then(function(item) {
                    return api.find('archive', item._id);
                })
                .then(function(item) {
                    return runMacro(item, macro);
                })
                .then(function(item) {
                    finalItem = item;
                    return api.find('tasks', item._id);
                })
                .then(function(_task) {
                    scope.task = _task;
                    api.save('tasks', scope.task, {
                        task: _.extend(scope.task.task, {desk: deskId, stage: stageId})
                    });
                })
                .then(function() {
                    notify.success(gettext('Item sent.'));
                    scope.close();
                    if (open) {
                        $location.url('/authoring/' + finalItem._id);
                    } else {
                        $rootScope.$broadcast('item:fetch');
                    }
                }).finally(function() {
                    scope.loading = false;
                });
            }

            /**
             * Fetch content from ingest to a different desk and stage
             * @param {String} deskId
             * @param {String} stageId
             * @param {String} macro
             * @param {Boolean} open - If true open the item.
             */
            function sendIngest(deskId, stageId, macro, open) {
                scope.loading = true;

                return send.oneAs(scope.item, {
                    desk: deskId,
                    stage: stageId,
                    macro: macro ? macro.name : macro
                }).then(function(finalItem) {
                    notify.success(gettext('Item fetched.'));
                    if (open) {
                        authoringWorkspace.edit(finalItem);
                    } else {
                        $rootScope.$broadcast('item:fetch');
                    }
                }).finally(function() {
                    scope.loading = false;
                });
            }

            /**
             * Fetch desk and last selected desk and stage for send_to and publish action
             * @return {Object} promise
             */
            function fetchDesks() {
                return desks.initialize()
                    .then(function() {
                        // get all desks
                        scope.allDesks = desks.desks;
                        // get user desks
                        return desks.fetchCurrentUserDesks();
                    })
                    .then(function(desk_list) {
                        scope.userDesks = desk_list;
                        return preferencesService.get(PREFERENCE_KEY);
                    })
                    .then(function(result) {
                        if (result) {
                            scope.destination_last.send_to = {
                                desk: result.desk,
                                stage: result.stage
                            };
                        }
                    });
            }

            /**
             * Set the last selected desk based on the user action.
             * To be called after currentUserAction is set
             */
            function setDesksAndStages() {
                if (!scope.currentUserAction) {
                    return;
                }
                // set the desks for desk filter
                if (scope.currentUserAction === ctrl.userActions.publish) {
                    scope.desks = scope.userDesks;
                } else {
                    scope.desks = scope.allDesks;
                }

                if (scope.mode === 'ingest') {
                    scope.selectDesk(desks.getCurrentDesk());
                } else {
                    // set the last selected desk or current desk
                    var itemDesk = desks.getItemDesk(scope.item);
                    var last_destination = scope.destination_last[scope.currentUserAction];
                    if (itemDesk) {
                        if (last_destination && last_destination.desk != null) {
                            scope.selectDesk(desks.deskLookup[last_destination.desk]);
                        } else {
                            scope.selectDesk(itemDesk);
                        }
                    } else {
                        if (last_destination && last_destination.desk != null) {
                            scope.selectDesk(desks.deskLookup[last_destination.desk]);
                        } else {
                            scope.selectDesk(desks.getCurrentDesk());
                        }
                    }
                }
            }

            /**
             * Set stages and last selected stage.
             */
            function fetchStages() {
                if (!scope.selectedDesk) {
                    return;
                }

                scope.stages = desks.deskStages[scope.selectedDesk._id];
                var stage = null;

                if (scope.currentUserAction === ctrl.userActions.send_to) {
                    var last_destination = scope.destination_last[scope.currentUserAction];

                    if (last_destination) {
                        stage = _.find(scope.stages, {_id: last_destination.stage});
                    } else {
                        if (scope.item.task && scope.item.task.stage) {
                            stage = _.find(scope.stages, {_id: scope.item.task.stage});
                        }
                    }
                }

                if (!stage) {
                    stage = _.find(scope.stages, {_id: scope.selectedDesk.incoming_stage});
                }

                scope.selectedStage = stage;
            }

            /**
             * Fetch macros for the selected desk.
             */
            function fetchMacros() {
                if (!scope.selectedDesk) {
                    return;
                }
                macros.getByDesk(scope.selectedDesk.name)
                .then(function(_macros) {
                    scope.macros = _macros;
                });
            }

            /**
             * Initialize Item Actios and User Actions.
             */
            function initialize() {
                initializeItemActions();
                initializeUserAction();
            }

            /**
             * Initialize User Action
             */
            function initializeUserAction() {
                // default user action
                scope.currentUserAction = storage.getItem(USER_ACTION_KEY) || ctrl.userActions.send_to;
                if (scope.orig || scope.item) {
                    // if the last action is send to but item is published open publish tab.
                    if (scope.currentUserAction === ctrl.userActions.send_to &&
                        scope.canPublishItem() && !scope.isSendEnabled()) {
                        scope.currentUserAction = ctrl.userActions.publish;
                    } else if (scope.currentUserAction === ctrl.userActions.publish &&
                        !scope.canPublishItem() && scope.showSendButtonAndDestination()) {
                        scope.currentUserAction = ctrl.userActions.send_to;
                    }
                }
            }

            /**
             * The itemActions defined in parent scope (Authoring Directive) is made accessible via this method.
             * scope.$parent isn't used as send-item directive is used in multiple places and has different
             * hierarchy.
             */
            function initializeItemActions() {
                if (scope.orig || scope.item) {
                    scope.itemActions = authoring.itemActions(scope.orig || scope.item);
                }
            }

            // update actions on item save
            scope.$watch('orig._current_version', initializeItemActions);
        }
    };
}
