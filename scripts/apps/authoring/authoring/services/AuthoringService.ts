import _, {cloneDeep} from 'lodash';
import {flatMap} from 'lodash';
import * as helpers from 'apps/authoring/authoring/helpers';
import {gettext} from 'core/utils';
import {logger} from 'core/services/logger';
import {isPublished, isKilled} from 'apps/archive/utils';
import {showModal, showErrorsModal} from 'core/services/modalService';
import {getUnpublishConfirmModal} from '../components/unpublish-confirm-modal';
import {ITEM_STATE, CANCELED_STATES, READONLY_STATES} from 'apps/archive/constants';
import {AuthoringWorkspaceService} from './AuthoringWorkspaceService';
import {appConfig, extensions} from 'appConfig';
import {IPublishedArticle, IArticle, IExtensionActivationResult} from 'superdesk-api';
import {getPublishWarningConfirmModal} from '../components/publish-warning-confirm-modal';
import {applyMiddleware as coreApplyMiddleware} from 'core/middleware';
import {onChangeMiddleware} from '../index';
import {dataApi} from 'core/helpers/CrudManager';

export function runBeforeUpdateMiddlware(item: IArticle, orig: IArticle): Promise<IArticle> {
    return coreApplyMiddleware(onChangeMiddleware, {item: item, original: orig}, 'item')
        .then(() => {
            const onUpdateFromExtensions = Object.values(extensions).map(
                (extension) => extension.activationResult?.contributions?.authoring?.onUpdateBefore,
            ).filter((updateFn) => updateFn != null);

            return (
                onUpdateFromExtensions.length < 1
                    ? Promise.resolve(item)
                    : onUpdateFromExtensions
                        .reduce(
                            (current, next) => current.then(
                                (result) => next(orig._autosave ?? orig, result),
                            ),
                            Promise.resolve(item),
                        )
                        .then((nextItem) => angular.extend(item, nextItem))
            );
        });
}

export function runAfterUpdateEvent(previous: IArticle, current: IArticle) {
    const onUpdateAfterFromExtensions = Object.values(extensions).map(
        (extension) => extension.activationResult?.contributions?.authoring?.onUpdateAfter,
    ).filter((fn) => fn != null);

    onUpdateAfterFromExtensions.forEach((fn) => {
        fn(previous, current);
    });
}

function isReadOnly(item: IArticle) {
    return READONLY_STATES.includes(item.state);
}

function canRewrite(item: IArticle): true | Array<string> {
    const errors = [];

    if (
        isReadOnly(item)
        && !(item.state === ITEM_STATE.SCHEDULED && appConfig.allow_updating_scheduled_items === true)
    ) {
        errors.push(gettext('The item is read-only.'));
    }

    if (item.type !== 'text') {
        errors.push(gettext(
            'Updates can only be created for text items. The type of this item is {{type}}',
            {type: item.type},
        ));
    }

    if (item.rewritten_by != null) {
        errors.push(gettext(
            'An update for this version of the item already exists. '
            + 'To create another update, find the latest version of the item.',
        ));
    }

    if (item.broadcast?.master_id != null) {
        errors.push(gettext('Can not update a broadcast version of the story.'));
    }

    if (item.rewrite_of != null && !(isPublished(item) || appConfig.workflow_allow_multiple_updates)) {
        errors.push(gettext('An update can not be created for an item which is not published yet.'));
    }

    if (errors.length < 1) {
        return true;
    } else {
        return errors;
    }
}

interface IPublishOptions {
    notifyErrors: boolean;
}

interface Iparams {
    publishing_warnings_confirmed?: boolean;
    desk_id?: string;
}

/**
 * @ngdoc service
 * @module superdesk.apps.authoring
 * @name authoring
 *
 * @requires $q
 * @requires $location
 * @requires api
 * @requires lock
 * @requires autosave
 * @requires confirm
 * @requires privileges
 * @requires desks
 * @requires superdeskFlags
 * @requires notify
 * @requires session
 * @requires $injector
 * @requires moment
 * @requires config
 *
 * @description Authoring Service is responsible for management of the actions on a story
 */
AuthoringService.$inject = ['$q', '$location', 'api', 'lock', 'autosave', 'confirm', 'privileges', 'desks',
    'superdeskFlags', 'notify', 'session', '$injector', 'moment', 'familyService', 'modal', 'archiveService'];
export function AuthoringService($q, $location, api, lock, autosave, confirm, privileges, desks, superdeskFlags,
    notify, session, $injector, moment, familyService, modal, archiveService) {
    var self = this;

    // TODO: have to trap desk update event for refereshing users desks.
    this.userDesks = [];
    const publishFromPersonal = appConfig?.features?.publishFromPersonal;

    /**
     * Returns the default properties which should be picked from item before sending API Request for save/update.
     *
     * @returns {Object}
     */
    this.getContentFieldDefaults = function() {
        return helpers.CONTENT_FIELDS_DEFAULTS;
    };

    const isCorrection = (item: IArticle): boolean => {
        if (item.state === ITEM_STATE.CORRECTION) {
            return true;
        }
    };

    const isBeingCorrected = (item: IArticle): boolean => {
        if (item.state === ITEM_STATE.BEING_CORRECTED) {
            return true;
        }
    };

    desks.fetchCurrentUserDesks().then((desksList) => {
        self.userDesks = desksList;
    });

    /**
     * Open an item for editing
     *
     * @param {string} _id Item _id.
     * @param {boolean} readOnly
     * @param {string} repo - repository where an item whose identifier is _id can be found.
     * @param {string} action - action performed to open the story: edit, correct or kill
     */
    this.open = function openAuthoring(_id, readOnly, repo, action, state) {
        let endpoint = 'archive';

        if ($location.$$path !== '/multiedit') {
            superdeskFlags.flags.authoring = true;
        }
        if (_.includes(['legal_archive', 'archived'], repo)) {
            return api.find(repo, _id).then((item) => {
                item._editable = false;
                return item;
            });
        }

        if (state) {
            endpoint = 'published';
        }

        return api.find(endpoint, _id, {embedded: {lock_user: 1}})
            .then(function _lock(item) {
                if (readOnly) {
                    item._locked = lock.isLockedInCurrentSession(item);
                    item._editable = false;
                    return $q.when(item);
                } else if (lock.isLocked(item)) { // is locked by someone else
                    item._locked = false;
                    item._editable = false;
                    return $q.when(item);
                } else if (lock.isLockedInCurrentSession(item)) { // we have lock
                    item._locked = true;
                    item._editable = true;
                    return $q.when(item);
                }

                item._editable = true; // not locked at all, try to lock
                return lock.lock(item, false, action);
            })
            .then((item) => autosave.open(item).then(null, (err) => item));
    };

    this.rewrite = function(item): void {
        var authoringWorkspace: AuthoringWorkspaceService = $injector.get('authoringWorkspace');

        function getOnRewriteAfterMiddlewares()
        : Array<IExtensionActivationResult['contributions']['entities']['article']['onRewriteAfter']> {
            return flatMap(
                Object.values(extensions).map(({activationResult}) => activationResult),
                (activationResult) =>
                    activationResult.contributions != null
                    && activationResult.contributions.entities != null
                    && activationResult.contributions.entities.article != null
                    && activationResult.contributions.entities.article.onRewriteAfter != null
                        ? activationResult.contributions.entities.article.onRewriteAfter
                        : [],
            );
        }

        const errors = canRewrite(item);

        if (Array.isArray(errors)) {
            showErrorsModal(gettext('An update can not be created'), errors);

            return;
        }

        var updates = {
            desk_id: desks.getCurrentDeskId() || item.task.desk,
        };

        return api.save('archive_rewrite', {}, updates, item)
            .then((newItem: IArticle) => {
                const onRewriteAfterMiddlewares = getOnRewriteAfterMiddlewares();

                return onRewriteAfterMiddlewares.reduce(
                    (current, next) => {
                        return current.then((result) => {
                            return next(Object.freeze(result));
                        });
                    },
                    Promise.resolve(Object.freeze(newItem)),
                )
                    // Create a copy in order to avoid returning a frozen object.
                    // Freezing is only meant to affect middlewares.
                    .then((_item) => cloneDeep(_item));
            })
            .then((newItem) => {
                notify.success(gettext('Update Created.'));
                authoringWorkspace.edit(newItem);
            }, (response) => {
                if (angular.isDefined(response.data._message)) {
                    notify.error(gettext('Failed to generate update: {{message}}', {message: response.data._message}));
                } else {
                    notify.error(gettext('There was an error. Failed to generate update.'));
                }
            });
    };

    /**
     * @ngdoc method
     * @name authoring#unlink
     * @public
     * @description Removes the update link of a given story
     * @param {Object} item
     */
    this.unlink = (item) => session.getIdentity()
        .then((user) => api.remove(item, {}, 'archive_rewrite'))
        .then((data) => notify.success(gettext('Link has been removed')),
            (response) => {
                if (angular.isDefined(response.data._message)) {
                    notify.error(gettext('Failed to remove link: {{message}}', {message: response.data._message}));
                } else {
                    notify.error(gettext('There was an error. Failed to remove link.'));
                }
            });

    /**
     * Close an item
     *
     *   and save it if dirty, unlock if editable, and remove from work queue at all times
     *
     * @param {Object} diff
     * @param {Object} orig
     * @param {boolean} isDirty $scope dirty status.
     */
    this.close = function closeAuthoring(diff, orig, isDirty, closeItem) {
        var promise = $q.when();

        if (this.isEditable(diff)) {
            if (isDirty) {
                if (!_.includes(['published', 'corrected'], orig.state)) {
                    promise = confirm.confirm()
                        .then(angular.bind(this, function save() {
                            return this.save(orig, diff);
                        }), () => // ignore saving
                            $q.when('ignore'));
                } else {
                    promise = $q.when('ignore');
                }
            }

            promise = promise.then(function unlock(cancelType) {
                if (cancelType && cancelType === 'ignore') {
                    autosave.drop(orig);
                }

                if (!closeItem) {
                    return lock.unlock(diff);
                }
            });
        }

        return promise;
    };

    /**
     * Publish an item
     *
     *   and save it if dirty
     *
     * @param {Object} orig original item.
     * @param {Object} diff Edits.
     * @param {boolean} isDirty $scope dirty status.
     */
    this.publishConfirmation = function publishAuthoring(orig, diff, isDirty, action) {
        var promise = $q.when();

        if (this.isEditable(diff) && isDirty) {
            promise = confirm.confirmPublish(action)
                .then(angular.bind(this, function save() {
                    return true;
                }), () => // cancel
                    false);
        }

        return promise;
    };

    /**
     * Removes certain properties which are irrelevant for publish actions depending on the orig.item.state.
     * If not removed the API will throw errors.
     */
    this.cleanUpdatesBeforePublishing = function(original, updates, action = 'publish') {
        // check if rendition is dirty for real
        if (_.isEqual(original.renditions, updates.renditions)) {
            delete updates.renditions;
        }

        // Remove sign off from update (if it is not mapped), it will get the publishing user appended in the backend
        if (updates.sign_off && !(appConfig.user != null && appConfig.user.sign_off_mapping)) {
            delete updates.sign_off;
        }

        // for kill and take down action dateline is not required
        if (action === 'kill' || action === 'takedown') {
            delete updates.dateline;
        }

        helpers.stripHtml(updates);
        helpers.stripWhitespaces(updates);

        // If the text equivalent of the body_html is empty then set the body empty
        if (angular.isDefined(updates.body_html)) {
            var elem = document.createElement('div');

            elem.innerHTML = updates.body_html;
            if (elem.textContent === '') {
                updates.body_html = '';
            }
        }
    };

    this.publish = function publish(orig, diff, action = 'publish', publishingWarningsConfirmed = false,
        {notifyErrors}: IPublishOptions = {notifyErrors: false},
    ) {
        let extDiff = helpers.extendItem({}, diff);

        if (extDiff['task'] && $location.path() !== '/workspace/personal') {
            delete extDiff['task'];
        }

        // if there were some changes on image, we should update etag
        if (diff && diff._etag) {
            orig._etag = diff._etag;
        }

        this.cleanUpdatesBeforePublishing(orig, extDiff, action);
        helpers.filterDefaultValues(extDiff, orig);
        var endpoint = 'archive_' + action;

        var params: Iparams = {
            publishing_warnings_confirmed: publishingWarningsConfirmed,
        };

        if (publishFromPersonal) {
            params.desk_id = session.identity.desk || desks.getCurrentDeskId();
        }

        return api.update(endpoint, orig, extDiff, params)
            .catch(
                (reason) => {
                    const issues = reason?.data?._issues;

                    if (notifyErrors && issues) {
                        Object.values(reason.data._issues).forEach((message) => {
                            if (message != null) {
                                notify.error(message);
                            }
                        });
                    } else if (issues?.['validator exception'] && issues?.fields == null) {
                        let errorObj: {[key: string]: Array<string>} = {};

                        try {
                            errorObj = JSON.parse(issues?.['validator exception']);
                        } catch (e) {
                            logger.error(e);
                            return $q.reject(reason);
                        }

                        const publishingAction = () => {
                            return self.publish(orig, diff, action, true);
                        };

                        if (errorObj.warnings) {
                            return getPublishWarningConfirmModal(errorObj.warnings, publishingAction);
                        }
                    }

                    if (issues == null) {
                        notify.error(gettext('Unknown Error: Item not published.'));
                    }

                    return $q.reject(reason);
                },
            );
    };

    this.correction = function correction(item: IPublishedArticle, handleIsCorrection, removeCorrection = false) {
        var authoringWorkspace: AuthoringWorkspaceService = $injector.get('authoringWorkspace');
        let extDiff = {};

        desks.initialize()
            .then(() => {
                return archiveService.getVersions(item, desks, 'versions');
            })
            .then((versions) => {
                if (removeCorrection) {
                    const previous_version = versions.find((version) => {
                        if (version.state === 'corrected' && version.correction_sequence === item.correction_sequence) {
                            return version;
                        }
                        return version.state === 'published';
                    });

                    extDiff = helpers.extendItem({}, previous_version);
                }

                return api.update('archive_correction', item, extDiff, {remove_correction: removeCorrection})
                    .then((newItem) => {
                        if (removeCorrection) {
                            notify.success(gettext('Correction has been removed'));
                        } else {
                            authoringWorkspace.edit(newItem);
                            notify.success(gettext('Update Created.'));
                        }
                    }, (response) => {
                        if (angular.isDefined(response.data._message)) {
                            notify.error(gettext('Failed to generate update: {{message}}',
                                {message: response.data._message}));
                        } else {
                            notify.error(gettext('There was an error. Failed to generate update.'));
                        }
                        if (handleIsCorrection) {
                            handleIsCorrection();
                        }
                    });
            });
    };

    this.unpublish = function unpublish(item: IPublishedArticle) {
        let relatedItems = [];

        const handleSuccess = () => {
            notify.success(gettext('Item was unpublished successfully.'));
        };

        if (!isPublished(item)) {
            logger.warn('Trying to unpublish non published item');
            return;
        }

        familyService.fetchRelatedByState(item, [ITEM_STATE.PUBLISHED]).then((items) => {
            relatedItems = items;

            const unpublishAction = (selected) => {
                // get the latest updated item.
                api.find('archive', item._id).then((updatedItem) => {
                    self.publish(updatedItem, {}, 'unpublish', {notifyErrors: true})
                        .then(handleSuccess);
                });
                relatedItems.forEach((relatedItem) => {
                    if (selected[relatedItem._id]) {
                        self.publish(relatedItem, {}, 'unpublish', {notifyErrors: true})
                            .then(handleSuccess);
                    }
                });
            };

            showModal(getUnpublishConfirmModal(item, relatedItems, unpublishAction));
        });
    };

    this.saveWorkConfirmation = function saveWorkAuthoring(orig, diff, isDirty, message) {
        var promise = $q.when();

        if (isDirty) {
            if (this.isEditable(diff)) {
                promise = confirm.confirmSaveWork(message)
                    .then(angular.bind(this, function save() {
                        return this.saveWork(orig, diff);
                    }), (err) => // cancel
                        $q.when());
            }
        }

        return promise;
    };

    /**
     * Autosave the changes
     *
     * @param {Object} item
     * @param {Object} orig
     */
    this.autosave = function autosaveAuthoring(item, orig, timeout, callback) {
        return autosave.save(item, orig, timeout, callback);
    };

    /**
     * Save the item
     *
     * @param {Object} origItem
     * @param {Object} item
     */
    this.save = function saveAuthoring(origItem, _item) {
        return runBeforeUpdateMiddlware(_item, origItem).then((item: IArticle) => {
            var diff = helpers.extendItem({}, item);
            // Finding if all the keys are dirty for real

            if (angular.isDefined(origItem)) {
                angular.forEach(_.keys(diff), (key) => {
                    if (_.isEqual(diff[key], origItem[key])) {
                        delete diff[key];
                    }
                });
            }

            helpers.stripHtml(diff);
            helpers.stripWhitespaces(diff);
            helpers.cutoffPreviousRenditions(diff, origItem);
            autosave.stop(item);

            if (diff._etag) { // make sure we use orig item etag
                delete diff._etag;
            }

            // if current document is image and it has been changed on 'media edit' we have to update the etag
            if (origItem.type === 'picture' && item._etag != null) {
                diff._etag = item._etag;
            }

            helpers.filterDefaultValues(diff, origItem);

            if (_.size(diff) > 0) {
                return api.save('archive', origItem, diff, {},
                    {publish_from_personal: publishFromPersonal}).then((__item) => {
                    runAfterUpdateEvent(origItem, __item);

                    if (origItem.type === 'picture') {
                        item._etag = __item._etag;
                    }
                    origItem._autosave = null;
                    origItem._autosaved = false;
                    origItem._locked = lock.isLockedInCurrentSession(item);

                    const authoringWorkspace: AuthoringWorkspaceService = $injector.get('authoringWorkspace');

                    authoringWorkspace.update(origItem);
                    return origItem;
                });
            }

            if (origItem) {
                // if there is nothing to save. No diff.
                origItem._autosave = null;
                origItem._autosaved = false;
            }

            return Promise.resolve(origItem);
        });
    };

    /**
     * Save the item as new item in workspace when any critical configuration changes occur
     *
     * @param {Object} orig
     * @param {Object} item
     */
    this.saveWork = function saveWork(orig, item) {
        var _orig = {type: orig.type, version: 1, task: {desk: null, stage: null, user: orig.task.user}};
        var _diff = _.omit(item, ['unique_name', 'unique_id', '_id', 'guid']);
        var diff = helpers.extendItem(_orig, _diff);

        return api.save('archive', {}, diff).then((_item) => {
            _item._autosave = null;
            return _item;
        });
    };

    /**
     * Test if an item is editable
     *
     * @param {Object} item
     */
    this.isEditable = function isEditable(item) {
        return lock.isLockedInCurrentSession(item);
    };

    /**
     * Unlock an item - callback for item:unlock event
     *
     * @param {Object} item
     * @param {string} userId
     */
    this.unlock = function unlock(item, userId) {
        autosave.stop(item);
        item.lock_session = null;
        item.lock_user = null;
        item._locked = false;
        confirm.unlock(userId, item.headline);
    };

    /**
     * Lock an item - callback for item:lock event
     */
    this.lock = function(
        item: IArticle,
        data: {
            user: string;
            lock_time: string;
            lock_session: string;
        },
    ) {
        autosave.stop(item);
        api.find('users', data.user).then((user) => {
            item.lock_user = user;
            item.lock_session = data.lock_session;
            item._locked = true;
        });
    };

    /**
    * Actions that it can perform on an item
    * @param {Object} item : item
    */
    this.itemActions = function(item, userDesks) {
        var currentItem = this._getCurrentItem(item);
        var userPrivileges = privileges.privileges;
        var action = angular.extend({}, helpers.DEFAULT_ACTIONS);
        var itemOnReadOnlyStage = item && item.task && item.task.stage && desks.isReadOnlyStage(item.task.stage);
        var isUndefinedOperation = angular.isUndefined(currentItem) || angular.isUndefined(userPrivileges);

        action = this._updateActionsForContentApi(currentItem, action);

        // killed item and item that have last publish action are readonly
        if (isUndefinedOperation || itemOnReadOnlyStage || isKilled(currentItem) || !action.view) {
            return action;
        }

        // Archived items can be duplicated
        if (_.get(currentItem, '_type') === 'archived' && currentItem.type === 'text') {
            action.duplicate = action.duplicateTo = true;
            return action;
        }

        var lockedByMe = !lock.isLocked(currentItem);

        action.view = !lockedByMe;
        action.unlinkUpdate = this._canUnlinkUpdate(currentItem);
        action.cancelCorrection = !this._isReadOnly(item) && currentItem.state === ITEM_STATE.CORRECTION;
        action.export = currentItem && currentItem.type && currentItem.type === 'text'
            && !isBeingCorrected(currentItem);

        // item is published state - corrected, published, scheduled, killed
        if (isPublished(currentItem) && item.state !== 'unpublished') {
            // if not the last published version
            if (item.last_published_version === false) {
                return angular.extend({}, helpers.DEFAULT_ACTIONS);
            }

            this._updatePublished(currentItem, action);
        } else {
            if (currentItem.state === ITEM_STATE.SPIKED) {
                action = angular.extend({}, helpers.DEFAULT_ACTIONS);
                action.unspike = true;
                action.mark_item_for_desks = true;
                action.mark_item_for_highlight = true;
                return action;
            }

            this._updateUnpublished(currentItem, action);
        }

        this._updateGeneralActions(currentItem, action);

        return this._updateDeskActions(currentItem, action, userDesks || self.userDesks);
    };

    this._updateActionsForContentApi = function(item, action) {
        if (this.isContentApiItem(item)) {
            let _action = angular.extend({}, helpers.DEFAULT_ACTIONS);

            _action.view = false;
            return _action;
        }

        return action;
    };

    this.isContentApiItem = function(item) {
        return item._type === 'items';
    };

    this._isBroadcastItem = function(item) {
        return item.genre && item.genre.length > 0 &&
            _.includes(['text', 'preformatted'], item.type) &&
            item.genre.some((genre) => genre.name === 'Broadcast Script');
    };

    /**
     * @ngdoc method
     * @name authoring#_canUnlinkUpdate
     * @private
     * @description Checks if the given item can be unlinked as an update
     * @param {Object} item
     * @returns {boolean}
     */
    this._canUnlinkUpdate = (item) => !this._isReadOnly(item) && item.type === 'text' &&
        !isPublished(item) && !_.isNil(item.rewrite_of) && _.isNil(item.rewritten_by);

    this._isReadOnly = function(item) {
        return READONLY_STATES.includes(item.state);
    };

    this._updatePublished = function(currentItem, action) {
        let userPrivileges = privileges.privileges;
        let lockedByMe = !lock.isLocked(currentItem);
        let isReadOnlyState = this._isReadOnly(currentItem);
        let isPublishedOrCorrected = currentItem.state === ITEM_STATE.PUBLISHED ||
            currentItem.state === ITEM_STATE.CORRECTED || isCorrection(currentItem);

        action.view = true;

        if (currentItem.state === ITEM_STATE.SCHEDULED) {
            action.deschedule = true;
        } else if (isPublishedOrCorrected) {
            action.kill = userPrivileges.kill && lockedByMe && !isReadOnlyState;
            action.correct = userPrivileges.correct && lockedByMe && !isReadOnlyState
                && !isBeingCorrected(currentItem) && !isCorrection(currentItem);
            action.takedown = userPrivileges.takedown && lockedByMe && !isReadOnlyState;
            action.unpublish = userPrivileges.unpublish && lockedByMe && !isReadOnlyState;
        }
    };

    this._updateUnpublished = function(currentItem, action) {
        let userPrivileges = privileges.privileges;
        var lockedByMe = !lock.isLocked(currentItem);

        action.save = currentItem.state !== ITEM_STATE.SPIKED;

        action.publish = (!currentItem.flags || !currentItem.flags.marked_for_not_publication) &&
                currentItem.task && currentItem.task.desk &&
                (!currentItem.highlight || currentItem.type !== 'composite') &&
                userPrivileges.publish && currentItem.state !== 'draft';

        action.edit = currentItem.state !== ITEM_STATE.SPIKED && lockedByMe;

        action.spike = currentItem.state !== ITEM_STATE.SPIKED && userPrivileges.spike
            && !isCorrection(currentItem) && !isBeingCorrected(currentItem);

        action.send = currentItem._current_version > 0 && lockedByMe;
    };

    this._getCurrentItem = function(item) {
        if (item.state === 'being_corrected') {
            return item;
        }
        return item && item.archive_item && item.archive_item.state ? item.archive_item : item;
    };

    this._updateGeneralActions = function(currentItem, action) {
        let isReadOnlyState = this._isReadOnly(currentItem);
        let userPrivileges = privileges.privileges;
        let isPersonalSpace = $location.path() === '/workspace/personal';

        action.re_write = canRewrite(currentItem) === true && !isBeingCorrected(currentItem)
            && !isCorrection(currentItem);
        action.resend = currentItem.type === 'text' &&
            isPublished(currentItem, false);

        // mark item for highlights
        action.mark_item_for_highlight = currentItem.task && currentItem.task.desk && !isPersonalSpace
            && !isReadOnlyState && currentItem.type === 'text' && userPrivileges.mark_for_highlights
            && !isCorrection(currentItem) && !isBeingCorrected(currentItem);

        // mark item for desks
        action.mark_item_for_desks = currentItem.task && currentItem.task.desk && !isPersonalSpace
            && !isReadOnlyState && userPrivileges.mark_for_desks && currentItem.type === 'text'
            && !isBeingCorrected(currentItem);

        // allow all stories to be packaged if it doesn't have Embargo
        action.package_item = !READONLY_STATES.includes(currentItem.state) &&
            !currentItem.embargo && !isCorrection(currentItem) && !isBeingCorrected(currentItem)
            && (isPublished(currentItem) || !currentItem.publish_schedule);

        action.create_broadcast = _.includes([ITEM_STATE.PUBLISHED, ITEM_STATE.CORRECTED], currentItem.state) &&
            _.includes(['text', 'preformatted'], currentItem.type) &&
            !this._isBroadcastItem(currentItem) && userPrivileges.archive_broadcast;

        action.multi_edit = !isReadOnlyState;
    };

    // check for desk membership for edit rights and returns updated
    // actions accordingly
    this._updateDeskActions = function(currentItem, oldAction, userDesks) {
        let action = oldAction;
        let userPrivileges = privileges.privileges;

        if (currentItem.task && currentItem.task.desk) {
            // in production

            action.duplicate = userPrivileges.duplicate &&
                !CANCELED_STATES.includes(currentItem.state)
                && !isCorrection(currentItem) && !isBeingCorrected(currentItem);
            const duplicateTo = action.duplicateTo = action.duplicate;

            action.add_to_current = !READONLY_STATES.includes(currentItem.state);

            var desk = _.find(userDesks, {_id: currentItem.task.desk});

            if (!desk) {
                action = angular.extend({}, helpers.DEFAULT_ACTIONS);

                // Allow some actions even if a user is not a member of the desk where an item is localted.

                action.re_write = oldAction.re_write;

                if (privileges.privileges.mark_for_desks__non_members) {
                    action.mark_item_for_desks = oldAction.mark_item_for_desks;
                }

                if (appConfig.workflow_allow_duplicate_non_members) {
                    action.duplicateTo = duplicateTo;
                }
            }

            if (appConfig.workflow_allow_copy_to_personal) {
                action.copy = true;
            }
        } else {
            // personal
            action.copy = true;
            action.view = false;
            action.package_item = false;
            action.re_write = false;
        }

        return action;
    };

    /**
     * Validate schedule
     *
     * should be both valid date and time and it should be some time in future
     *
     * @param {String} datePart
     * @param {String} timePart
     * @param {String} timestamp datePart + T + timepart
     * @param {String} timezone
     * @return {Object}
     */
    this.validateSchedule = function(datePart, timePart, timestamp, timezone) {
        function errors(key) {
            var _errors = {};

            _errors[key] = 1;
            return _errors;
        }

        if (!datePart) {
            return errors('date');
        }

        if (!timePart) {
            return errors('time');
        }

        var now = moment();
        var schedule = moment.tz(
            timestamp.replace('+0000', '').replace('Z', ''), // avoid timezone info here
            timezone || appConfig.default_timezone,
        );

        if (!schedule.isValid()) {
            return errors('timestamp');
        }

        if (schedule.isBefore(now)) {
            return errors('future');
        }
    };
}
