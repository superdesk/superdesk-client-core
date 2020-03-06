import _ from 'lodash';
import {flatMap} from 'lodash';
import * as helpers from 'apps/authoring/authoring/helpers';
import {gettext} from 'core/utils';
import {logger} from 'core/services/logger';
import {isPublished, isKilled} from 'apps/archive/utils';
import {showModal} from 'core/services/modalService';
import {getUnpublishConfirmModal} from '../components/unpublish-confirm-modal';
import {ITEM_STATE, CANCELED_STATES, READONLY_STATES} from 'apps/archive/constants';
import {AuthoringWorkspaceService} from './AuthoringWorkspaceService';
import {appConfig, extensions} from 'appConfig';
import {IPublishedArticle, IArticle, IExtensionActivationResult} from 'superdesk-api';
import {getPublishWarningConfirmModal} from '../components/publish-warning-confirm-modal';

interface IPublishOptions {
    notifyErrors: boolean;
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
    'superdeskFlags', 'notify', 'session', '$injector', 'moment', 'familyService', 'modal'];
export function AuthoringService($q, $location, api, lock, autosave, confirm, privileges, desks, superdeskFlags,
    notify, session, $injector, moment, familyService, modal) {
    var self = this;

    // TODO: have to trap desk update event for refereshing users desks.
    this.userDesks = [];

    /**
     * Returns the default properties which should be picked from item before sending API Request for save/update.
     *
     * @returns {Object}
     */
    this.getContentFieldDefaults = function() {
        return helpers.CONTENT_FIELDS_DEFAULTS;
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
    this.open = function openAuthoring(_id, readOnly, repo, action) {
        if ($location.$$path !== '/multiedit') {
            superdeskFlags.flags.authoring = true;
        }
        if (_.includes(['legal_archive', 'archived'], repo)) {
            return api.find(repo, _id).then((item) => {
                item._editable = false;
                return item;
            });
        }

        return api.find('archive', _id, {embedded: {lock_user: 1}})
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

    this.rewrite = function(item) {
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

        session.getIdentity()
            .then((user) => {
                var updates = {
                    desk_id: desks.getCurrentDeskId() || item.task.desk,
                };

                return api.save('archive_rewrite', {}, updates, Object.freeze(item))
                    .then((newItem: IArticle) => {
                        const onRewriteAfterMiddlewares = getOnRewriteAfterMiddlewares();

                        return onRewriteAfterMiddlewares.reduce(
                            (current, next) => {
                                return current.then((result) => {
                                    return next(result);
                                });
                            },
                            Promise.resolve(newItem),
                        );
                    });
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

        // if there were some changes on image, we should update etag
        if (diff && diff._etag) {
            orig._etag = diff._etag;
        }

        this.cleanUpdatesBeforePublishing(orig, extDiff, action);
        helpers.filterDefaultValues(extDiff, orig);
        var endpoint = 'archive_' + action;

        return api.update(endpoint, orig, extDiff, {publishing_warnings_confirmed: publishingWarningsConfirmed})
            .then(
                (result) => lock.unlock(result).catch(() => result), // ignore unlock err
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
                self.publish(item, {}, 'unpublish', {notifyErrors: true})
                    .then(handleSuccess);

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
    this.autosave = function autosaveAuthoring(item, orig, timeout) {
        return autosave.save(item, orig, timeout);
    };

    /**
     * Save the item
     *
     * @param {Object} origItem
     * @param {Object} item
     */
    this.save = function saveAuthoring(origItem, item) {
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
            return api.save('archive', origItem, diff).then((_item) => {
                if (origItem.type === 'picture') {
                    item._etag = _item._etag;
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

        return $q.when(origItem);
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
            action.duplicate = true;
            return action;
        }

        var lockedByMe = !lock.isLocked(currentItem);

        action.view = !lockedByMe;
        action.unlinkUpdate = this._canUnlinkUpdate(currentItem);
        action.export = currentItem && currentItem.type && currentItem.type === 'text';

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
            currentItem.state === ITEM_STATE.CORRECTED;

        action.view = true;

        if (currentItem.state === ITEM_STATE.SCHEDULED) {
            action.deschedule = true;
        } else if (isPublishedOrCorrected) {
            action.kill = userPrivileges.kill && lockedByMe && !isReadOnlyState;
            action.correct = userPrivileges.correct && lockedByMe && !isReadOnlyState;
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

        action.spike = currentItem.state !== ITEM_STATE.SPIKED && userPrivileges.spike;

        action.send = currentItem._current_version > 0 && lockedByMe;
    };

    this._getCurrentItem = function(item) {
        return item && item.archive_item && item.archive_item.state ? item.archive_item : item;
    };

    this._updateGeneralActions = function(currentItem, action) {
        let isReadOnlyState = this._isReadOnly(currentItem);
        let userPrivileges = privileges.privileges;

        function canRewrite() {
            if (currentItem.rewritten_by != null) {
                return false;
            }

            if (currentItem.state === ITEM_STATE.SCHEDULED && appConfig.allow_updating_scheduled_items === true) {
                return true;
            }
            return !isReadOnlyState && currentItem.type === 'text'
                && !currentItem.embargo && !currentItem.rewritten_by
                && (!currentItem.broadcast || !currentItem.broadcast.master_id)
                && (
                    (!currentItem.rewrite_of || (
                        currentItem.rewrite_of && isPublished(currentItem)
                    ) || appConfig.workflow_allow_multiple_updates)
                );
        }
        action.re_write = canRewrite();
        action.resend = currentItem.type === 'text' &&
            isPublished(currentItem, false);

        // mark item for highlights
        action.mark_item_for_highlight = currentItem.task && currentItem.task.desk &&
            !isReadOnlyState && currentItem.type === 'text' && userPrivileges.mark_for_highlights;

        // mark item for desks
        action.mark_item_for_desks = currentItem.task && currentItem.task.desk &&
            !isReadOnlyState && userPrivileges.mark_for_desks && currentItem.type === 'text';

        // allow all stories to be packaged if it doesn't have Embargo
        action.package_item = !READONLY_STATES.includes(currentItem.state) &&
            !currentItem.embargo && (isPublished(currentItem) || !currentItem.publish_schedule);

        action.create_broadcast = _.includes([ITEM_STATE.PUBLISHED, ITEM_STATE.CORRECTED], currentItem.state) &&
            _.includes(['text', 'preformatted'], currentItem.type) &&
            !this._isBroadcastItem(currentItem) && userPrivileges.archive_broadcast;

        action.multi_edit = !isReadOnlyState;
    };

    // check for desk membership for edit rights and returns updated
    // actions accordingly
    this._updateDeskActions = function(currentItem, oldAction, userDesks) {
        let action = oldAction;
        let reWrite = action.re_write;
        let userPrivileges = privileges.privileges;

        if (currentItem.task && currentItem.task.desk) {
            // in production

            action.duplicate = userPrivileges.duplicate &&
                !CANCELED_STATES.includes(currentItem.state);

            action.add_to_current = !READONLY_STATES.includes(currentItem.state);

            var desk = _.find(userDesks, {_id: currentItem.task.desk});

            if (!desk) {
                action = angular.extend({}, helpers.DEFAULT_ACTIONS);
                // user can action `update` even if the user is not a member.
                action.re_write = reWrite;
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
            timezone || appConfig.defaultTimezone,
        );

        if (!schedule.isValid()) {
            return errors('timestamp');
        }

        if (schedule.isBefore(now)) {
            return errors('future');
        }
    };
}
