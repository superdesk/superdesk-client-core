SendItem.$inject = ['$q', 'api', 'desks', 'notify', 'authoringWorkspace',
    'superdeskFlags', '$location', 'macros', '$rootScope',
    'authoring', 'send', 'editor', 'confirm', 'archiveService',
    'preferencesService', 'multi', 'datetimeHelper', 'config', 'privileges'];
export function SendItem($q, api, desks, notify, authoringWorkspace,
                  superdeskFlags, $location, macros, $rootScope,
                  authoring, send, editor, confirm, archiveService,
                  preferencesService, multi, datetimeHelper, config, privileges) {
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
        templateUrl: 'scripts/superdesk-authoring/views/send-item.html',
        link: function sendItemLink(scope, elem, attrs) {
            scope.mode = scope.mode || 'authoring';
            scope.desks = null;
            scope.stages = null;
            scope.macros = null;
            scope.task = null;
            scope.selectedDesk = null;
            scope.selectedStage = null;
            scope.selectedMacro = null;
            scope.beforeSend = scope._beforeSend || $q.when;
            scope.destination_last = null;
            scope.origItem = angular.extend({}, scope.item);

            var PREFERENCE_KEY = 'destination:active';

            scope.$watch('item', activateItem);
            scope.$watch(send.getConfig, activateConfig);

            scope.publish = function() {
                scope.loading = true;
                var result = scope._publish();
                $q.resolve(result).then(function(r) {
                    scope.loading = false;
                }, function(e) {
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
                        .then(fetchStages)
                        .then(fetchMacros)
                        .then(initializeItemActions);
                }
            }

            scope.getLastDestination = function() {
                return preferencesService.get(PREFERENCE_KEY).then(function(prefs) {
                    return prefs;
                });
            };

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

            scope.send = function (open) {
                return editor.countErrors()
                    .then(function(spellcheckErrors) {
                        if (scope.mode === 'authoring' && spellcheckErrors > 0) {
                            return confirm.confirmSpellcheck(spellcheckErrors)
                                    .then(angular.bind(this, function send() {
                                        return runSend(open);
                                    }), function (err) { // cancel
                                        return false;
                                    });
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
            scope.showSendButtonAndDestination = function () {
                if (scope.itemActions) {
                    return scope.mode === 'ingest' ||
                            scope.mode === 'personal' ||
                            scope.mode === 'monitoring' ||
                            (scope.mode === 'authoring' && scope.isSendEnabled() && scope.itemActions.send) ||
                            scope.mode === 'spike';
                }
            };

            /*
             * Returns true if Send and Send and Continue button needs to be disabled, false otherwise.
             * @returns {Boolean}
             */
            scope.disableSendButton = function () {
                if (scope.item && scope.item.task) {
                    return !scope.selectedDesk ||
                            (scope.mode !== 'ingest' && scope.selectedStage && scope.selectedStage._id === scope.item.task.stage);
                }
            };

            /*
             * Returns true if user is not a member of selected desk, false otherwise.
             * @returns {Boolean}
             */
            scope.disableFetchAndOpenButton = function () {
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
                    updateLastDestination(deskId, stageId);

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
            scope.isSendEnabled = function() {
                return !authoring.isPublished(scope.item);
            };

            /**
             * Send the current item (take) to different desk or stage and create a new take.
             * If publish_schedule is set then the user cannot schedule the take.
             * Fails if user has set Embargo on the item.
             */
            scope.sendAndContinue = function () {
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
                    .then(function(spellcheckErrors) {
                        if (spellcheckErrors > 0) {
                            confirm.confirmSpellcheck(spellcheckErrors)
                                .then(angular.bind(this, function send() {
                                    return runSendAndContinue();
                                }), function (err) { // cancel
                                    return false;
                                });
                        } else {
                            return runSendAndContinue();
                        }
                    });
            };

            /*
             * Returns true if 'send' action is allowed, otherwise false
             * @returns {Boolean}
             */
            scope.canSendItem = function () {
                var itemType = [], typesList;
                if (scope.multiItems) {
                    angular.forEach(scope.multiItems, function (item) {
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
                    .then(function (item) {
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

            function runMacro(item, macro) {
                if (macro) {
                    return macros.call(macro, item, true).then(function(res) {
                        return angular.extend(item, res);
                    });
                }

                return $q.when(item);
            }

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

                        // Remember last destination desk and stage
                        if (scope.destination_last &&
                                (scope.destination_last.desk !== deskId && scope.destination_last.stage !== stageId)) {
                            updateLastDestination(deskId, stageId);
                        } else {
                            updateLastDestination(deskId, stageId);
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

            function updateLastDestination(deskId, stageId) {
                var updates = {};
                updates[PREFERENCE_KEY] = {desk: deskId, stage: stageId};
                preferencesService.update(updates, PREFERENCE_KEY);
            }

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

            function fetchDesks() {
                var p = desks.initialize()
                .then(function() {
                    scope.desks = desks.desks;
                });

                scope.getLastDestination().then(function(result) {
                    if (result) {
                        scope.destination_last = {
                            desk: result.desk,
                            stage: result.stage
                        };
                    }

                    if (scope.mode === 'ingest') {
                        p = p.then(function() {
                            scope.selectDesk(desks.getCurrentDesk());
                        });
                    } else {
                        p = p.then(function() {
                            var itemDesk = desks.getItemDesk(scope.item);
                            if (itemDesk) {
                                if (scope.destination_last && scope.destination_last.desk != null) {
                                    scope.selectDesk(desks.deskLookup[scope.destination_last.desk]);
                                } else {
                                    scope.selectDesk(itemDesk);
                                }
                            } else {
                                if (scope.destination_last && scope.destination_last.desk != null) {
                                    scope.selectDesk(desks.deskLookup[scope.destination_last.desk]);
                                } else {
                                    scope.selectDesk(desks.getCurrentDesk());
                                }
                            }
                        });
                    }
                });

                return p;

            }

            function fetchStages() {
                if (scope.selectedDesk) {
                    scope.stages = desks.deskStages[scope.selectedDesk._id];

                    var stage = null;

                    if (scope.destination_last) {
                        stage = _.find(scope.stages, {_id: scope.destination_last.stage});
                    } else {
                        if (scope.item.task && scope.item.task.stage) {
                            stage = _.find(scope.stages, {_id: scope.item.task.stage});
                        }
                    }

                    if (!stage) {
                        stage = _.find(scope.stages, {_id: scope.selectedDesk.incoming_stage});
                    }

                    scope.selectedStage = stage;
                }
            }

            function fetchMacros() {
                if (scope.selectedDesk != null) {
                    macros.getByDesk(scope.selectedDesk.name)
                    .then(function(_macros) {
                        scope.macros = _macros;
                    });
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
