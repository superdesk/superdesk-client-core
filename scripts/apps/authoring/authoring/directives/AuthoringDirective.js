import * as helpers from 'apps/authoring/authoring/helpers';
import _ from 'lodash';
import postscribe from 'postscribe';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdAuthoring
 *
 * @requires superdesk
 * @requires superdeskFlags
 * @requires authoringWorkspace
 * @requires notify
 * @requires gettext
 * @requires desks
 * @requires authoring
 * @requires api
 * @requires session
 * @requires lock
 * @requires privileges
 * @requires content
 * @requires $location
 * @requires referrer
 * @requires macros
 * @requires $timeout
 * @requires $q
 * @requires modal
 * @requires archiveService
 * @requires confirm
 * @requires reloadService
 * @requires $rootScope
 * @requires $interpolate
 * @requires metadata
 * @requires suggest
 * @requires config
 * @requires deployConfig
 * @requires editorResolver
 * @requires $sce
 * @requires mediaIdGenerator
 *
 * @description
 *   This directive is responsible for generating superdesk content authoring form.
 */

AuthoringDirective.$inject = [
    'superdesk',
    'superdeskFlags',
    'authoringWorkspace',
    'notify',
    'gettext',
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
    '$timeout',
    '$q',
    'modal',
    'archiveService',
    'confirm',
    'reloadService',
    '$rootScope',
    '$interpolate',
    'metadata',
    'suggest',
    'config',
    'deployConfig',
    'editorResolver',
    'compareVersions',
    'embedService',
    '$sce',
    'mediaIdGenerator',
    'relationsService',
];
export function AuthoringDirective(superdesk, superdeskFlags, authoringWorkspace, notify,
    gettext, desks, authoring, api, session, lock, privileges, content, $location,
    referrer, macros, $timeout, $q, modal, archiveService, confirm, reloadService,
    $rootScope, $interpolate, metadata, suggest, config, deployConfig, editorResolver,
    compareVersions, embedService, $sce, mediaIdGenerator, relationsService) {
    return {
        link: function($scope, elem, attrs) {
            var _closing;
            var mediaFields = {};

            const UNIQUE_NAME_ERROR = gettext('Error: Unique Name is not unique.');
            const MEDIA_TYPES = ['video', 'picture', 'audio'];

            $scope.privileges = privileges.privileges;
            $scope.dirty = false;
            $scope.views = {send: false};
            $scope.stage = null;
            $scope._editable = !!$scope.origItem._editable;
            $scope.isMediaType = _.includes(['audio', 'video', 'picture', 'graphic'], $scope.origItem.type);
            $scope.action = $scope.action || ($scope._editable ? 'edit' : 'view');
            $scope.itemActions = authoring.itemActions($scope.origItem);
            $scope.highlight = !!$scope.origItem.highlight;
            $scope.showExportButton = $scope.highlight && $scope.origItem.type === 'composite';
            $scope.openSuggestions = () => suggest.setActive();
            $scope.openCompareVersions = (item) => compareVersions.init(item);
            $scope.isValidEmbed = {};
            $scope.embedPreviews = {};
            $scope.mediaFieldVersions = {};
            $scope.refreshTrigger = 0;
            $scope.isPreview = false;

            $scope.$watch('origItem', (newValue, oldValue) => {
                $scope.itemActions = null;
                if (newValue) {
                    $scope.itemActions = authoring.itemActions(newValue);
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

            $scope.$watch('item.profile', (profile) => {
                if (profile) {
                    content.getType(profile)
                        .then((type) => {
                            $scope.contentType = type;
                            $scope.fields = content.fields(type);
                            initMedia();
                        });
                } else {
                    $scope.contentType = null;
                    $scope.fields = null;
                }
            });

            $scope._isInProductionStates = !authoring.isPublished($scope.origItem);

            $scope.fullPreview = false;
            $scope.fullPreviewUrl = '/#/preview/' + $scope.origItem._id;
            $scope.proofread = false;
            $scope.referrerUrl = referrer.getReferrerUrl();

            content.getTypes().then(() => {
                $scope.content_types = content.types;
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
                        api('stages').getById($scope.origItem.task.stage)
                            .then((result) => {
                                $scope.stage = result;
                            });

                        desks.fetchDeskById($scope.origItem.task.desk).then((desk) => {
                            $scope.deskName = desk.name;
                            $scope.deskType = desk.desk_type;
                        });
                    }
                }
            }

            /**
             * Check if it is allowed to publish on desk
             * @returns {Boolean}
             */
            $scope.canPublishOnDesk = function() {
                return !($scope.deskType === 'authoring' && config.features.noPublishOnAuthoringDesk);
            };

            getDeskStage();
            /**
             * `desk_stage:change` event from send and publish action.
             * If send action succeeds but publish fails then we need change item location.
             */
            $scope.$on('desk_stage:change', getDeskStage);

            /**
             * Start editing current item
             */
            $scope.edit = function edit() {
                if (archiveService.isPublished($scope.origItem)) {
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

                    if (res.cropData) {
                        $scope.item.hasCrops = true;
                    }

                    if (res.highlight) {
                        _previewHighlight(res._id);
                    }

                    // clonedeep associations so that diff can be calculated for saving next time.
                    if (res.associations) {
                        $scope.item.associations = _.cloneDeep(res.associations);
                    }

                    notify.success(gettext('Item updated.'));

                    initMedia();
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
                            notify.error(gettext('Error: ' + response.data._issues['validator exception']));
                            return;
                        }
                    }

                    notify.error(gettext('Error. Item not updated.'));
                });
            };

            $scope.openFullPreview = function($event) {
                if ($event.button === 0 && !$event.ctrlKey) {
                    $event.preventDefault();
                    $scope.fullPreview = true;
                }
            };

            $scope.closeFullPreview = function() {
                $scope.fullPreview = false;
            };

            /**
             * Export the list of highlights as a text item.
             */
            $scope.exportHighlight = function(item) {
                if ($scope.save_enabled()) {
                    modal.confirm(gettext('You have unsaved changes, do you want to continue?'))
                        .then(() => {
                            _exportHighlight(item._id);
                        }
                        );
                } else {
                    _exportHighlight(item._id);
                }
            };

            $scope.canSaveTemplate = function() {
                return privileges.userHasPrivileges({content_templates: 1});
            };

            function _exportHighlight(_id) {
                api.generate_highlights.save({}, {package: _id})
                    .then(authoringWorkspace.edit, (response) => {
                        if (response.status === 403) {
                            _forceExportHighlight(_id);
                        } else {
                            notify.error(gettext('Error creating highlight.'));
                        }
                    });
            }

            function _forceExportHighlight(_id) {
                modal.confirm(gettext('There are items locked or not published. Do you want to continue?'))
                    .then(() => {
                        api.generate_highlights.save({}, {package: _id, export: true})
                            .then(authoringWorkspace.edit, (response) => {
                                notify.error(gettext('Error creating highlight.'));
                            });
                    });
            }

            function _previewHighlight(_id) {
                api.generate_highlights.save({}, {package: _id, preview: true})
                    .then((response) => {
                        $scope.highlight_preview = response.body_html;
                    }, (data) => {
                        $scope.highlight_preview = data.message;
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
                    fieldName
                );

                if (!errors) {
                    return;
                }

                function fieldErr(err) {
                    return $interpolate(err)({field: fieldName});
                }

                if (errors.date) {
                    return fieldErr(gettext('{{ field }} date is required!'));
                }

                if (errors.time) {
                    return fieldErr(gettext('{{ field }} time is required!'));
                }

                if (errors.timestamp) {
                    return fieldErr(gettext('{{ field }} is not a valid date!'));
                }

                if (errors.future && fieldName !== 'Embargo' || $scope._isInProductionStates) {
                    return fieldErr(gettext('{{ field }} cannot be earlier than now!'));
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
                    if (_.includes(['published', 'killed', 'corrected', 'recalled'], item.state)) {
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

            /**
             * Checks if associations is with rewrite_of item then open then modal to add associations.
             * The user has options to add associated media to the current item and review the media change
             * or publish the current item without media.
             * User will be prompted in following scenarios:
             * 1. Edit feature image and confirm media update is enabled.
             * 2. Once item is published then no confirmation.
             * 3. If current item is update and updated story has associations
             */
            function checkMediaAssociatedToUpdate() {
                let rewriteOf = $scope.item.rewrite_of;

                if (!_.get(config, 'features.confirmMediaOnUpdate') ||
                    !_.get(config, 'features.editFeaturedImage') ||
                    !rewriteOf || _.includes(['kill', 'correct', 'takedown'], $scope.action) ||
                    $scope.item.associations && $scope.item.associations.featuremedia) {
                    return $q.when(true);
                }

                return api.find('archive', rewriteOf)
                    .then((rewriteOfItem) => {
                        if (rewriteOfItem && rewriteOfItem.associations &&
                            rewriteOfItem.associations.featuremedia) {
                            return confirm.confirmFeatureMedia(rewriteOfItem);
                        }
                        return true;
                    })
                    .then((result) => {
                        if (result && result.associations) {
                            $scope.item.associations = result.associations;
                            $scope.autosave($scope.item);
                            return false;
                        }

                        return true;
                    });
            }

            function publishItem(orig, item) {
                var action = $scope.action === 'edit' ? 'publish' : $scope.action;

                $scope.error = {};

                return checkMediaAssociatedToUpdate()
                    .then((result) => {
                        if (result) {
                            return authoring.publish(orig, item, action);
                        }
                        return $q.reject(false);
                    })
                    .then((response) => {
                        notify.success(gettext('Item published.'));
                        $scope.item = response;
                        $scope.dirty = false;
                        authoringWorkspace.close(true);
                        return true;
                    }, (response) => {
                        let issues = _.get(response, 'data._issues');

                        if (issues) {
                            if (angular.isDefined(issues['validator exception'])) {
                                var errors = issues['validator exception'];
                                var modifiedErrors = errors.replace(/\[/g, '')
                                    .replace(/\]/g, '')
                                    .split(',');

                                for (var i = 0; i < modifiedErrors.length; i++) {
                                    var message = _.trim(modifiedErrors[i]);
                                    // the message format is 'Field error text' (contains ')
                                    var field = message.split(' ')[0].substr(1);

                                    $scope.error[field.toLowerCase()] = true;
                                    notify.error(message);
                                }

                                if (errors.indexOf('9007') >= 0 || errors.indexOf('9009') >= 0) {
                                    authoring.open(item._id, true).then((res) => {
                                        $scope.origItem = res;
                                        $scope.dirty = false;
                                        $scope.item = _.create($scope.origItem);
                                    });
                                }

                                return $q.reject(false);
                            }

                            if (issues.unique_name && issues.unique_name.unique) {
                                notify.error(UNIQUE_NAME_ERROR);
                                return $q.reject(false);
                            }
                        } else if (response && response.status === 412) {
                            notifyPreconditionFailed();
                            return $q.reject(false);
                        }

                        notify.error(gettext('Unknown Error: Item not published.'));
                        return $q.reject(false);
                    });
            }

            function notifyPreconditionFailed() {
                notify.error(gettext('Item has changed since it was opened. ' +
                    'Please close and reopen the item to continue. ' +
                    'Regrettably, your changes cannot be saved.'));
                $scope._editable = false;
                $scope.dirty = false;
            }

            function validateForPublish(item) {
                var validator = deployConfig.getSync('validator_media_metadata');

                if (item.type === 'picture' || item.type === 'graphic') {
                    // required media metadata fields are defined in superdesk.config.js
                    _.each(Object.keys(validator), (key) => {
                        if (validator[key].required && (_.isNil(item[key]) || _.isEmpty(item[key]))) {
                            notify.error($interpolate(gettext(
                                'Required field {{ key }} is missing. ...'))({key: key}));
                            return false;
                        }
                    });
                }
                return true;
            }

            $scope.hideLiveSuggestions = function() {
                return $rootScope.config.features && $rootScope.config.features.hideLiveSuggestions;
            };

            $scope.openExport = function() {
                $scope.export = true;
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
                if (window.RunTansaProofing) {
                    const editor = editorResolver.get();

                    if (editor && editor.version() === '3') {
                        $('#editor3Tansa').html(editor.getHtmlForTansa());
                    }

                    switch ($scope.item.language) {
                    case 'nb-NO':
                        window.tansa.settings.profileId = _.get($rootScope, 'config.tansa.profile.nb');
                        break;
                    case 'nn-NO':
                        window.tansa.settings.profileId = _.get($rootScope, 'config.tansa.profile.nn');
                        break;
                    }

                    window.RunTansaProofing();
                } else {
                    notify.error(gettext('Tansa is not responding. You can continue editing or publish the story.'));
                }
            };

            $scope.isRemovedField = function(fieldName) {
                return _.has(config.infoRemovedFields, fieldName);
            };

            function afterTansa(e, isCancelled) {
                const editor = editorResolver.get();

                if (editor && editor.version() === '3') {
                    editor.setHtmlFromTansa($('#editor3Tansa').html());
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
                            'Article cannot be published. Please accept or reject all suggestions first.'
                        ),
                    });

                    return;
                }

                if (helpers.itemHasUnresolvedComments($scope.item)) {
                    modal.confirm({
                        bodyText: gettext(
                            'This article contains unresolved comments.'
                            + 'Click on Cancel to go back to editing to'
                            + 'resolve those comments or OK to ignore and proceed with publishing'
                        ),
                        headerText: gettext('Resolving comments'),
                        okText: gettext('Ok'),
                        cancelText: gettext('Cancel'),
                    }).then((ok) => ok ? performPublish() : false);

                    return;
                }

                // Check if there's unpublished related items
                const related = relationsService.getRelatedItemsWithoutMediaGallery($scope.item, $scope.fields);

                if (related.length > 0) {
                    return modal.confirm({
                        bodyText: gettext(
                            'There are unpublished related items that won\'t be sent out as related items.'
                            + ' Do you want to publish the article anyway?'
                        ),
                    }).then((ok) => ok ? performPublish() : false);
                }

                return performPublish();
            };

            function performPublish() {
                if (validatePublishScheduleAndEmbargo($scope.item) && validateForPublish($scope.item)) {
                    var message = 'publish';

                    if ($scope.action && $scope.action !== 'edit') {
                        message = $scope.action;
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

            $scope.showCustomButtons = function(item) {
                return item.task && item.task.desk && item.state !== 'draft' || $scope.dirty;
            };

            $scope.saveAndContinue = function(customButtonAction, showConfirm) {
                if ($scope.dirty) {
                    showConfirm ?
                        $scope.saveTopbar()
                            .then(confirm.confirmQuickPublish)
                            .then(customButtonAction) :
                        $scope.saveTopbar()
                            .then(customButtonAction);
                } else {
                    showConfirm ?
                        confirm.confirmQuickPublish().then(customButtonAction) :
                        customButtonAction();
                }
                initMedia();
            };

            $scope.publishAndContinue = function() {
                $scope.publish(true).then((published) => {
                    if (published) {
                        authoring.rewrite($scope.item);
                    }
                }, (err) => {
                    notify.error(gettext('Failed to publish and continue.'));
                });
                initMedia();
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
                return authoring.close($scope.item, $scope.origItem, $scope.save_enabled()).then(() => {
                    authoringWorkspace.close(true);
                });
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

            $scope.closeOpenNew = function(createFunction, paramValue) {
                _closing = true;
                authoring.close($scope.item, $scope.origItem, $scope.dirty, true).then(() => {
                    createFunction(paramValue);
                });
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
                $scope.item = _.create($scope.origItem);
                $scope._editable = $scope.action !== 'view' && authoring.isEditable($scope.origItem);

                if ($scope.isPreview) {
                    $scope.isPreview = false;
                    $scope.refreshTrigger++;
                }

                // populate content fields so that it can undo to initial (empty) version later
                var autosave = $scope.origItem._autosave || {};

                Object.keys(helpers.CONTENT_FIELDS_DEFAULTS).forEach((key) => {
                    var value = autosave[key] || $scope.origItem[key] || helpers.CONTENT_FIELDS_DEFAULTS[key];

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
                if ($rootScope.macro_dirty == true) {
                    $scope.dirty = true;
                    delete $rootScope.macro_dirty;
                }
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
                    authoringWorkspace.correct($scope.item);
                } else if (action === 'kill') {
                    authoringWorkspace.kill($scope.item);
                } else if (action === 'takedown') {
                    authoringWorkspace.takedown($scope.item);
                } else if (action === 'rewrite') {
                    authoring.rewrite($scope.item);
                }
            };

            $scope.isLocked = function() {
                return lock.isLocked($scope.item);
            };

            $scope.isLockedByMe = function() {
                return lock.isLockedByMe($scope.item);
            };

            /**
             * On change content profile the default values from new content profile
             * will overwrite the current values from item
             *
             * @function changeProfile
             * @param {Object} item - ucurrent edited content items
             */
            $scope.changeProfile = function(item) {
                angular.forEach($scope.content_types, (profile) => {
                    if (item.profile === profile._id && profile.schema) {
                        angular.forEach(profile.schema, (schema, key) => {
                            if (schema && schema.default) {
                                item[key] = _.cloneDeep(schema.default);
                            }
                        });
                    }
                });

                $scope.autosave(item);
            };

            $scope.autosave = function(item, timeout) {
                $scope.dirty = true;
                angular.extend($scope.item, item); // make sure all changes are available

                var autosavedItem = authoring.autosave($scope.item, $scope.origItem, timeout);

                authoringWorkspace.addAutosave();
                initMedia();
                return autosavedItem;
            };

            $scope.sendToNextStage = function() {
                var stageIndex, stageList = desks.deskStages[desks.activeDeskId];
                var selectedStage, selectedDesk = desks.deskLookup[desks.activeDeskId];

                for (var i = 0; i < stageList.length; i++) {
                    if (stageList[i]._id === $scope.stage._id) {
                        selectedStage = stageList[i];
                        stageIndex = i + 1 === stageList.length ? 0 : i + 1;
                        break;
                    }
                }

                $rootScope.$broadcast('item:nextStage', {
                    stage: stageList[stageIndex],
                    itemId: $scope.item._id,
                    selectedStage: selectedStage,
                    selectedDesk: selectedDesk,
                    item: $scope.item,
                });
                $scope.close();
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
                        initMedia();
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
                if ($scope.item._id === data.item && !_closing &&
                    session.sessionId !== data.lock_session) {
                    authoring.lock($scope.item, data.user);
                }
            });

            $scope.$on('item:unlock', (_e, data) => {
                if ($scope.item._id === data.item && !_closing &&
                    (session.sessionId !== data.lock_session || lock.previewUnlock)) {
                    if (lock.previewUnlock) {
                        $scope.unlock();
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
                    notify.error(gettext('No formatters found for ') + data.formats.join(',') +
                        ' while publishing item having unique name ' + data.unique_name);
                }
            });

            $scope.$on('$destroy', deregisterTansa);

            var initEmbedFieldsValidation = () => {
                $scope.isValidEmbed = {};
                content.getTypes().then(() => {
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

            /**
             * @ngdoc method
             * @name sdAuthoring#isMediaField
             * @private
             * @description Returns true if the given string is a vocabulary media
             *              field identifier, false otherwise.
             * @param {string} fieldId
             * @return {bool}
             */
            function isMediaField(fieldId) {
                var parts = mediaIdGenerator.getFieldParts(fieldId);
                var field = _.find($scope.fields, (field) => field._id === parts[0]);

                return field && field.field_type === 'media';
            }

            /**
             * @ngdoc method
             * @name sdAuthoring#computeMediaFieldVersions
             * @private
             * @description Generates an array of name versions for a given vocabulary
             *              media field.
             * @param {string} fieldId
             */
            function computeMediaFieldVersions(fieldId) {
                $scope.mediaFieldVersions[fieldId] = [];

                var field = _.find($scope.fields, (field) => field._id === fieldId);

                if (field) {
                    var multipleItems = _.get(field, 'field_options.multiple_items.enabled');
                    var maxItems = !multipleItems ? 1 : _.get(field, 'field_options.multiple_items.max_items');

                    if (!maxItems || !mediaFields[fieldId] || mediaFields[fieldId].length < maxItems) {
                        addMediaFieldVersion(fieldId, $scope.getNewMediaFieldId(fieldId), null);
                    }
                    _.forEach(mediaFields[fieldId], (version) => {
                        addMediaFieldVersion(fieldId, mediaIdGenerator.getFieldVersionName(fieldId, version));
                    });
                }
            }

            function addMediaFieldVersion(fieldId, fieldVersion) {
                var field = {fieldId: fieldVersion};

                if (_.has($scope.item.associations, fieldVersion)) {
                    field[fieldVersion] = $scope.item.associations[fieldVersion];
                } else {
                    field[fieldVersion] = null;
                }
                $scope.mediaFieldVersions[fieldId].push(field);
            }

            /**
             * @ngdoc method
             * @name sdAuthoring#addMediaField
             * @private
             * @description Adds the version of the given field name to the versions array.
             * @param {string} fieldId
             */
            function addMediaField(fieldId) {
                var [rootField, index] = mediaIdGenerator.getFieldParts(fieldId);

                if (!_.has(mediaFields, rootField)) {
                    mediaFields[rootField] = [];
                }
                mediaFields[rootField].push(index);
                mediaFields[rootField].sort((a, b) => {
                    if (b === null || b === undefined) {
                        return -1;
                    }
                    if (a === null || a === undefined) {
                        return 1;
                    }
                    return b - a;
                });
            }

            /**
             * @ngdoc method
             * @name sdAuthoring#initMedia
             * @private
             * @description Initializes arrays containing the media fields versions.
             */
            function initMedia() {
                mediaFields = {};
                $scope.mediaFieldVersions = {};

                _.forEach($scope.item.associations, (association, fieldId) => {
                    if (association && _.findIndex(MEDIA_TYPES, (type) => type === association.type) !== -1
                        && isMediaField(fieldId)) {
                        addMediaField(fieldId);
                    }
                });

                if ($scope.contentType && $scope.contentType.schema) {
                    _.forEach($scope.fields, (field) => {
                        if (isMediaField(field._id)) {
                            computeMediaFieldVersions(field._id);
                        }
                    });
                }
            }

            /**
             * @ngdoc method
             * @name sdAuthoring#getNewMediaFieldId
             * @public
             * @description Returns a new name version for a given media field.
             * @param {String} fieldId
             * @return {String}
             */
            $scope.getNewMediaFieldId = (fieldId) => {
                var field = _.find($scope.fields, (field) => field._id === fieldId);
                var multipleItems = field ? _.get(field, 'field_options.multiple_items.enabled') : false;
                var parts = mediaIdGenerator.getFieldParts(fieldId);
                var newIndex = multipleItems ? 1 : null;

                if (_.has(mediaFields, parts[0])) {
                    var fieldVersions = mediaFields[parts[0]];

                    newIndex = fieldVersions.length ? 1 + fieldVersions[0] : 1;
                }
                return mediaIdGenerator.getFieldVersionName(parts[0], newIndex);
            };

            // init
            $scope.content = content;
            $scope.closePreview();
            macros.setupShortcuts($scope);
            initEmbedFieldsValidation();
        },
    };
}
