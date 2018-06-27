import _ from 'lodash';
import React from 'react';
import {Modal} from '../../../../core/ui/components/Modal/Modal';
import {ModalHeader} from '../../../../core/ui/components/Modal/ModalHeader';
import {ModalBody} from '../../../../core/ui/components/Modal/ModalBody';
import {ModalFooter} from '../../../../core/ui/components/Modal/ModalFooter';


SendItem.$inject = ['$q', 'api', 'desks', 'notify', 'authoringWorkspace',
    'superdeskFlags', '$location', 'macros', '$rootScope', 'deployConfig',
    'authoring', 'send', 'editorResolver', 'confirm', 'archiveService',
    'preferencesService', 'multi', 'datetimeHelper', 'config', 'privileges', 'storage', 'modal', 'gettext'];
export function SendItem($q, api, desks, notify, authoringWorkspace,
    superdeskFlags, $location, macros, $rootScope, deployConfig,
    authoring, send, editorResolver, confirm, archiveService,
    preferencesService, multi, datetimeHelper, config, privileges, storage, modal, gettext) {
    return {
        scope: {
            item: '=',
            view: '=',
            orig: '=',
            _beforeSend: '&beforeSend',
            _editable: '=editable',
            _publish: '&publish',
            _action: '=action',
            mode: '@',
        },
        controller: function() {
            this.userActions = {
                send_to: 'send_to',
                publish: 'publish',
                duplicate_to: 'duplicate_to',
                externalsource_to: 'externalsource_to',
            };
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
            scope.beforeSend = scope._beforeSend || $q.when;
            scope.destination_last = {send_to: null, publish: null, duplicate_to: null};
            scope.origItem = angular.extend({}, scope.item);
            scope.subscribersWithPreviewConfigured = [];

            // key for the storing last desk/stage in the user preferences for send action.
            var PREFERENCE_KEY = 'destination:active';

            // key for the storing last user action (send to/publish) in the storage.
            var USER_ACTION_KEY = 'send_to_user_action';

            scope.$watch('item', activateItem);
            scope.$watch(send.getConfig, activateConfig);

            scope.publish = function() {
                scope.loading = true;
                var result = scope._publish();

                return $q
                    .resolve(result)
                    .then(null, (e) => $q.reject(false))
                    .finally(() => {
                        scope.loading = false;
                    });
            };

            function activateConfig(config, oldConfig) {
                if (scope.mode !== 'authoring' && config !== oldConfig) {
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
                    api.query('subscribers')
                        .then((res) => {
                            const allSubscribers = res['_items'];

                            scope.subscribersWithPreviewConfigured = allSubscribers
                                .map(
                                    (subscriber) => {
                                        subscriber.destinations = subscriber.destinations.filter(
                                            (destination) => typeof destination.preview_endpoint_url === 'string'
                                                && destination.preview_endpoint_url.length > 0
                                        );

                                        return subscriber;
                                    }
                                )
                                .filter((subscriber) => subscriber.destinations.length > 0);
                        });
                    desks
                        .initialize()
                        .then(fetchDesks)
                        .then(initialize)
                        .then(setDesksAndStages);
                }
            }

            scope.preview = function() {
                modal.createCustomModal()
                    .then(({openModal, closeModal}) => {
                        openModal(
                            <Modal>
                                <ModalHeader>{gettext('Select preview target')}</ModalHeader>
                                <ModalBody>
                                    <ul>
                                        {
                                            scope.subscribersWithPreviewConfigured.map((subscriber, i) => (
                                                <li key={i}>
                                                    <strong>{subscriber.name}</strong>
                                                    <ul>
                                                        {
                                                            subscriber.destinations.map((destination, j) => (
                                                                <li key={j} style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    margin: '4px 0',
                                                                }}>
                                                                    <span>{destination.name}</span>
                                                                    <button
                                                                        className="btn btn--primary btn--small"
                                                                        onClick={() => {
                                                                            console.log('fff');
                                                                        }}
                                                                    >
                                                                        {gettext('preview')}
                                                                    </button>
                                                                </li>
                                                            ))
                                                        }
                                                    </ul>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </ModalBody>
                                <ModalFooter>
                                    <button className="btn" onClick={closeModal}>{gettext('Cancel')}</button>
                                </ModalFooter>
                            </Modal>
                        );
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

            scope.send = function(open) {
                updateLastDestination();
                return runSend(open);
            };

            scope.$on('item:nextStage', (_e, data) => {
                if (scope.item && scope.item._id === data.itemId) {
                    var oldStage = scope.selectedStage;

                    scope.selectedStage = data.stage;

                    scope.send().then((sent) => {
                        if (!sent) {
                            scope.selectedStage = oldStage;
                        }
                    });
                }
            });

            // events on which panel should close
            var closePanelEvents = ['item:spike', 'broadcast:preview'];

            angular.forEach(closePanelEvents, (event) => {
                scope.$on(event, shouldClosePanel);
            });

            /**
             * @description Closes the opened 'duplicate/send To' panel if the same item getting
             * spiked or any item is opening for authoring.
             * @param {Object} event
             * @param {Object} data - contains the item(=itemId) that was spiked or {item: null} when
             * any item opened for authoring (utilising, 'broadcast:preview' with {item: null})
             */
            function shouldClosePanel(event, data) {
                if (scope.config && _.includes(scope.config.itemIds, data.item) || _.isNil(data.item)) {
                    scope.close();
                }
            }

            /*
             * Returns true if Destination field and Send button needs to be displayed, false otherwise.
             * @returns {Boolean}
             */
            scope.showSendButtonAndDestination = function() {
                if (scope.itemActions) {
                    var preCondition = scope.mode === 'ingest' ||
                                        scope.mode === 'personal' ||
                                        scope.mode === 'monitoring' ||
                                        scope.mode === 'authoring' &&
                                        scope.isSendEnabled() &&
                                        scope.itemActions.send ||
                                        scope.mode === 'spike';

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
                return !scope.selectedDesk ||
                        scope.mode !== 'ingest' && scope.selectedStage && scope.mode !== 'spike' &&
                        (_.get(scope, 'item.task.stage') === scope.selectedStage._id ||
                        _.includes(_.map(scope.multiItems, 'task.stage'), scope.selectedStage._id));
            };

            /*
             * Returns true if user is not a member of selected desk, false otherwise.
             * @returns {Boolean}
             */
            scope.disableFetchAndOpenButton = function() {
                if (scope.selectedDesk) {
                    var _isNonMember = _.isEmpty(_.find(desks.userDesks, {_id: scope.selectedDesk._id}));

                    return _isNonMember;
                }
            };

            /**
             * Returns true if Publish Schedule needs to be displayed, false otherwise.
             */
            scope.showPublishSchedule = function() {
                return scope.item && archiveService.getType(scope.item) !== 'ingest' &&
                    scope.item.type !== 'composite' && !scope.item.embargo_date && !scope.item.embargo_time &&
                    ['published', 'killed', 'corrected', 'recalled'].indexOf(scope.item.state) === -1 &&
                    canPublishOnDesk();
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
                // If user doesn't have embargo privilege then don't display embargo fields
                if (!privileges.privileges.embargo) {
                    return false;
                }
                if (config.ui && config.ui.publishEmbargo === false) {
                    return false;
                }
                var prePublishCondition = scope.item && archiveService.getType(scope.item) !== 'ingest' &&
                    scope.item.type !== 'composite' && !scope.item.publish_schedule_date &&
                    !scope.item.publish_schedule_time;

                if (prePublishCondition && authoring.isPublished(scope.item)) {
                    if (['published', 'corrected'].indexOf(scope.item.state) >= 0) {
                        return scope.origItem.embargo;
                    }

                    // for published states other than 'published', 'corrected'
                    return false;
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
                    scope.config.promise.finally(() => {
                        scope.loading = false;
                    });

                    return scope.config.resolve({
                        desk: deskId,
                        stage: stageId,
                        macro: scope.selectedMacro ? scope.selectedMacro.name : null,
                        open: open,
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
                if (scope.mode !== 'authoring' || !scope.item) {
                    return false;
                }

                // Selected destination desk should be different from item current location desk
                var isDestinationChanged = scope.selectedDesk && scope.item.task.desk !== scope.selectedDesk._id;

                return scope.showSendAndPublish() && !authoring.isPublished(scope.item) &&
                    isDestinationChanged && scope.mode === 'authoring' && scope.itemActions.publish;
            };

            /**
             * Returns true if 'send' button should be displayed. Otherwise, returns false.
             * @return {boolean}
             */
            scope.isSendEnabled = () => scope.item && !authoring.isPublished(scope.item);

            /*
             * Send the current item to different desk or stage and publish the item from new location.
             */
            scope.sendAndPublish = function() {
                return runSendAndPublish();
            };

            /*
             * Returns true if 'send' action is allowed, otherwise false
             * @returns {Boolean}
             */
            scope.canSendItem = function() {
                var itemType = [], typesList;

                if (scope.multiItems) {
                    angular.forEach(scope.multiItems, (item) => {
                        itemType[item._type] = 1;
                    });
                    typesList = Object.keys(itemType);
                    itemType = typesList.length === 1 ? typesList[0] : null;
                }

                return scope.mode === 'authoring' || itemType === 'archive' || scope.mode === 'spike';
            };

            /**
             * Check if it is allowed to publish on current desk
             * @returns {Boolean}
             */
            function canPublishOnDesk() {
                return !(isAuthoringDesk() && config.features.noPublishOnAuthoringDesk);
            }

            /**
             * If the action is correct and kill then the publish privilege needs to be checked.
             */
            scope.canPublishItem = function() {
                if (!scope.itemActions || !canPublishOnDesk()) {
                    return false;
                }

                if (scope._action === 'edit') {
                    return scope.item ? !scope.item.flags.marked_for_not_publication && scope.itemActions.publish :
                        scope.itemActions.publish;
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
             * Checks if a given item is valid to publish
             *
             * @param {Object} item story to be validated
             * @return {Object} promise
             */
            const validatePublish = (item) => api.save('validate', {act: 'publish', type: item.type, validate: item});

            /**
             * Sends and publishes the current item in scope
             * First checks if the item is dirty and pops up save dialog if needed
             * Then checks if the story is valid to publish before sending
             * Then sends the story to the destination
             * Then publishes it
             *
             * @param {Object} item story to be validated
             * @return {Object} promise
             */
            const runSendAndPublish = () => {
                var deskId = scope.selectedDesk._id;
                var stageId = scope.selectedStage._id || scope.selectedDesk.incoming_stage;

                // send releases lock, increment version.
                return scope.beforeSend({action: 'Send and Publish'})
                    .then(() => validatePublish(scope.item)
                        .then((validationResult) => {
                            if (_.get(validationResult, 'errors.length')) {
                                for (var i = 0; i < validationResult.errors.length; i++) {
                                    notify.error('\'' + _.trim(validationResult.errors[i]) + '\'');
                                }
                                return $q.reject();
                            }

                            return sendAuthoring(deskId, stageId, scope.selectedMacro, true)
                                .then((item) => {
                                    scope.loading = true;
                                    // open the item for locking and publish
                                    return authoring.open(scope.item._id, false);
                                })
                                .then((item) => {
                                    // update the original item to avoid 412 error.
                                    scope.orig._etag = scope.item._etag = item._etag;
                                    scope.orig._locked = scope.item._locked = item._locked;
                                    scope.orig.task = scope.item.task = item.task;
                                    // change the desk location.
                                    $rootScope.$broadcast('desk_stage:change');
                                    // if locked then publish
                                    if (item._locked) {
                                        return scope.publish();
                                    }

                                    return $q.reject();
                                })
                                .then((result) => {
                                    if (result) {
                                        authoringWorkspace.close(false);
                                    }
                                })
                                .catch((error) => {
                                    notify.error(gettext('Failed to send and publish.'));
                                });
                        })
                        .finally(() => {
                            scope.loading = false;
                        })
                    );
            };

            /**
             * Run the macro and returns to the modified item.
             * @param {Object} item
             * @param {String} macro
             * @return {Object} promise
             */
            function runMacro(item, macro) {
                if (macro) {
                    return macros.call(macro, item, true).then((res) => angular.extend(item, res));
                }

                return $q.when(item);
            }

            /**
             * Send to different location from authoring.
             * @param {String} deskId - selected desk Id
             * @param {String} stageId - selected stage Id
             * @param {String} macro - macro to apply
             * @return {Object} promise
             */
            function sendAuthoring(deskId, stageId, macro) {
                var msg;

                scope.loading = true;

                return runMacro(scope.item, macro)
                    .then((item) => api.find('tasks', scope.item._id)
                        .then((task) => {
                            scope.task = task;
                            msg = 'Send';
                            return scope.beforeSend({action: msg});
                        })
                        .then((result) => {
                            if (result && result._etag) {
                                scope.task._etag = result._etag;
                            }
                            return api.save('move', {}, {task: {desk: deskId, stage: stageId}}, scope.item);
                        })
                        .then((value) => {
                            notify.success(gettext('Item sent.'));

                            if (scope.currentUserAction === ctrl.userActions.send_to) {
                            // Remember last destination desk and stage for send_to.
                                var lastDestination = scope.destination_last[scope.currentUserAction];

                                if (!lastDestination ||
                                (lastDestination.desk !== deskId || lastDestination.stage !== stageId)) {
                                    updateLastDestination();
                                }
                            }

                            authoringWorkspace.close(true);
                            return true;
                        }, (err) => {
                            if (err) {
                                if (angular.isDefined(err.data._message)) {
                                    notify.error(err.data._message);
                                } else if (angular.isDefined(err.data._issues['validator exception'])) {
                                    notify.error(err.data._issues['validator exception']);
                                }
                            }
                        }))
                    .finally(() => {
                        scope.loading = false;
                    });
            }

            /**
             * Update the preferences to store last destinations
             * @param {String} key
             */
            function updateLastDestination() {
                var updates = {};
                var deskId = scope.selectedDesk._id;
                var stageId = scope.selectedStage._id || scope.selectedDesk.incoming_stage;

                updates[PREFERENCE_KEY] = {desk: deskId, stage: stageId};
                preferencesService.update(updates, PREFERENCE_KEY);
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
                    .then((item) => api.find('archive', item._id))
                    .then((item) => runMacro(item, macro))
                    .then((item) => {
                        finalItem = item;
                        return api.find('tasks', item._id);
                    })
                    .then((_task) => {
                        scope.task = _task;
                        api.save('tasks', scope.task, {
                            task: _.extend(scope.task.task, {desk: deskId, stage: stageId}),
                        });
                    })
                    .then(() => {
                        notify.success(gettext('Item sent.'));
                        scope.close();
                        if (open) {
                            $location.url('/authoring/' + finalItem._id);
                        } else {
                            $rootScope.$broadcast('item:fetch');
                        }
                    })
                    .finally(() => {
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
                    macro: macro ? macro.name : macro,
                }).then((finalItem) => {
                    notify.success(gettext('Item fetched.'));
                    if (open) {
                        authoringWorkspace.edit(finalItem);
                    } else {
                        $rootScope.$broadcast('item:fetch');
                    }
                })
                    .finally(() => {
                        scope.loading = false;
                    });
            }

            /**
             * Fetch desk and last selected desk and stage for send_to and publish action
             * @return {Object} promise
             */
            function fetchDesks() {
                return desks.initialize()
                    .then(() => {
                        // get all desks
                        scope.allDesks = desks.desks._items;
                        // get user desks
                        return desks.fetchCurrentUserDesks();
                    })
                    .then((deskList) => {
                        scope.userDesks = deskList;
                        return preferencesService.get(PREFERENCE_KEY);
                    })
                    .then((result) => {
                        if (result) {
                            scope.destination_last.send_to = {
                                desk: result.desk,
                                stage: result.stage,
                            };

                            scope.destination_last.duplicate_to = {
                                desk: result.desk,
                                stage: result.stage,
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
                    var lastDestination = scope.destination_last[scope.currentUserAction];

                    if (itemDesk) {
                        if (lastDestination && !_.isNil(lastDestination.desk)) {
                            scope.selectDesk(desks.deskLookup[lastDestination.desk]);
                        } else {
                            scope.selectDesk(itemDesk);
                        }
                    } else if (lastDestination && !_.isNil(lastDestination.desk)) {
                        scope.selectDesk(desks.deskLookup[lastDestination.desk]);
                    } else {
                        scope.selectDesk(desks.getCurrentDesk());
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

                if (scope.currentUserAction === ctrl.userActions.send_to ||
                    scope.currentUserAction === ctrl.userActions.duplicate_to) {
                    var lastDestination = scope.destination_last[scope.currentUserAction];

                    if (lastDestination) {
                        stage = _.find(scope.stages, {_id: lastDestination.stage});
                    } else if (scope.item.task && scope.item.task.stage) {
                        stage = _.find(scope.stages, {_id: scope.item.task.stage});
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
                    .then((_macros) => {
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
                    if (scope.config && scope.config.action === 'externalsourceTo') {
                        scope.currentUserAction = ctrl.userActions.externalsource_to;
                    }
                    // if the last action is send to but item is published open publish tab.
                    if (scope.config && scope.config.action === 'duplicateTo') {
                        scope.currentUserAction = ctrl.userActions.duplicate_to;
                    }
                    if (scope.currentUserAction === ctrl.userActions.send_to &&
                        scope.canPublishItem() && !scope.isSendEnabled()) {
                        scope.currentUserAction = ctrl.userActions.publish;
                    } else if (scope.currentUserAction === ctrl.userActions.publish &&
                        !scope.canPublishItem() && scope.showSendButtonAndDestination()) {
                        scope.currentUserAction = ctrl.userActions.send_to;
                    } else if (scope.currentUserAction === ctrl.userActions.publish &&
                        isAuthoringDesk() && noPublishOnAuthoringDesk()) {
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

            /**
             * Test if desk of current item is authoring type.
             *
             * @return {Boolean}
             */
            function isAuthoringDesk() {
                const desk = desks.getItemDesk(scope.item);

                return desk && desk.desk_type === 'authoring';
            }

            /**
             * Test if noPublishOnAuthoringDesk config is active.
             *
             * @return {Boolean}
             */
            function noPublishOnAuthoringDesk() {
                return config.features.noPublishOnAuthoringDesk;
            }

            // update actions on item save
            scope.$watch('orig._current_version', initializeItemActions);
        },
    };
}
