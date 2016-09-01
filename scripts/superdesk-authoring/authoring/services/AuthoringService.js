import * as helpers from 'superdesk-authoring/authoring/helpers';

AuthoringService.$inject = ['$q', '$location', 'api', 'lock', 'autosave', 'confirm', 'privileges',
                    'desks', 'superdeskFlags', 'notify', 'session', '$injector', 'moment', 'config'];
export function AuthoringService($q, $location, api, lock, autosave, confirm, privileges, desks, superdeskFlags,
                    notify, session, $injector, moment, config) {
    var self = this;

    //TODO: have to trap desk update event for refereshing users desks.
    this.userDesks = [];

    /**
     * Returns the default properties which should be picked from item before sending API Request for save/update.
     *
     * @returns {Object}
     */
    this.getContentFieldDefaults = function() {
        return helpers.CONTENT_FIELDS_DEFAULTS;
    };

    desks.fetchCurrentUserDesks().then(function(desks_list) {
        self.userDesks = desks_list._items;
    });

    /**
     * Open an item for editing
     *
     * @param {string} _id Item _id.
     * @param {boolean} read_only
     * @param {string} repo - repository where an item whose identifier is _id can be found.
     */
    this.open = function openAuthoring(_id, read_only, repo) {
        if ($location.$$path !== '/multiedit') {
            superdeskFlags.flags.authoring = true;
        }
        if (_.includes(['legal_archive', 'archived'], repo)) {
            return api.find(repo, _id).then(function(item) {
                item._editable = false;
                return item;
            });
        } else {
            return api.find('archive', _id, {embedded: {lock_user: 1}})
            .then(function _lock(item) {
                if (read_only) {
                    item._locked = lock.isLockedInCurrentSession(item);
                    item._editable = false;
                    return $q.when(item);
                } else { // we want to lock
                    if (lock.isLocked(item)) { // is locked by someone else
                        item._locked = false;
                        item._editable = false;
                        return $q.when(item);
                    } else if (lock.isLockedInCurrentSession(item)) { // we have lock
                        item._locked = true;
                        item._editable = true;
                        return $q.when(item);
                    } else { // not locked at all, try to lock
                        item._editable = true;
                        return lock.lock(item);
                    }
                }
            })
            .then(function _autosave(item) {
                return autosave.open(item);
            });
        }
    };

    this.rewrite = function (item) {
        var authoringWorkspace = $injector.get('authoringWorkspace');

        session.getIdentity()
            .then(function(user) {
                var updates = {
                    desk_id: desks.getCurrentDeskId() || item.task.desk
                };
                return api.save('archive_rewrite', {}, updates, item);
            })
            .then(function(new_item) {
                notify.success(gettext('Update Created.'));
                authoringWorkspace.edit(new_item._id);
            }, function(response) {
                if (angular.isDefined(response.data._message)) {
                    notify.error(gettext('Failed to generate update: ' + response.data._message));
                } else {
                    notify.error(gettext('There was an error. Failed to generate update.'));
                }
            });
    };

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
                        }), function() { // ignore saving
                            return $q.when('ignore');
                        });
                } else {
                    promise = $q.when('ignore');
                }
            }

            promise = promise.then(function unlock(cancelType) {
                if (cancelType && cancelType === 'ignore') {
                    autosave.drop(orig);
                }

                if (!closeItem){
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
                }), function() { // cancel
                    return false;
                });
        }

        return promise;
    };

    /**
     * Removes certain properties which are irrelevant for publish actions depending on the orig.item.state.
     * If not removed the API will throw errors.
     */
    this.cleanUpdatesBeforePublishing = function (original, updates) {
        if (!updates.publish_schedule) {
            delete updates.publish_schedule;
        }

        if (this.isPublished(original)) {
            delete updates.dateline;
        }

        //check if rendition is dirty for real
        if (_.isEqual(original.renditions, updates.renditions)) {
            delete updates.renditions;
        }

        // Remove sign off from update (if it is not mapped), it will get the publishing user appended in the backend
        if (updates.sign_off && !(config.user && config.user.sign_off_mapping)) {
            delete updates.sign_off;
        }

        helpers.stripHtml(updates);

        // If the text equivalent of the body_html is empty then set the body empty
        if (angular.isDefined(updates.body_html)) {
            var elem = document.createElement('div');
            elem.innerHTML = updates.body_html;
            if (elem.textContent === '') {
                updates.body_html = '';
            }
        }

    };

    this.publish = function publish(orig, diff, action) {
        action = action || 'publish';
        diff = helpers.extendItem({}, diff);
        this.cleanUpdatesBeforePublishing(orig, diff);
        helpers.filterDefaultValues(diff, orig);
        var endpoint = 'archive_' + action;
        return api.update(endpoint, orig, diff)
        .then(function(result) {
            return lock.unlock(result)
                .then(function(result) {
                    return result;
                });
        }, function(response) {
            return response;
        });
    };

    this.validateBeforeTansa = function (orig, diff) {
        diff = helpers.extendItem({}, diff);

        this.cleanUpdatesBeforePublishing(orig, diff);

        return api.save('validate', {'act': 'publish', 'type': orig.type, 'validate': diff});
    };

    this.saveWorkConfirmation = function saveWorkAuthoring(orig, diff, isDirty, message) {
        var promise = $q.when();
        if (isDirty) {
            if (this.isEditable(diff)) {
                promise = confirm.confirmSaveWork(message)
                    .then(angular.bind(this, function save() {
                        return this.saveWork(orig, diff);
                    }), function(err) { // cancel
                        return $q.when();
                    });
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
    this.autosave = function autosaveAuthoring(item, orig) {
        return autosave.save(item, orig);
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
            angular.forEach(_.keys(diff), function(key) {
                if (_.isEqual(diff[key], origItem[key])) {
                    delete diff[key];
                }
            });
        }

        helpers.stripHtml(diff);
        autosave.stop(item);

        if (diff._etag) { // make sure we use orig item etag
            delete diff._etag;
        }

        helpers.filterDefaultValues(diff, origItem);

        if (_.size(diff) > 0) {
            return api.save('archive', origItem, diff).then(function(_item) {
                origItem._autosave = null;
                origItem._autosaved = false;
                origItem._locked = lock.isLockedInCurrentSession(item);
                $injector.get('authoringWorkspace').update(origItem);
                return origItem;
            });
        } else {
            if (origItem) {
                // if there is nothing to save. No diff.
                origItem._autosave = null;
                origItem._autosaved = false;
            }
            return $q.when(origItem);
        }
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
        return api.save('archive', {}, diff).then(function(_item) {
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
     * Test if an item is published
     *
     * @param {Object} item
     */
    this.isPublished = function isPublished(item) {
        return _.includes(['published', 'killed', 'scheduled', 'corrected'], item.state);
    };

    /**
     * Unlock an item - callback for item:unlock event
     *
     * @param {Object} item
     * @param {string} userId
     */
    this.unlock = function unlock(item, userId, headline) {
        autosave.stop(item);
        item.lock_session = null;
        item.lock_user = null;
        item._locked = false;
        confirm.unlock(userId, headline);
    };

    /**
     * Lock an item - callback for item:lock event
     *
     * @param {Object} item
     * @param {string} userId
     */
    this.lock = function lock(item, userId) {
        autosave.stop(item);
        api.find('users', userId).then(function(user) {
            item.lock_user = user;
        }, function(rejection) {
            item.lock_user = userId;
        });
        item._locked = true;
    };

    /**
    * Link an item for takes.
    * @param {Object} item : Target Item
    * @param {string} [link_id]: If not provider it returns the new Linked item.
    * @param {string} [desk]: Desk for newly create item.
    */
    this.linkItem = function link(item, link_id, desk) {
        var data = {};
        if (link_id) {
            data.link_id = link_id;
        }

        if (desk) {
            data.desk = desk;
        }

        return api.save('archive_link', {}, data, item);
    };

    /**
    * Actions that it can perform on an item
    * @param {Object} item : item
    */
    this.itemActions = function(item) {
        var current_item = item && item.archive_item && item.archive_item.state ? item.archive_item : item;
        var user_privileges = privileges.privileges;
        var action = angular.extend({}, helpers.DEFAULT_ACTIONS);
        var itemOnReadOnlyStage = item && item.task && item.task.stage && desks.isReadOnlyStage(item.task.stage);

        // takes packages are readonly.
        // killed item and item that have last publish action are readonly
        if ((angular.isUndefined(current_item) || angular.isUndefined(user_privileges)) ||
            (current_item.state === 'killed') ||
            itemOnReadOnlyStage ||
            (angular.isDefined(current_item.takes) && current_item.takes.state === 'killed') ||
            (current_item._type && current_item._type === 'archived')) {
            return action;
        }

        var digital_package = (angular.isDefined(current_item.package_type) &&
                            current_item.package_type === 'takes');
        var is_read_only_state = _.includes(['spiked', 'scheduled', 'killed'], current_item.state) ||
                                digital_package;

        var lockedByMe = !lock.isLocked(current_item);
        action.view = !lockedByMe;

        var isBroadcast = current_item.genre && current_item.genre.length > 0 &&
                          _.includes(['text', 'preformatted'], current_item.type) &&
                          current_item.genre.some(nameIsBroadcast);

        function nameIsBroadcast(genre) {
            return genre.name === 'Broadcast Script';
        }

        // new take should be on the text item that are closed or last take but not killed and doesn't have embargo.
        var new_take = !is_read_only_state && current_item.type === 'text' &&
            !current_item.embargo && current_item._current_version > 0 &&
            (this.isPublished(current_item) || !current_item.publish_schedule) &&
            (angular.isUndefined(current_item.takes) || current_item.takes.last_take === current_item._id) &&
            !isBroadcast &&
            !current_item.rewritten_by;

        action.new_take = new_take;

        // item is published state - corrected, published, scheduled, killed
        if (self.isPublished(current_item)) {
            //if not the last published version
            if (angular.isDefined(item.archive_item) &&
                item._current_version !== item.archive_item._current_version) {
                return angular.extend({}, helpers.DEFAULT_ACTIONS);
            }

            action.view = true;
            if (current_item.state === 'scheduled' && !digital_package) {
                action.deschedule = true;
            } else if (current_item.state === 'published' || current_item.state === 'corrected') {
                action.kill = user_privileges.kill && lockedByMe && !is_read_only_state;
                action.correct = user_privileges.correct && lockedByMe && !is_read_only_state;
            }

        } else {
            // production states i.e in_progress, routed, fetched, submitted.

            //if spiked
            if (current_item.state === 'spiked') {
                action = angular.extend({}, helpers.DEFAULT_ACTIONS);
                action.unspike = true;
                return action;
            }

            action.save = current_item.state !== 'spiked';
            action.publish = (!current_item.flags || !current_item.flags.marked_for_not_publication) &&
                    current_item.task && current_item.task.desk &&
                    (!current_item.highlight || current_item.type !== 'composite') &&
                    user_privileges.publish && current_item.state !== 'draft';

            action.edit = !(current_item.type === 'composite' && current_item.package_type === 'takes') &&
                            current_item.state !== 'spiked' && lockedByMe;
            action.unspike = current_item.state === 'spiked' && user_privileges.unspike;
            action.spike = current_item.state !== 'spiked' && user_privileges.spike &&
                (angular.isUndefined(current_item.takes) || current_item.takes.last_take === current_item._id);
            action.send = current_item._current_version > 0 && user_privileges.move;
        }

        action.re_write = !is_read_only_state && _.includes(['text'], current_item.type) &&
            !current_item.embargo && !current_item.rewritten_by && action.new_take &&
            (!current_item.broadcast || !current_item.broadcast.master_id) &&
            (!current_item.rewrite_of || (current_item.rewrite_of && this.isPublished(current_item)));
        var re_write = action.re_write;

        action.resend = _.includes(['text'], current_item.type) &&
            _.includes(['published', 'corrected', 'killed'], current_item.state);

        //mark item for highlights
        action.mark_item = (current_item.task && current_item.task.desk &&
            !is_read_only_state && current_item.package_type !== 'takes' &&
             user_privileges.mark_for_highlights);

        // allow all stories to be packaged if it doesn't have Embargo
        action.package_item = !_.includes(['spiked', 'scheduled', 'killed'], current_item.state) &&
            !current_item.embargo && current_item.package_type !== 'takes' &&
            (this.isPublished(current_item) || !current_item.publish_schedule);

        action.create_broadcast = (_.includes(['published', 'corrected'], current_item.state)) &&
            _.includes(['text', 'preformatted'], current_item.type) &&
            !isBroadcast && user_privileges.archive_broadcast;

        action.multi_edit = !is_read_only_state;

        //check for desk membership for edit rights.
        if (current_item.task && current_item.task.desk) {
            // in production

            action.duplicate = user_privileges.duplicate &&
                !_.includes(['spiked', 'killed'], current_item.state) &&
                (angular.isUndefined(current_item.package_type) || current_item.package_type !== 'takes');

            action.add_to_current = !_.includes(['spiked', 'scheduled', 'killed'], current_item.state);

            var desk = _.find(self.userDesks, {'_id': current_item.task.desk});
            if (!desk) {
                action = angular.extend({}, helpers.DEFAULT_ACTIONS);
                // user can action `update` even if the user is not a member.
                action.re_write = re_write;
                action.new_take = new_take;
            }
        } else {
            // personal
            action.copy = true;
            action.view = false;
            action.package_item = false;
            action.new_take = false;
            action.re_write = false;
        }

        return action;
    };

    /**
     * Check whether the item is a Take or not.
     * @param {object} item
     * @returns {boolean} True if a "Valid Take" else False
     */
    this.isTakeItem = function(item) {
        return (_.includes(['text'], item.type) &&
            item.takes && item.takes.sequence > 1);
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
            timestamp.replace('+0000', ''), // in case timestamp made it to server, it will be with tz, ignore it
            timezone || config.defaultTimezone
        );

        if (!schedule.isValid()) {
            return errors('timestamp');
        }

        if (schedule.isBefore(now)) {
            return errors('future');
        }
    };
}
