import {sdApi} from 'api';
import {appConfig} from 'appConfig';
import {ITEM_STATE} from 'apps/archive/constants';
import {isPublished} from 'apps/archive/utils';
import {authoringApiCommon} from 'apps/authoring-bridge/authoring-api-common';
import * as helpers from 'apps/authoring/authoring/helpers';
import {previewItems} from 'apps/authoring/preview/fullPreviewMultiple';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {isMediaType} from 'core/helpers/item';
import {copyJson} from 'core/helpers/utils';
import {addInternalEventListener} from 'core/internal-events';
import {applyMiddleware as coreApplyMiddleware} from 'core/middleware';
import {logger} from 'core/services/logger';
import {gettext} from 'core/utils';
import _, {merge} from 'lodash';
import postscribe from 'postscribe';
import {applyMiddleware, combineReducers, createStore} from 'redux';
import thunk from 'redux-thunk';
import {getArticleSchemaMiddleware} from '..';
import {validateMediaFieldsThrows} from '../controllers/ChangeImageController';
import {AuthoringWorkspaceService} from '../services/AuthoringWorkspaceService';
import {InitializeMedia} from '../services/InitializeMediaService';
import {IArticle, IAuthoringActionType} from 'superdesk-api';
import {confirmPublish} from '../services/quick-publish-modal';
import {IPanelError} from 'core/interactive-article-actions-panel/interfaces';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdAuthoring
 *
 * @description
 *   This directive is responsible for generating superdesk content authoring form.
 */

AuthoringDirective.$inject = [
    'superdesk',
    'authoringWorkspace',
    'notify',
    'desks',
    'authoring',
    'api',
    'session',
    'lock',
    'privileges',
    'content',
    '$location',
    'referrer',
    'macros',
    '$q',
    'modal',
    'archiveService',
    'confirm',
    'reloadService',
    '$rootScope',
    'suggest',
    'editorResolver',
    'compareVersions',
    'embedService',
    '$injector',
    'autosave',
    'storage',
];
export function AuthoringDirective(
    superdesk,
    authoringWorkspace: AuthoringWorkspaceService,
    notify,
    desks,
    authoring,
    api,
    session,
    lock,
    privileges,
    content,
    $location,
    referrer,
    macros,
    $q,
    modal,
    archiveService,
    confirm,
    reloadService,
    $rootScope,
    suggest,
    editorResolver,
    compareVersions,
    embedService,
    $injector,
    autosave,
    storage,
) {
    return {
        link: function($scope, elem, attrs) {
            $scope.loading = false;
            $scope.tabsPinned = false;

            var _closing;
            var mediaFields = {};
            var userDesks;

            const UNIQUE_NAME_ERROR = gettext('Error: Unique Name is not unique.');
            const MEDIA_TYPES = ['video', 'picture', 'audio'];
            const isPersonalSpace = $location.path() === '/workspace/personal';

            $scope.toDeskEnabled = false; // Send an Item to a desk
            $scope.closeAndContinueEnabled = false; // Create an update of an item and Close the item.
            $scope.publishEnabled = false; // publish an item
            $scope.publishAndContinueEnabled = false; // Publish an item and Create an update.

            desks.fetchCurrentUserDesks().then((desksList) => {
                userDesks = desksList;
                $scope.itemActions = authoring.itemActions($scope.origItem, userDesks);
            });

            $scope.privileges = privileges.privileges;
            $scope.dirty = false;
            $scope.views = {send: false};
            $scope.stage = null;
            $scope._editable = !!$scope.origItem._editable;
            $scope.isMediaType = isMediaType($scope.origItem);
            $scope.action = $scope.action || ($scope._editable ? 'edit' : 'view');

            $scope.highlight = !!$scope.origItem.highlight;
            $scope.showExportButton = sdApi.highlights.showHighlightExportButton($scope.origItem);
            $scope.openSuggestions = () => suggest.setActive();
            $scope.openCompareVersions = (item) => compareVersions.init(item);
            $scope.isValidEmbed = {};
            $scope.embedPreviews = {};
            $scope.mediaFieldVersions = {};
            $scope.refreshTrigger = 0;
            $scope.isPreview = false;
            $scope.isCorrectionInProgress = false;

            $scope.$watch('origItem', (newValue, oldValue) => {
                $scope.itemActions = null;
                if (newValue) {
                    $scope.itemActions = authoring.itemActions(newValue, userDesks);
                }
            }, true);

            $scope.$watch('item.flags', (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    $scope.item.flags = _.clone($scope.origItem.flags);
                    $scope.item.flags = newValue;
                    $scope.origItem.flags = oldValue;
                    $scope.dirty = true;
                }
            }, true);

            $scope._isInProductionStates = !isPublished($scope.origItem);

            $scope.proofread = false;
            $scope.referrerUrl = referrer.getReferrerUrl();
            $scope.gettext = gettext;

            content.getTypes().then((result) => {
                $scope.content_types = result;
            });

            /**
             * Get the Desk and Stage for the item.
             */
            function getDeskStage() {
                if ($scope.origItem.task && $scope.origItem.task.stage) {
                    if (archiveService.isLegal($scope.origItem)) {
                        $scope.deskName = $scope.origItem.task.desk;
                        $scope.stage = $scope.origItem.task.stage;
                    } else {
                        // gets the  whole stage object by Id
                        api('stages')
                            .getById($scope.origItem.task.stage)
                            .then((result) => {
                                $scope.stage = result;
                            });

                        setDesk();
                    }
                }
            }

            /**
             * Get the Current Template for the item.
            */
            function getCurrentTemplate() {
                const item: IArticle | null = $scope.item;

                if (item.type === 'composite') {
                    $scope.currentTemplate = {};
                } else {
                    if (typeof item?.template !== 'string') {
                        logger.error(new Error('template must be present'));
                        $scope.currentTemplate = {};
                        return;
                    }

                    api('content_templates').getById(item.template)
                        .then((result) => {
                            $scope.currentTemplate = result;
                        });
                }
            }

            /**
            * Get the desk name and desk type.
            */
            function setDesk() {
                if (!$scope.item.task.desk) {
                    return false;
                }
                const desk = desks.getItemDesk($scope.item);

                if (desk) {
                    $scope.deskName = desk.name;
                    $scope.deskType = desk.desk_type;
                }
            }

            desks.initialize().then(() => {
                getDeskStage();
                getCurrentTemplate();
                $scope.$watch('item', () => {
                    $scope.toDeskEnabled = appConfig.features?.customAuthoringTopbar?.toDesk
                        && !sdApi.navigation.isPersonalSpace()
                        && authoringApiCommon.checkShortcutButtonAvailability($scope.item, $scope.dirty);

                    $scope.closeAndContinueEnabled = sdApi.article.showCloseAndContinue($scope.item, $scope.dirty);

                    $scope.publishEnabled = appConfig.features?.customAuthoringTopbar?.publish
                        && sdApi.article.canPublishOnDesk($scope.deskType)
                        && authoringApiCommon.checkShortcutButtonAvailability(
                            $scope.item,
                            false,
                            sdApi.navigation.isPersonalSpace(),
                        );

                    $scope.publishAndContinue = sdApi.article.showPublishAndContinue($scope.item, $scope.dirty);
                }, true);
            });

            /**
             * `desk_stage:change` event from send and publish action.
             * If send action succeeds but publish fails then we need change item location.
             */
            $scope.$on('desk_stage:change', getDeskStage);

            /**
             * Start editing current item
             */

            $scope.edit = function edit() {
                if ($scope.origItem.state === 'unpublished') {
                    api.update('archive', $scope.origItem, {state: 'in_progress'})
                        .then((updated) => {
                            // for updating and refreshing the item everywhere,
                            // close it first and then open it.
                            $scope.close().then(() => {
                                authoringWorkspace.edit(updated);
                            });
                        });
                } else if (isPublished($scope.origItem)) {
                    authoringWorkspace.view($scope.origItem);
                } else {
                    authoringWorkspace.edit($scope.origItem);
                }
            };

            /**
             * Create a new version
             */
            $scope.save = function() {
                return authoring.save($scope.origItem, $scope.item).then((res) => {
                    $scope.dirty = false;
                    _.merge($scope.item, res);

                    if (res.highlight) {
                        _previewHighlight(res._id);
                    }

                    notify.success(gettext('Item updated.'));

                    InitializeMedia.initMedia($scope);

                    return $scope.origItem;
                }, (response) => {
                    if (response.status === 412) {
                        notifyPreconditionFailed();
                        return;
                    }

                    if (angular.isDefined(response.data._issues)) {
                        if (angular.isDefined(response.data._issues.unique_name) &&
                            response.data._issues.unique_name.unique === 1) {
                            notify.error(UNIQUE_NAME_ERROR);
                            return;
                        } else if (angular.isDefined(response.data._issues['validator exception'])) {
                            notify.error(gettext('Error: {{message}}',
                                {message: response.data._issues['validator exception']}));
                            return;
                        }
                    }

                    notify.error(gettext('Error. Item not updated.'));
                });
            };

            $scope.openFullPreview = function($event) {
                if ($event.button === 0 && !$event.ctrlKey) {
                    $event.preventDefault();
                    previewItems([$scope.item]);
                }
            };

            /**
             * Export the list of highlights as a text item.
             */
            $scope.exportHighlight = function(item) {
                sdApi.highlights.exportHighlight(item._id, $scope.save_enabled());
            };

            function _previewHighlight(_id) {
                sdApi.highlights.prepareHighlightForPreview(_id).then((res) => {
                    $scope.highlight_preview = res;
                }).catch((err) => {
                    $scope.highlight_preview = err;
                });
            }

            if ($scope.origItem.highlight) {
                _previewHighlight($scope.origItem._id);
            }

            /**
             * Invoked by validatePublishScheduleAndEmbargo() to validate the date and time values.
             *
             * @return {string} if the values are invalid then returns appropriate error message.
             *         Otherwise empty string.
             */
            function validateTimestamp(datePartOfTS, timePartOfTS, timestamp, timezone, fieldName) {
                var errors = authoring.validateSchedule(
                    datePartOfTS,
                    timePartOfTS,
                    timestamp,
                    timezone,
                    fieldName,
                );

                if (!errors) {
                    return;
                }

                if (errors.date) {
                    return gettext('{{field}} date is required!', {field: fieldName});
                }

                if (errors.time) {
                    return gettext('{{field}} time is required!', {field: fieldName});
                }

                if (errors.timestamp) {
                    return gettext('{{field}} is not a valid date!', {field: fieldName});
                }

                if (errors.future && fieldName !== 'Embargo' || $scope._isInProductionStates) {
                    return gettext('{{field}} cannot be earlier than now!', {field: fieldName});
                }
            }

            /**
             * Validates the Embargo Date and Time and Publish Schedule Date and Time if they are set on the item.
             *
             * @return {boolean} true if valid, false otherwise.
             */
            function validatePublishScheduleAndEmbargo(item) {
                if (item.embargo && item.publish_schedule) {
                    notify.error(gettext('An Item can\'t have both Embargo and Publish Schedule.'));
                    return false;
                }

                var errorMessage;

                if (item.embargo_date || item.embargo_time) {
                    errorMessage = validateTimestamp(
                        item.embargo_date, item.embargo_time, item.embargo,
                        item.schedule_settings ? item.schedule_settings.time_zone : null,
                        gettext('Embargo'));
                }

                if (item.publish_schedule_date || item.publish_schedule_time) {
                    if (isPublished(item, false)) {
                        return true;
                    }

                    errorMessage = validateTimestamp(
                        item.publish_schedule_date, item.publish_schedule_time,
                        item.publish_schedule, item.schedule_settings ? item.schedule_settings.time_zone : null,
                        gettext('Publish Schedule'));
                }

                if (errorMessage) {
                    notify.error(errorMessage);
                    return false;
                }

                return true;
            }

            $scope.onError = (error: IPanelError) => {
                $scope.error = {};
                Object.assign($scope.error, error.fields);
                $scope.$applyAsync();
            };

            function publishItem(orig, item): Promise<boolean> {
                autosave.stop(item);
                const action: IAuthoringActionType = $scope.action != null
                    ? ($scope.action === 'edit' ? 'publish' : $scope.action)
                    : 'publish';

                return sdApi.article.publishItem_legacy(orig, item, $scope, action);
            }

            function notifyPreconditionFailed() {
                notify.error(gettext('Item has changed since it was opened. ' +
                    'Please close and reopen the item to continue. ' +
                    'Regrettably, your changes cannot be saved.'));
                $scope._editable = false;
                $scope.dirty = false;
            }

            let getLabelForFieldId = (id) => id;

            getLabelNameResolver().then((_getLabelForFieldId) => {
                getLabelForFieldId = _getLabelForFieldId;
            });

            function validateForPublish(item) {
                var validator = appConfig.validator_media_metadata;

                if (item.type === 'picture' || item.type === 'graphic') {
                    // required media metadata fields are defined in superdesk.config.js
                    try {
                        validateMediaFieldsThrows(validator, item, $scope.schema, getLabelForFieldId);
                    } catch (e) {
                        notify.error(e);
                        return false;
                    }
                }

                return true;
            }

            $scope.hideLiveSuggestions = function() {
                return $rootScope.config.features && $rootScope.config.features.hideLiveSuggestions;
            };

            $scope.openExport = function() {
                return authoring.close($scope.item, $scope.origItem, $scope.save_enabled(), true).then(() => {
                    $scope.export = true;
                });
            };

            $scope.canExport = function() {
                return $scope.privileges.content_export ? $scope.item.lock_user === session.identity._id &&
                    $scope.itemActions.export : false;
            };

            $scope.closeExport = function() {
                $scope.export = false;
            };

            $scope.useTansaProofing = function() {
                return $rootScope.config.features && $rootScope.config.features.useTansaProofing;
            };

            var deregisterTansa = $rootScope.$on('tansa:end', afterTansa);

            $scope.runTansa = function() {
                if (window.RunTansaProofing && appConfig.tansa != null) {
                    const _editor = editorResolver.get();

                    if (_editor && _editor.version() === '3') {
                        $('#editor3Tansa').html(_editor.getHtmlForTansa());
                    }

                    const profiles = appConfig.tansa.profiles || {};

                    if (profiles[$scope.item.language] != null) {
                        window.tansa.settings.profileId = profiles[$scope.item.language];
                    }

                    (function workAroundTansaSpellcheckerSelectionBug() {
                        /**
                         * The issue was that Tansa spell-checker would only check a single field, even if no input
                         * field was focused at the time of initializing the spell-checker.
                         *
                         * If spell-checking was cancelled, that field would receive focus.
                         *
                         * If the page was reloaded, or an article reopened - all fields were spell-checked as expected.
                         *
                         * The issue was only happening if an expanded text selection was made in input[type="text"]
                         * field at **any point** prior to initializing the spell-checker.
                         * Such a selection is made every time when focusing a
                         * non-empty input[type="text"] field using a tab key.
                         * Even if other text fields received focus after that,
                         * it would only spell-check the single field,
                         * that last had an expanded text selection performed on it.
                         *
                         * I assume Tansa spell-checker has a feature to only spell-check a selected part of the text
                         * and their JavaScript code has a bug where it can't differentiate between text that
                         * was intentionally selected for spell-checking from text that was selected long before
                         * initializing the spell-checker, even after multiple other input fields received focus.
                         */

                        Array.from(document.querySelectorAll('input[type="text"]')).forEach((el: HTMLInputElement) => {
                            // Making sure there are no expanded selections.
                            if (el !== document.activeElement) {
                                el.setSelectionRange(0, 0);
                            }
                        });
                    })();

                    window.RunTansaProofing();
                } else {
                    notify.error(gettext('Tansa is not responding. You can continue editing or publish the story.'));
                }
            };

            $scope.isRemovedField = function(fieldName) {
                return appConfig.infoRemovedFields != null && appConfig.infoRemovedFields.hasOwnProperty(fieldName);
            };

            function afterTansa(e, isCancelled) {
                const _editor = editorResolver.get();

                if (_editor && _editor.version() === '3' && !isCancelled) {
                    _editor.setHtmlFromTansa($('#editor3Tansa').html());
                }
            }

            /**
             * Depending on the item state one of the publish, correct, kill actions will be executed on the item
             * in $scope.
             */
            $scope.publish = function() {
                if (helpers.itemHasUnresolvedSuggestions($scope.item)) {
                    modal.alert({
                        headerText: gettext('Resolving suggestions'),
                        bodyText: gettext(
                            'Article cannot be published. Please accept or reject all suggestions first.',
                        ),
                    });

                    return Promise.reject();
                }

                if (helpers.itemHasUnresolvedComments($scope.item)) {
                    modal.confirm({
                        bodyText: gettext(
                            'This article contains unresolved comments.'
                            + 'Click on Cancel to go back to editing to'
                            + 'resolve those comments or OK to ignore and proceed with publishing',
                        ),
                        headerText: gettext('Resolving comments'),
                        okText: gettext('Ok'),
                        cancelText: gettext('Cancel'),
                    }).then((ok) => ok ? performPublish() : false);

                    return Promise.reject();
                }

                return performPublish();
            };

            function performPublish() {
                if (validatePublishScheduleAndEmbargo($scope.item) && validateForPublish($scope.item)) {
                    var message = 'publish';

                    if ($scope.action && $scope.action !== 'edit') {
                        message = $scope.action;
                    } else if ($scope.action === 'edit' && $scope.item.state === ITEM_STATE.CORRECTION) {
                        $scope.action = 'correct';
                    }

                    if ($scope.dirty && message === 'publish') {
                        // confirmation only required for publish
                        return authoring.publishConfirmation($scope.origItem, $scope.item, $scope.dirty, message)
                            .then((res) => {
                                if (res) {
                                    return publishItem($scope.origItem, $scope.item);
                                }
                            }, (response) => {
                                notify.error(gettext('Error. Item not published.'));
                                return $q.reject(false);
                            });
                    }

                    return publishItem($scope.origItem, $scope.item);
                }

                return false;
            }

            $scope.showCustomButtons = () => {
                return $scope.toDeskEnabled || $scope.closeAndContinueEnabled
                    || $scope.publishAndContinueEnabled || $scope.publishEnabled;
            };

            $scope.saveAndContinue = function(customButtonAction, showConfirm) {
                if ($scope.dirty) {
                    showConfirm ?
                        $scope.saveTopbar()
                            .then(() => confirmPublish([$scope.item]))
                            .then(customButtonAction) :
                        $scope.saveTopbar()
                            .then(customButtonAction);
                } else {
                    showConfirm ?
                        confirmPublish([$scope.item]).then(customButtonAction) :
                        customButtonAction();
                }
                InitializeMedia.initMedia($scope);
            };

            $scope.publishAndContinue = function() {
                $scope.publish(true).then((published: boolean) => {
                    if (published) {
                        authoring.rewrite($scope.item);
                    }
                }, (err) => {
                    notify.error(gettext('Failed to publish and continue.'));
                });
                InitializeMedia.initMedia($scope);
            };

            // Close the current article, create an update of the article and open it in the edit mode.
            $scope.closeAndContinue = function() {
                $scope.close().then(() => {
                    sdApi.article.rewrite($scope.item);
                });
            };

            $scope.deschedule = function() {
                $scope.item.publish_schedule = null;
                return $scope.save();
            };

            /**
             * Close an item - unlock
             */
            $scope.close = function() {
                _closing = true;

                // returned promise used by superdesk-fi
                return authoringApiCommon.closeAuthoringStep2($scope, $rootScope);
            };

            /**
             * Cancel an action, i.e. go back to view mode.
             * This is used in the 'EDIT AND CORRECT' and 'EDIT AND KILL' actions.
             * When the user clicks on the 'CANCEL' button it takes them back to the view action on the item
             */
            $scope.cancel = function() {
                authoringWorkspace.view($scope.origItem);
            };

            /*
             * Minimize an item
             */
            $scope.minimize = function() {
                authoringWorkspace.close(true);
            };

            /**
             * Called by the sendItem directive before send.
             * If the $scope is dirty then upon confirmation save the item and then unlock the item.
             * If the $scope is not dirty then unlock the item.
             * @param {String} action - action to display in confirmation dialog
             * @return {Object} promise
             */
            $scope.beforeSend = function(action) {
                $scope.sending = true;
                if ($scope.dirty) {
                    return confirm.confirmSendTo(action)
                        .then(() => $scope.save().then(() => lock.unlock($scope.origItem)), () => // cancel
                            $q.reject());
                }

                return lock.unlock($scope.origItem)
                    .catch(() => $scope.origItem); // ignore failed unlock
            };

            $scope.handleUnsavedChangesReact = (items: Array<IArticle>) => {
                return $scope.beforeSend().then(() => {
                    return [$scope.origItem];
                });
            };

            /**
             * Preview different version of an item
             */
            $scope.preview = function(version) {
                helpers.forcedExtend($scope.item, version);
                $scope.refreshTrigger++;
                $scope.isPreview = true;
                $scope._editable = false;
            };

            /**
             * Revert item to given version
             */
            $scope.revert = function(version) {
                $scope.isPreview = false;
                helpers.forcedExtend($scope.item, version);

                /**
                 * Before restoring, a version can be previewed in read only mode.
                 * For this to work, `_editable` is set to false.
                 * It has to be set back to true so the story is editable after reverting.
                 */
                $scope._editable = true;

                $scope.refreshTrigger++;
                if ($scope.item.annotations == null) {
                    $scope.item.annotations = [];
                }
                return $scope.save();
            };

            /**
             * Close preview and start working again
             */
            $scope.closePreview = function() {
                $scope.item = copyJson($scope.origItem);
                $scope._editable = $scope.action !== 'view' && authoring.isEditable($scope.origItem);

                if ($scope.isPreview) {
                    $scope.isPreview = false;
                    $scope.refreshTrigger++;
                }

                // populate content fields so that it can undo to initial (empty) version later
                var _autosave = $scope.origItem._autosave || {};

                Object.keys(helpers.CONTENT_FIELDS_DEFAULTS).forEach((key) => {
                    var value = _autosave[key] || $scope.origItem[key] || helpers.CONTENT_FIELDS_DEFAULTS[key];

                    $scope.item[key] = angular.copy(value);
                });
            };

            /**
             * Checks if the item can be unlocked or not.
             */
            $scope.can_unlock = function() {
                return !$scope.item.sendTo && lock.can_unlock($scope.item);
            };

            $scope.save_enabled = function() {
                confirm.dirty = $scope.dirty;

                return ($scope.dirty || $scope.item._autosave != null) &&
                    _.reduce($scope.isValidEmbed, (agg, val) => agg && val, true);
            };

            $scope.previewFormattedEnabled = function() {
                return !!_.get($rootScope.config, 'features.previewFormats');
            };

            // call the function to unlock and lock the story for editing.
            $scope.unlock = function() {
                $scope.unlockClicked = true;
                lock.unlock($scope.item).then((unlockedItem) => {
                    $scope.edit(unlockedItem);
                });
            };

            $scope.openAction = function(action) {
                if (action === 'correct') {
                    if (appConfig?.corrections_workflow &&
                    [ITEM_STATE.PUBLISHED, ITEM_STATE.CORRECTED].includes($scope.item.state)) {
                        $scope.isCorrectionInProgress = true;
                        authoring.correction($scope.item, () => $scope.isCorrectionInProgress = false);
                    } else {
                        authoringWorkspace.correct($scope.item);
                    }
                } else if (action === 'kill') {
                    authoringWorkspace.kill($scope.item);
                } else if (action === 'takedown') {
                    authoringWorkspace.takedown($scope.item);
                } else if (action === 'rewrite') {
                    authoring.rewrite($scope.item);
                } else if (action === 'unpublish') {
                    authoring.unpublish($scope.item);
                }
            };

            $scope.isLocked = function() {
                return lock.isLocked($scope.item);
            };

            $scope.isLockedByMe = function() {
                return lock.isLockedByMe($scope.item);
            };

            /**
             * On changing the content profile add the new (key, default-value) to the item
             * if new content profile has some additional keys than item
             *
             * @function changeProfile
             * @param {Object} item - item being edited currently
             */
            $scope.changeProfile = function(item) {
                angular.forEach($scope.content_types, (profile) => {
                    if (item.profile === profile._id && profile.schema) {
                        angular.forEach(profile.schema, (schema, key) => {
                            if (schema && schema.default && !(key in item)) {
                                item[key] = _.cloneDeep(schema.default);
                            }
                        });
                    }
                });

                $scope.autosave(item);
            };

            $scope.firstLineConfig = appConfig?.ui?.authoring?.firstLine ?? {};

            // default to true
            $scope.firstLineConfig.wordCount = $scope.firstLineConfig.wordCount ?? true;

            $scope.autosave = function(item, timeout) {
                $scope.dirty = true;
                angular.extend($scope.item, item); // make sure all changes are available

                return authoring.autosave(
                    $scope.item,
                    $scope.origItem,
                    timeout,
                ).then(
                    () => {
                        $scope.$applyAsync(() => {
                            authoringWorkspace.addAutosave();
                            InitializeMedia.initMedia($scope);
                            updateSchema();
                        });
                    },
                );
            };

            $scope.sendToNextStage = function() {
                sdApi.article.sendItemToNextStage($scope.item).then(() => {
                    $scope.$applyAsync();
                    $scope.close();
                });
            };

            // Returns true if the given text is an URL
            $scope.isURL = (text) =>
                _.startsWith(_.lowerCase(_.trim(text)), 'http');

            // Shows the preview for the given embed field.
            $scope.previewEmbed = (fieldId) => {
                if ($scope.item.extra[fieldId].embed) {
                    $scope.embedPreviews[fieldId] = true;
                    postscribe('#embed-preview-' + fieldId, $scope.item.extra[fieldId].embed);
                }
            };

            // Hides the preview for the given embed field.
            $scope.hideEmbedPreview = (fieldId) => {
                document.getElementById('embed-preview-' + fieldId).innerHTML = null;
                $scope.embedPreviews[fieldId] = false;
            };

            // Returns true if the preview for the given embed field was on.
            $scope.isPreviewOn = (fieldId) =>
                !!$scope.embedPreviews && !!$scope.embedPreviews[fieldId];

            // Validates the given embed field
            function validateEmbed(fieldId) {
                if (_.get($scope.item, `extra.${fieldId}.embed`)) {
                    $scope.isValidEmbed[fieldId] = !$scope.isURL($scope.item.extra[fieldId].embed);
                } else {
                    $scope.isValidEmbed[fieldId] = true;
                }
            }

            // Validates the given embed field, hides the preview and calls autosave if the embed was valid
            $scope.validateEmbed = (fieldId) => {
                $scope.hideEmbedPreview(fieldId);

                validateEmbed(fieldId);
                if ($scope.isValidEmbed[fieldId]) {
                    $scope.autosave($scope.item);
                }
            };

            // Retrieves the embed script for a given URL.
            $scope.processEmbed = (fieldId) => {
                if (_.startsWith($scope.item.extra[fieldId].embed, 'http')) {
                    embedService.get($scope.item.extra[fieldId].embed).then((data) => {
                        $scope.item.extra[fieldId].embed = data.html;
                        $scope.isValidEmbed[fieldId] = true;
                        $scope.autosave($scope.item);
                    });
                }
            };

            // Clear the current embed value.
            $scope.clearEmbed = (fieldId) => {
                $scope.item.extra[fieldId].embed = '';
                $scope.validateEmbed(fieldId);
            };

            function refreshItem() {
                authoring.open($scope.item._id, true)
                    .then((item) => {
                        $scope.origItem = item;
                        $scope.dirty = false;
                        $scope.closePreview();
                        $scope.item._editable = $scope._editable;
                        InitializeMedia.initMedia($scope);
                    });
            }

            $scope.$on('savework', (e, msg) => {
                var changeMsg = msg;

                authoring.saveWorkConfirmation($scope.origItem, $scope.item, $scope.dirty, changeMsg)
                    .then((res) => {
                        // after saving work make sure this item won't be open again
                        desks.setCurrentDeskId(null);
                        $location.search('item', null);
                        $location.search('action', null);
                    })
                    .finally(reloadService.forceReload);
            });

            $scope.$on('item:lock', (_e, data) => {
                if ($scope.item._id === data.item
                    && !_closing
                    && session.sessionId !== data.lock_session
                ) {
                    const {
                        user,
                        lock_time,
                        lock_session,
                    } = data;

                    authoring.lock($scope.item, {user, lock_time, lock_session});
                }
            });

            $scope.$on('item:unlock', (_e, data) => {
                if (
                    $scope.item._id === data.item
                    && !_closing
                    && (session.sessionId !== data.lock_session || lock.previewUnlock)
                ) {
                    if (lock.previewUnlock) {
                        $scope.edit($scope.item);
                        lock.previewUnlock = false;
                    } else {
                        authoring.unlock($scope.item, data.user);
                        $scope._editable = $scope.item._editable = false;
                        $scope.origItem._locked = $scope.item._locked = false;
                        $scope.origItem.lock_session = $scope.item.lock_session = null;
                        $scope.origItem.lock_user = $scope.item.lock_user = null;

                        if (data.state && data.state !== $scope.item.state) {
                            $scope.item.state = data.state;
                            $scope.origItem.state = data.state;
                        }

                        // Re-mount authoring view when item is locked by someone else
                        // in order to clean up old UI elements
                        $scope.loading = true;

                        setTimeout(() => {
                            $scope.loading = false;
                            $scope.$apply();
                        });
                    }
                }
            });

            $scope.$on('content:update', (_e, data) => {
                if (!$scope._editable && data.items && data.items[$scope.origItem._id]) {
                    refreshItem();
                }
            });

            $scope.$on('item:publish:wrong:format', (_e, data) => {
                if (data.item === $scope.item._id) {
                    notify.error(gettext(
                        'No formatters found for {{formats}} while publishing item having unique name.',
                        {formats: data.formats.join(','), name: data.unique_name},
                    ));
                }
            });

            const removeListener = addInternalEventListener(
                'dangerouslyOverwriteAuthoringData',
                (event) => {
                    if (event.detail._id === $scope.item._id) {
                        angular.extend($scope.item, event.detail);
                        angular.extend($scope.origItem, event.detail);
                        $scope.$apply();
                        $scope.refresh();
                    }
                },
            );

            $scope.$on('$destroy', () => {
                deregisterTansa();
                removeListener();
            });

            var initEmbedFieldsValidation = () => {
                $scope.isValidEmbed = {};
                content.getTypes().then((result) => {
                    // Update scope with new content types
                    $scope.content_types = result;

                    _.forEach($scope.content_types, (profile) => {
                        if ($scope.item.profile === profile._id && profile.schema) {
                            _.forEach(profile.schema, (schema, fieldId) => {
                                if (schema && schema.type === 'embed') {
                                    validateEmbed(fieldId);
                                }
                            });
                        }
                    });
                });
            };

            // init
            $scope.content = content;
            $scope.closePreview();
            macros.setupShortcuts($scope);
            initEmbedFieldsValidation();

            // init redux
            const initialState = {
                editable: !!$scope.origItem._editable,
                isLocked: $scope.isLocked(),
                isLockedByMe: $scope.isLockedByMe(),
            };

            function editor(state = initialState) {
                return state;
            }

            const reducer = combineReducers({editor});

            $scope.store = createStore(reducer, applyMiddleware(thunk.withExtraArgument({
                $scope: $scope,
                $window: $injector.get('$window'),
                urls: $injector.get('urls'),
                notify: notify,
                superdesk: superdesk,
            })));

            $scope.$watch('item.profile', (profile) => {
                content.setupAuthoring(profile, $scope, $scope.item)
                    .then((contentType) => {
                        $scope.contentType = contentType;
                        authoring.schema = $scope.schema;
                        authoring.editor = $scope.editor;
                        InitializeMedia.initMedia($scope);
                    })
                    .then(updateSchema);
            });

            const updateSchema = () => {
                const schema = merge({}, authoring.schema); // always start from initial schema

                coreApplyMiddleware(getArticleSchemaMiddleware, {item: $scope.item, schema: schema}, 'schema')
                    .then((_schema) => {
                        $scope.schema = _schema;
                    });
            };

            $scope.refresh = () => $scope.refreshTrigger++;
        },
    };
}
