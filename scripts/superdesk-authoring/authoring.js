(function() {
    'use strict';

    var CONTENT_FIELDS_DEFAULTS = Object.freeze({
        headline: '',
        slugline: '',
        body_html: null,
        'abstract': null,
        anpa_take_key: null,
        byline: null,
        urgency: null,
        priority: null,
        subject: [],
        'anpa_category': [],
        genre: [],
        groups: [],
        usageterms: null,
        ednote: null,
        place: [],
        located: null,
        dateline: null,
        language: null,
        unique_name: '',
        keywords: [],
        description_text: null,
        sign_off: null,
        publish_schedule: null,
        flags: null,
        pubstatus: null,
        more_coming: false,
        target_regions: [],
        target_types: [],
        target_subscribers: [],
        embargo: null,
        renditions: null,
        associations: null,
        body_footer: null,
        company_codes: [],
        schedule_settings: null,
        sms_message: null,
        poi: {}
    });

    var DEFAULT_ACTIONS = Object.freeze({
        publish: false,
        correct: false,
        kill: false,
        deschedule: false,
        new_take: false,
        re_write: false,
        save: false,
        edit: false,
        mark_item: false,
        duplicate: false,
        copy: false,
        view: true,
        spike: false,
        unspike: false,
        package_item: false,
        multi_edit: false,
        send: false,
        create_broadcast: false,
        add_to_current: false,
        resend: false
    });

    // http://docs.python-cerberus.org/en/stable/usage.html
    var DEFAULT_SCHEMA = Object.freeze({
        slugline: {maxlength: 24},
        relatedItems: {},
        genre: {},
        anpa_take_key: {},
        place: {},
        priority: {},
        urgency: {},
        anpa_category: {},
        subject: {},
        company_codes: {},
        ednote: {},
        headline: {maxlength: 64},
        sms: {maxlength: 160},
        abstract: {maxlength: 160},
        body_html: {},
        byline: {},
        dateline: {},
        located: {},
        sign_off: {},
        footer: {},
        body_footer: {},
        media: {},
        media_description: {}
    });

    var DEFAULT_EDITOR = Object.freeze({
        slugline: {order: 1, sdWidth: 'full'},
        genre: {order: 2, sdWidth: 'half'},
        anpa_take_key: {order: 3, sdWidth: 'half'},
        place: {order: 4, sdWidth: 'half'},
        priority: {order: 5, sdWidth: 'quarter'},
        urgency: {order: 6, sdWidth: 'quarter'},
        anpa_category: {order: 7, sdWidth: 'full'},
        subject: {order: 8, sdWidth: 'full'},
        company_codes: {order: 9, sdWidth: 'full'},
        ednote: {order: 10, sdWidth: 'full'},
        headline: {order: 11, formatOptions: ['underline', 'anchor', 'bold', 'removeFormat']},
        sms: {order: 12},
        abstract: {order: 13, formatOptions: ['bold', 'italic', 'underline', 'anchor', 'removeFormat']},
        byline: {order: 14},
        dateline: {order: 15},
        body_html: {
            order: 16,
            formatOptions: ['h2', 'bold', 'italic', 'underline', 'quote', 'anchor', 'embed', 'picture', 'removeFormat']
        },
        footer: {order: 17},
        body_footer: {order: 18},
        sign_off: {order: 19},
        located: {},
        media: {},
        media_description: {}
    });

    /**
     * Extend content of dest
     *
     * @param {Object} dest
     * @param {Object} src
     */
    function extendItem(dest, src) {
        return angular.extend(dest, _.pick(src, _.keys(CONTENT_FIELDS_DEFAULTS)));
    }

    function stripHtmlRaw(content) {
        if (content) {
            var elem = document.createElement('div');
            elem.innerHTML = content;
            return elem.textContent;
        }
        return '';
    }

    function stripHtml(item) {
        var fields = ['headline'];
        _.each(fields, function(key) {
            if (angular.isDefined(item[key])) {
                item[key] = stripHtmlRaw(item[key]);
            }
        });
    }

    /**
     * Extend content of dest by forcing 'default' values
     * if the value doesn't exist in src
     *
     * @param {Object} dest
     * @param {Object} src
     */
    function forcedExtend(dest, src) {
        _.each(CONTENT_FIELDS_DEFAULTS, function(value, key) {
            if (dest[key]) {
                if (src[key]) {
                    dest[key] = src[key];
                } else {
                    dest[key] = value;
                }
            } else {
                if (src[key]) {
                    dest[key] = src[key];
                }
            }
        });
    }

    AutosaveService.$inject = ['$q', '$timeout', 'api'];
    function AutosaveService($q, $timeout, api) {
        var RESOURCE = 'archive_autosave',
            AUTOSAVE_TIMEOUT = 3000,
            timeouts = {},
            self = this;

        /**
         * Open an item
         */
        this.open = function openAutosave(item) {
            if (item._locked || !item._editable) {
                // no way to get autosave
                return $q.when(item);
            }

            return self.get(item)
                .then(function(result) {
                    return result;
                }, function(err) {
                    return item;
                });
        };

        /**
         * Get the resource
         */
        this.get = function(item) {
            return api.find(RESOURCE, item._id).then(function(autosave) {
                item._autosave = autosave;
                return item;
            });
        };

        /**
         * Auto-saves an item
         */
        this.save = function saveAutosave(item) {
            if (item._editable && item._locked) {
                this.stop(item);
                timeouts[item._id] = $timeout(function() {
                    var diff = extendItem({_id: item._id}, item);
                    return api.save(RESOURCE, {}, diff).then(function(_autosave) {
                        var orig = Object.getPrototypeOf(item);
                        orig._autosave = _autosave;
                    });
                }, AUTOSAVE_TIMEOUT);

                return timeouts[item._id];
            }
        };

        /**
         * Stop pending autosave
         */
        this.stop = function stopAutosave(item) {
            if (timeouts[item._id]) {
                $timeout.cancel(timeouts[item._id]);
                timeouts[item._id] = null;
            }
        };

        /**
         * Drop autosave
         */
        this.drop = function dropAutosave(item) {
            this.stop(item);

            if (angular.isDefined(item._autosave) && item._autosave !== null) {
                api(RESOURCE).remove(item._autosave);
            }

            item._autosave = null;
        };
    }

    AuthoringService.$inject = ['$q', '$location', 'api', 'lock', 'autosave', 'confirm', 'privileges',
                        'desks', 'superdeskFlags', 'notify', 'session', '$injector'];
    function AuthoringService($q, $location, api, lock, autosave, confirm, privileges, desks, superdeskFlags,
                        notify, session, $injector) {
        var self = this;

        this.limits = {
            slugline: 24,
            headline: 64,
            'abstract': 160
        };

        //TODO: have to trap desk update event for refereshing users desks.
        this.userDesks = [];

        /**
         * Returns the default properties which should be picked from item before sending API Request for save/update.
         *
         * @returns {Object}
         */
        this.getContentFieldDefaults = function() {
            return CONTENT_FIELDS_DEFAULTS;
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
            if (_.contains(['legal_archive', 'archived'], repo)) {
                return api.find(repo, _id).then(function(item) {
                    item._editable = false;
                    return item;
                });
            } else {
                return api.find('archive', _id, {embedded: {lock_user: 1}})
                .then(function _lock(item) {
                    if (!read_only && lock.isLocked(item)) {  // Check if item is still editable
                        item._locked = true;
                        item._editable = false;
                        return $q.when(item);
                    } else {
                        item._editable = !read_only;
                        return lock.lock(item);
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
                    return api.save('archive_rewrite', {}, {}, item);
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
                //content item just created and no change -> it will be deleted
                if (!isDirty && orig.state === 'draft' && orig._current_version === 1) {

                    promise = confirm.confirmClose()
                        .then(angular.bind(this, function save() {
                            //force a fake change
                            diff.body_html = (diff.body_html || orig.body_html || '') + ' ';
                            return this.save(orig, diff);
                        }), function() { // ignore saving
                            return $q.when('ignore');
                        });
                }

                if (isDirty) {
                    if (!_.contains(['published', 'corrected'], orig.state)) {
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

            stripHtml(updates);

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
            diff = extendItem({}, diff);

            this.cleanUpdatesBeforePublishing(orig, diff);

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
         */
        this.autosave = function autosaveAuthoring(item) {
            return autosave.save(item);
        };

        /**
         * Save the item
         *
         * @param {Object} origItem
         * @param {Object} item
         */
        this.save = function saveAuthoring(origItem, item) {
            var diff = extendItem({}, item);
            // Finding if all the keys are dirty for real
            if (angular.isDefined(origItem)) {
                angular.forEach(_.keys(diff), function(key) {
                    if (_.isEqual(diff[key], origItem[key])) {
                        delete diff[key];
                    }
                });
            }

            stripHtml(diff);
            autosave.stop(item);

            if (_.size(diff) > 0) {
                return api.save('archive', item, diff).then(function(_item) {
                    item._autosave = null;
                    item._locked = lock.isLocked(item);
                    return item;
                });
            } else {
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
            var diff = extendItem(_orig, _diff);
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
            return !!item.lock_user && !lock.isLocked(item);
        };

        /**
         * Test if an item is published
         *
         * @param {Object} item
         */
        this.isPublished = function isPublished(item) {
            return _.contains(['published', 'killed', 'scheduled', 'corrected'], item.state);
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
            var action = angular.extend({}, DEFAULT_ACTIONS);

            // takes packages are readonly.
            // killed item and item that have last publish action are readonly
            if ((angular.isUndefined(current_item) || angular.isUndefined(user_privileges)) ||
                (current_item.state === 'killed') ||
                (angular.isDefined(current_item.takes) && current_item.takes.state === 'killed') ||
                (current_item._type && current_item._type === 'archived')) {
                return action;
            }

            var digital_package = (angular.isDefined(current_item.package_type) &&
                                current_item.package_type === 'takes');
            var is_read_only_state = _.contains(['spiked', 'scheduled', 'killed'], current_item.state) ||
                                    digital_package;

            var lockedByMe = !lock.isLocked(current_item);
            action.view = !lockedByMe;

            var isBroadcast = current_item.genre && current_item.genre.length > 0 &&
                              _.contains(['text', 'preformatted'], current_item.type) &&
                              current_item.genre.some(nameIsBroadcast);

            function nameIsBroadcast(genre) {
                return genre.name === 'Broadcast Script';
            }

            // new take should be on the text item that are closed or last take but not killed and doesn't have embargo.
            action.new_take = !is_read_only_state && current_item.type === 'text' &&
                !current_item.embargo && (this.isPublished(current_item) || !current_item.publish_schedule) &&
                (angular.isUndefined(current_item.takes) || current_item.takes.last_take === current_item._id) &&
                (angular.isUndefined(current_item.more_coming) || !current_item.more_coming) && !isBroadcast &&
                !current_item.rewritten_by;

            // item is published state - corrected, published, scheduled, killed
            if (self.isPublished(current_item)) {
                //if not the last published version
                if (angular.isDefined(item.archive_item) &&
                    item._current_version !== item.archive_item._current_version) {
                    return angular.extend({}, DEFAULT_ACTIONS);
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
                    action = angular.extend({}, DEFAULT_ACTIONS);
                    action.unspike = true;
                    return action;
                }

                action.save = current_item.state !== 'spiked';
                action.publish = (!current_item.flags || !current_item.flags.marked_for_not_publication) &&
                        current_item.task && current_item.task.desk &&
                        user_privileges.publish && current_item.state !== 'draft';

                action.edit = !(current_item.type === 'composite' && current_item.package_type === 'takes') &&
                                current_item.state !== 'spiked' && lockedByMe;
                action.unspike = current_item.state === 'spiked' && user_privileges.unspike;
                action.spike = current_item.state !== 'spiked' && user_privileges.spike &&
                    (angular.isUndefined(current_item.takes) || current_item.takes.last_take === current_item._id);
                action.send = current_item._current_version > 0 && user_privileges.move;
            }

            action.re_write = !is_read_only_state && _.contains(['text'], current_item.type) &&
                !current_item.embargo && !current_item.rewritten_by && action.new_take &&
                (!current_item.broadcast || !current_item.broadcast.master_id);

            action.resend = _.contains(['text'], current_item.type) && !current_item.rewritten_by &&
                _.contains(['published', 'corrected', 'killed'], current_item.state);

            //mark item for highlights
            action.mark_item = (current_item.task && current_item.task.desk &&
                !is_read_only_state && current_item.package_type !== 'takes' &&
                 user_privileges.mark_for_highlights);

            // allow all stories to be packaged if it doesn't have Embargo
            action.package_item = !_.contains(['spiked', 'scheduled', 'killed'], current_item.state) &&
                !current_item.embargo && current_item.package_type !== 'takes' &&
                (this.isPublished(current_item) || !current_item.publish_schedule);

            action.create_broadcast = (_.contains(['published', 'corrected'], current_item.state)) &&
                _.contains(['text', 'preformatted'], current_item.type) &&
                !isBroadcast && user_privileges.archive_broadcast;

            action.multi_edit = !is_read_only_state;

            //check for desk membership for edit rights.
            if (current_item.task && current_item.task.desk) {
                // in production

                action.duplicate = user_privileges.duplicate &&
                    !_.contains(['spiked', 'killed'], current_item.state) &&
                    (angular.isUndefined(current_item.package_type) || current_item.package_type !== 'takes');

                action.add_to_current = !_.contains(['spiked', 'scheduled', 'killed'], current_item.state);

                var desk = _.find(self.userDesks, {'_id': current_item.task.desk});
                if (!desk) {
                    action = angular.extend({}, DEFAULT_ACTIONS);
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
            return (_.contains(['text'], item.type) &&
                item.takes && item.takes.sequence > 1);
        };
    }

    LockService.$inject = ['$q', 'api', 'session', 'privileges', 'notify'];
    function LockService($q, api, session, privileges, notify) {
        /**
         * Lock an item
         */
        this.lock = function lock(item, force) {
            if ((!item.lock_user && item._editable) || force) {
                return api.save('archive_lock', {}, {}, item).then(function(lock) {
                    _.extend(item, lock);
                    item._locked = true;
                    item.lock_user = session.identity._id;
                    item.lock_session = session.sessionId;
                    return item;
                }, function(err) {
                    notify.error(gettext('Failed to get a lock on the item!'));
                    item._locked = false;
                    item._editable = false;
                    return item;
                });
            } else {
                item._locked = this.isLocked(item);
                return $q.when(item);
            }
        };

        /**
         * Unlock an item
         */
        this.unlock = function unlock(item) {
            return api('archive_unlock', item).save({}).then(function(lock) {
                _.extend(item, lock);
                item._locked = false;
                return item;
            }, function(err) {
                item._locked = true;
                return item;
            });
        };

        /**
         * Test if an item is locked, it can be locked by other user or you in different session.
         */
        this.isLocked = function isLocked(item) {
            var userId = getLockedUserId(item);

            if (!userId) {
                return false;
            }

            if (userId !== session.identity._id) {
                return true;
            }

            if (!!item.lock_session && item.lock_session !== session.sessionId) {
                return true;
            }

            return false;
        };

        function getLockedUserId(item) {
            return item.lock_user && item.lock_user._id || item.lock_user;
        }

        /**
        * Test if an item is locked by me in another session
        */
        this.isLockedByMe = function isLockedByMe(item) {
            var userId = getLockedUserId(item);
            return userId && userId === session.identity._id;
        };

        /**
        * can unlock the item or not.
        */
        this.can_unlock = function can_unlock(item) {
            if (this.isLockedByMe(item)) {
                return true;
            } else {
                return privileges.privileges.unlock;
            }
        };
    }

    ConfirmDirtyService.$inject = ['$window', '$q', '$filter', 'api', 'modal', 'gettextCatalog', '$interpolate'];
    function ConfirmDirtyService($window, $q, $filter, api, modal, gettextCatalog, $interpolate) {
        /**
         * Will ask for user confirmation for user confirmation if there are some changes which are not saved.
         * - Detecting changes via $scope.dirty - it's up to the controller to set it.
         */
        this.setupWindow = function setupWindow($scope) {
            $window.onbeforeunload = function() {
                if ($scope.dirty) {
                    return gettextCatalog.getString('There are unsaved changes. If you navigate away, your changes will be lost.');
                }

                $scope.$on('$destroy', function() {
                    $window.onbeforeunload = angular.noop;
                });
            };
        };

        /**
         * Called from workqueue in case of unsaved changes.
         */
        this.reopen = function () {
            return modal.confirm(
                gettextCatalog.getString('There are some unsaved changes, re-open the article to save changes?'),
                gettextCatalog.getString('Save changes?'),
                gettextCatalog.getString('Re-Open'),
                gettextCatalog.getString('Ignore'),
                gettextCatalog.getString('Cancel')
            );
        };

        /**
         * In case $scope is dirty ask user if he want's to loose his changes.
         */
        this.confirm = function confirm() {
            return modal.confirm(
                gettextCatalog.getString('There are some unsaved changes, do you want to save it now?'),
                gettextCatalog.getString('Save changes?'),
                gettextCatalog.getString('Save'),
                gettextCatalog.getString('Ignore'),
                gettextCatalog.getString('Cancel')
            );
        };

        /**
         * In case the item version has just been created the user is asked if wants to save the document.
         */
        this.confirmClose = function confirm() {
            return modal.confirm(
                gettextCatalog.getString('Do you want to save newly created content item?'),
                gettextCatalog.getString('Save content item?'),
                gettextCatalog.getString('Save'),
                gettextCatalog.getString('Ignore'),
                gettextCatalog.getString('Cancel')
            );
        };

        /**
         * In case $scope is dirty ask user if he want's to save changes and publish.
         */
        this.confirmPublish = function confirmPublish(action) {
            return modal.confirm(
                $interpolate(gettextCatalog.getString('There are some unsaved changes, do you want to save it and {{ action }} now?'))
                ({action: action}),
                gettextCatalog.getString('Save changes?'),
                $interpolate(gettextCatalog.getString('Save and {{ action }}'))({action: action}),
                gettextCatalog.getString('Cancel')
            );
        };

        /**
         * In case $scope is dirty ask user if he want's to save changes and publish.
         */
        this.confirmSendTo = function confirmSendTo(action) {
            return modal.confirm(
                $interpolate(gettextCatalog.getString('There are some unsaved changes, do you want to save it and {{ action }} now?'))
                ({action: action}),
                gettextCatalog.getString('Save changes?'),
                $interpolate(gettextCatalog.getString('Save and {{ action }}'))({action: action}),
                gettextCatalog.getString('Cancel')
            );
        };

        this.confirmSaveWork = function confirmSavework(msg) {
            return modal.confirm(
                $interpolate(
                    gettextCatalog.getString('Configuration has changed. {{ message }} Would you like to save the story to your workspace?')
                )
                ({message: msg})
            );
        };

        this.confirmSpellcheck = function confirmSpellcheck(msg) {
            var mistakes = msg > 1?'mistakes':'mistake';
            var confirmMessage = 'You have {{ message }} spelling {{ mistakes }}. Are you sure you want to continue?';
            return modal.confirm($interpolate(gettextCatalog.getString(confirmMessage))({message: msg, mistakes: mistakes}));
        };

        /**
         * Make user aware that an item was unlocked
         *
         * @param {string} userId Id of user who unlocked an item.
         * @param {string} headline Headline of item which is unlocked
         */
        this.unlock = function unlock(userId, headline) {
            api.find('users', userId).then(function(user) {
                var itemHeading = headline ? 'Item <b>' + headline + '</b>' : 'This item';
                var msg = gettext(itemHeading + ' was unlocked by <b>' + $filter('username')(user) + '</b>.');
                return modal.confirm(msg, gettextCatalog.getString('Item Unlocked'), gettextCatalog.getString('OK'), false);
            });
        };

        /**
         * Make user aware that an item was locked
         *
         * @param {string} userId Id of user who locked an item.
         */
        this.lock = function lock(userId) {
            api.find('users', userId).then(function(user) {
                var msg = gettextCatalog.getString('This item was locked by <b>' +  $filter('username')(user) + '</b>.');
                return modal.confirm(msg, gettextCatalog.getString('Item locked'), gettext('OK'), false);
            });
        };
    }

    ChangeImageController.$inject = ['$scope', 'gettext', 'notify', 'modal', '$q', 'lodash'];
    function ChangeImageController($scope, gettext, notify, modal, $q, _) {
        $scope.data = $scope.locals.data;
        $scope.data.cropData = {};
        var sizes = {};
        $scope.data.renditions.forEach(function(rendition) {
            sizes[rendition.name] = {width: rendition.width, height: rendition.height};
            $scope.data.cropData[rendition.name] = angular.extend({}, $scope.data.item.renditions[rendition.name]);
        });
        var poiOrig = angular.extend({}, $scope.data.poi);
        $scope.data.isDirty = false;
        // should show the metadata form in the view
        $scope.data.showMetadataEditor = $scope.data.showMetadataEditor === true;
        // initialize metadata from `item`
        $scope.data.metadata = angular.copy($scope.data.item);
        $scope.selectedRendition = null;

        $scope.selectRendition = function(rendition) {
            if (!rendition) {
                $scope.selectedRendition = null;
            } else if ($scope.selectedRendition === null || $scope.selectedRendition.name !== rendition.name) {
                $scope.selectedRendition = rendition;
            }
        };

        /*
        * Records the coordinates for each crop sizes available and
        * notify the user and then resolve the activity.
        */
        $scope.done = function() {
            /* Throw an exception if PoI is outisde of a crop */
            function poiIsInsideEachCrop() {
                var originalImage = $scope.data.metadata.renditions.original;
                var originalPoi = {x: originalImage.width * $scope.data.poi.x, y: originalImage.height * $scope.data.poi.y};
                _.forEach($scope.data.cropData, function(cropData, cropName) {
                    if (originalPoi.y < cropData.CropTop ||
                        originalPoi.y > cropData.CropBottom ||
                        originalPoi.x < cropData.CropLeft ||
                        originalPoi.x > cropData.CropRight) {
                        throw gettext('Point of interest outside the crop ' + cropName + ' limits');
                    }
                });
            }
            // check if data are valid
            try {
                poiIsInsideEachCrop();
            } catch (e) {
                // show an error and stop the "done" operation
                notify.error(e);
                return false;
            }
            if ($scope.data.showMetadataEditor) {
                // update metadata in `item`
                angular.extend($scope.data.item, $scope.data.metadata);
            }
            $scope.data.item.poi = $scope.data.poi;
            notify.success(gettext('Crop changes have been recorded'));
            $scope.resolve({cropData: $scope.data.cropData, poi: $scope.data.poi});
        };

        $scope.close = function() {
            if ($scope.data.isDirty) {
                modal.confirm(gettext('You have unsaved changes, do you want to continue?'))
                .then(function() { // Ok = continue w/o saving
                    angular.extend($scope.data.poi, poiOrig);
                    return $scope.reject();
                });
            } else {
                $scope.reject();
            }
        };

        $scope.onChange = function(renditionName, cropData) {
            $scope.$apply(function() {
                $scope.data.cropData[renditionName] = angular.extend({}, cropData, sizes[renditionName]);
                $scope.data.isDirty = true;
            });
        };
    }

    AuthoringController.$inject = ['$scope', 'item', 'action', 'superdesk'];
    function AuthoringController($scope, item, action, superdesk) {
        $scope.origItem = item;
        $scope.action = action || 'edit';

        $scope.lock = function() {
            superdesk.intent('author', 'article', item);
        };
    }

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
        '$rootScope'
    ];
    function AuthoringDirective(superdesk, superdeskFlags, authoringWorkspace, notify, gettext, desks, authoring, api, session, lock,
            privileges, content, $location, referrer, macros, $timeout, $q, modal, archiveService, confirm, reloadService, $rootScope) {
        return {
            link: function($scope, elem, attrs) {
                var _closing;

                $scope.privileges = privileges.privileges;
                $scope.dirty = false;
                $scope.views = {send: false};
                $scope.stage = null;
                $scope._editable = !!$scope.origItem._editable;
                $scope.isMediaType = _.contains(['audio', 'video', 'picture'], $scope.origItem.type);
                $scope.action = $scope.action || ($scope._editable ? 'edit' : 'view');
                $scope.itemActions = authoring.itemActions($scope.origItem);
                $scope.highlight = !!$scope.origItem.highlight;

                $scope.$watch('origItem', function(new_value, old_value) {
                    $scope.itemActions = null;
                    if (new_value) {
                        $scope.itemActions = authoring.itemActions(new_value);
                    }
                }, true);

                $scope._isInProductionStates = !authoring.isPublished($scope.origItem);
                $scope.origItem.sign_off = $scope.origItem.sign_off || $scope.origItem.version_creator;

                $scope.$watch('item.flags', function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        $scope.item.flags = _.clone($scope.origItem.flags);
                        $scope.item.flags = newValue;
                        $scope.origItem.flags = oldValue;
                        $scope.dirty = true;

                        if (newValue.marked_for_sms && !oldValue.marked_for_sms &&
                            !$scope.item.sms_message && $scope.item.headline) {
                            $scope.item.sms_message = $scope.item.headline;
                        }
                    }
                }, true);

                $scope.fullPreview = false;
                $scope.fullPreviewUrl = '/#/preview/' + $scope.origItem._id;
                $scope.proofread = false;
                $scope.referrerUrl = referrer.getReferrerUrl();

                if ($scope.origItem.task && $scope.origItem.task.stage) {
                    if (archiveService.isLegal($scope.origItem)) {
                        $scope.deskName = $scope.origItem.task.desk;
                        $scope.stage = $scope.origItem.task.stage;
                    } else {
                        api('stages').getById($scope.origItem.task.stage)
                            .then(function(result) {
                                $scope.stage = result;
                            });

                        desks.fetchDeskById($scope.origItem.task.desk).then(function (desk) {
                            $scope.deskName = desk.name;
                        });
                    }
                }

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
                    return authoring.save($scope.origItem, $scope.item).then(function(res) {
                        $scope.origItem = res;
                        $scope.dirty = false;
                        $scope.item = _.create($scope.origItem);

                        if (res.cropData) {
                            $scope.item.hasCrops = true;
                        }

                        if (res.highlight) {
                            _previewHighlight(res._id);
                        }

                        notify.success(gettext('Item updated.'));
                        return $scope.origItem;
                    }, function(response) {
                        if (angular.isDefined(response.data._issues)) {
                            if (angular.isDefined(response.data._issues.unique_name) &&
                                response.data._issues.unique_name.unique === 1) {
                                notify.error(gettext('Error: Unique Name is not unique.'));
                            } else if (angular.isDefined(response.data._issues['validator exception'])) {
                                notify.error(gettext('Error: ' + response.data._issues['validator exception']));
                            }
                        } else if (response.status === 412) {
                            notifyPreconditionFailed();
                        } else {
                            notify.error(gettext('Error. Item not updated.'));
                        }
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
                            .then(function() {
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
                    api.generate_highlights.save({}, {'package': _id})
                    .then(authoringWorkspace.edit, function(response) {
                        if (response.status === 403) {
                            _forceExportHighlight(_id);
                        } else {
                            notify.error(gettext('Error creating highlight.'));
                        }
                    });
                }

                function _forceExportHighlight(_id) {
                    modal.confirm(gettext('There are items locked or not published. Do you want to continue?'))
                        .then(function() {
                            api.generate_highlights.save({}, {'package': _id, 'export': true})
                            .then(authoringWorkspace.edit, function(response) {
                                notify.error(gettext('Error creating highlight.'));
                            });
                        });
                }

                function _previewHighlight(_id) {
                    api.generate_highlights.save({}, {'package': _id, 'preview': true})
                    .then(function(response) {
                        $scope.highlight_preview = response.body_html;
                    }, function(data) {
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
                function validateTimestamp(datePartOfTS, timePartOfTS, timestamp, fieldName) {
                    var errorMessage = '';

                    if (datePartOfTS && !timePartOfTS) {
                        errorMessage = gettext(fieldName + ' time is invalid!');
                    } else if (timePartOfTS && !datePartOfTS) {
                        errorMessage = gettext(fieldName + ' date is invalid!');
                    }

                    if (errorMessage === '' && timestamp) {
                        var schedule = new Date(timestamp);

                        if (!_.isDate(schedule)) {
                            errorMessage = gettext(fieldName + ' is not a valid date!');
                        } else if (!schedule.getTime()) {
                            errorMessage = gettext(fieldName + ' time is invalid!');
                        } else if (schedule < _.now()) {
                            if (fieldName !== 'Embargo' || $scope._isInProductionStates) {
                                errorMessage = gettext(fieldName + ' cannot be earlier than now!');
                            }
                        }
                    }

                    return errorMessage;
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
                        errorMessage = validateTimestamp(item.embargo_date, item.embargo_time, item.embargo, 'Embargo');
                        if (errorMessage !== '') {
                            notify.error(errorMessage);
                            return false;
                        }
                    }

                    if (item.publish_schedule_date || item.publish_schedule_time) {
                        if (_.contains(['published', 'killed', 'corrected'], item.state)) {
                            return true;
                        }

                        errorMessage = validateTimestamp(item.publish_schedule_date, item.publish_schedule_time,
                            item.publish_schedule, 'Publish Schedule');
                        if (errorMessage !== '') {
                            notify.error(errorMessage);
                            return false;
                        }
                    }

                    return true;
                }

                function publishItem(orig, item) {
                    var action = $scope.action === 'edit' ? 'publish' : $scope.action;
                    validate(orig, item);
                    return authoring.publish(orig, item, action)
                    .then(function(response) {
                        if (response) {
                            if (angular.isDefined(response.data) && angular.isDefined(response.data._issues)) {
                                if (angular.isDefined(response.data._issues['validator exception'])) {
                                    var errors = response.data._issues['validator exception'];
                                    var modified_errors = errors.replace(/\[/g, '').replace(/\]/g, '').split(',');
                                    for (var i = 0; i < modified_errors.length; i++) {
                                        notify.error(_.trim(modified_errors[i]));
                                    }

                                    if (errors.indexOf('9007') >= 0 || errors.indexOf('9009') >= 0) {
                                        authoring.open(item._id, true).then(function(res) {
                                            $scope.origItem = res;
                                            $scope.dirty = false;
                                            $scope.item = _.create($scope.origItem);
                                        });
                                    }

                                    return false;
                                }
                            } else if (response.status === 412) {
                                notifyPreconditionFailed();
                                return false;
                            } else {
                                notify.success(gettext('Item published.'));
                                $scope.item = response;
                                $scope.dirty = false;
                                authoringWorkspace.close(true);
                                return true;
                            }
                        } else {
                            notify.error(gettext('Unknown Error: Item not published.'));
                            return false;
                        }
                    });
                }

                function validate(orig, item) {
                    $scope.error = {};
                    angular.forEach(_.extend(orig, item), function (value, key) {
                        if (value) {
                            if (typeof value === 'object' && !value.length) {
                                $scope.error[key] = true;
                            } else {
                                $scope.error[key] = false;
                            }
                        } else {
                            $scope.error[key] = true;
                        }
                    });
                }

                function notifyPreconditionFailed() {
                    notify.error(gettext('Item has changed since it was opened. ' +
                        'Please close and reopen the item to continue. ' +
                        'Regrettably, your changes cannot be saved.'));
                    $scope._editable = false;
                    $scope.dirty = false;
                }

                /**
                 * Depending on the item state one of the publish, correct, kill actions will be executed on the item
                 * in $scope.
                 */
                $scope.publish = function() {
                    if (validatePublishScheduleAndEmbargo($scope.item)) {
                        var message = 'publish';
                        if ($scope.action && $scope.action !== 'edit') {
                            message = $scope.action;
                        }

                        if ($scope.dirty && message === 'publish') {
                            //confirmation only required for publish
                            return authoring.publishConfirmation($scope.origItem, $scope.item, $scope.dirty, message)
                            .then(function(res) {
                                if (res) {
                                    return publishItem($scope.origItem, $scope.item);
                                }
                            }, function(response) {
                                notify.error(gettext('Error. Item not published.'));
                                return false;
                            });
                        } else {
                            return publishItem($scope.origItem, $scope.item);
                        }
                    }

                    return false;
                };

                $scope.saveAndContinue = function(customButtonAction) {
                    if ($scope.dirty) {
                        $scope.saveTopbar().then(customButtonAction);
                    } else {
                        customButtonAction();
                    }
                };

                $scope.publishAndContinue = function() {
                    $scope.publish().then(function(published) {
                        if (published) {
                            authoring.rewrite($scope.item);
                        }
                    }, function(err) {
                        notify.error(gettext('Failed to publish and continue.'));
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
                    authoring.close($scope.item, $scope.origItem, $scope.save_enabled()).then(function () {
                        authoringWorkspace.close(true);
                    });
                };

                /*
                 * Minimize an item
                 */
                $scope.minimize = function () {
                    authoringWorkspace.close(true);
                };

                $scope.closeOpenNew = function(createFunction, paramValue) {
                    _closing = true;
                    authoring.close($scope.item, $scope.origItem, $scope.dirty, true).then(function() {
                        createFunction(paramValue);
                    });
                };

                /**
                 * Called by the sendItem directive before send.
                 * If the $scope is dirty then upon confirmation save the item and then unlock the item.
                 * If the $scope is not dirty then unlock the item.
                 */
                $scope.beforeSend = function(action) {
                    $scope.sending = true;
                    if ($scope.dirty) {
                        return confirm.confirmSendTo(action)
                        .then(function() {
                            return $scope.save().then(function() {
                                       return lock.unlock($scope.origItem);
                                   });
                        }, function() { // cancel
                            return $q.reject();
                        });
                    } else {
                        return lock.unlock($scope.origItem);
                    }
                };

                /**
                 * Preview different version of an item
                 */
                $scope.preview = function(version) {
                    forcedExtend($scope.item, version);
                    $scope._editable = false;
                };

                /**
                 * Revert item to given version
                 */
                $scope.revert = function(version) {
                    forcedExtend($scope.item, version);
                    return $scope.save();
                };

                /**
                 * Close preview and start working again
                 */
                $scope.closePreview = function() {
                    $scope.item = _.create($scope.origItem);
                    extendItem($scope.item, $scope.item._autosave || {});
                    $scope._editable = $scope.action !== 'view' && authoring.isEditable($scope.origItem);
                };

                /**
                 * Checks if the item can be unlocked or not.
                 */
                $scope.can_unlock = function() {
                    return $scope.item._locked && !$scope.item.sendTo && lock.can_unlock($scope.item) &&
                        ($scope.itemActions.save || _.contains(['published', 'scheduled', 'corrected'], $scope.item.state));
                };

                $scope.save_enabled = function() {
                    return $scope.dirty || $scope.item._autosave;
                };

                // call the function to unlock and lock the story for editing.
                $scope.unlock = function() {
                    $scope.unlockClicked = true;
                    lock.unlock($scope.item).then(function(unlocked_item) {
                        $scope.edit(unlocked_item);
                    });
                };

                $scope.openAction = function(action) {
                    if (action === 'correct') {
                        authoringWorkspace.correct($scope.item);
                    } else if (action === 'kill') {
                        authoringWorkspace.kill($scope.item);
                    }
                };

                $scope.isLocked = function() {
                    return lock.isLocked($scope.item);
                };

                $scope.isLockedByMe = function() {
                    return lock.isLockedByMe($scope.item);
                };

                $scope.autosave = function(item) {
                    $scope.dirty = true;
                    var autosavedItem = authoring.autosave(item);
                    authoringWorkspace.addAutosave();
                    return autosavedItem;
                };

                $scope.sendToNextStage = function() {
                    var stageIndex, stageList = desks.deskStages[desks.activeDeskId];
                    for (var i = 0; i < stageList.length; i++){
                        if (stageList[i]._id === $scope.stage._id) {
                            stageIndex = (i + 1 === stageList.length ? 0 : i + 1);
                            break;
                        }
                    }

                    $rootScope.$broadcast('item:nextStage', {'stage': stageList[stageIndex], 'itemId': $scope.item._id});
                };

                function refreshItem() {
                    authoring.open($scope.item._id, true)
                        .then(function(item) {
                            $scope.origItem = item;
                            $scope.dirty = false;
                            $scope.closePreview();
                            $scope.item._editable = $scope._editable;
                        });
                }

                $scope.$on('savework', function(e, msg) {
                    var changeMsg = msg;
                    authoring.saveWorkConfirmation($scope.origItem, $scope.item, $scope.dirty, changeMsg)
                    .then(function(res) {
                        // after saving work make sure this item won't be open again
                        desks.setCurrentDeskId(null);
                        $location.search('item', null);
                        $location.search('action', null);
                    })
                    ['finally'](reloadService.forceReload);
                });

                $scope.$on('item:lock', function(_e, data) {
                    if ($scope.item._id === data.item && !_closing &&
                        session.sessionId !== data.lock_session) {
                        authoring.lock($scope.item, data.user);
                    }
                });

                $scope.$on('item:unlock', function(_e, data) {
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

                $scope.$on('content:update', function(_e, data) {
                    if (!$scope._editable && data.items && data.items[$scope.origItem._id]) {
                        refreshItem();
                    }
                });

                $scope.$on('item:publish:wrong:format', function(_e, data) {
                    if (data.item === $scope.item._id) {
                        notify.error(gettext('No formatters found for ') + data.formats.join(',') +
                            ' while publishing item having story name ' + data.unique_name);
                    }
                });

                $scope.$on('item:highlight', function(e, data) {
                    if ($scope.item._id === data.item_id){
                        if (!$scope.item.highlights) {
                            $scope.item.highlights = [data.highlight_id];
                        } else if ($scope.item.highlights.indexOf(data.highlight_id) === -1){
                            $scope.item.highlights = [data.highlight_id].concat($scope.item.highlights);
                        } else if (!$scope.item.multiSelect){
                            $scope.item.highlights = _.without($scope.item.highlights, data.highlight_id);
                        }
                    }
                });

                // init
                $scope.content = content;
                $scope.closePreview();
                macros.setupShortcuts($scope);
            }
        };
    }

    AuthoringTopbarDirective.$inject = ['keyboardManager'];
    function AuthoringTopbarDirective(keyboardManager) {
        return {
            templateUrl: 'scripts/superdesk-authoring/views/authoring-topbar.html',
            link: function(scope) {
                scope.saveDisabled = false;
                scope.saveTopbar = function() {
                    scope.saveDisabled = true;
                    return scope.save(scope.item)
                    ['finally'](function() {
                        scope.saveDisabled = false;
                    });
                };
            }
        };
    }

    function DashboardCard() {
        return {
            link: function(scope, elem) {
                var p = elem.parent();
                var maxW = p.parent().width();
                var marginW = parseInt(elem.css('margin-left'), 10) + parseInt(elem.css('margin-right'), 10);
                var newW = p.outerWidth() + elem.outerWidth() + marginW;
                if (newW < maxW) {
                    p.outerWidth(newW);
                }
            }
        };
    }

    /**
    * Clean the given html by removing tags and embeds, in order to count words and characters later
    */
    var cleanHtml = function(data) {
        return data
        // remove embeds by using the comments around them. Embeds don't matter for word counters
        .replace(/<!-- EMBED START [\s\S]+?<!-- EMBED END .* -->/g, '')
        .replace(/<br[^>]*>/gi, '&nbsp;')
        .replace(/<\/?[^>]+><\/?[^>]+>/gi, ' ')
        .replace(/<\/?[^>]+>/gi, '').trim()
        .replace(/&nbsp;/g, ' ');
    };

    CharacterCount.$inject = [];
    function CharacterCount() {
        return {
            scope: {
                item: '=',
                limit: '=',
                html: '@'
            },
            template: '<span class="char-count" ng-class="{error: limit && numChars > limit}" translate> ' +
                    gettext(' characters') + '</span>' +
                    '<span class="char-count" ng-class="{error: limit && numChars > limit}">{{numChars}}' +
                    '<span ng-if="limit" ng-class="{error: limit && numChars > limit}">/{{ limit }}</span></span>',
            link: function characterCountLink(scope, elem, attrs) {
                scope.html = scope.html || false;
                scope.numChars = 0;
                scope.$watch('item', function() {
                    var input = scope.item || '';
                    input = scope.html ? cleanHtml(input) : input;
                    scope.numChars = input.length || 0;
                });
            }
        };
    }

    WordCount.$inject = ['gettextCatalog'];
    function WordCount(gettextCatalog) {
        return {
            scope: {
                item: '=',
                html: '@'
            },
            template: '<span class="char-count">{{numWords}} <span translate>' + gettextCatalog.getString('words') + '</span></span>',
            link: function wordCountLink(scope, elem, attrs) {
                scope.html = scope.html || false;
                scope.numWords = 0;
                scope.$watch('item', function() {
                    var input = scope.item || '';
                    input = scope.html ? cleanHtml(input) : input;
                    scope.numWords = _.compact(input.split(/\s+/)).length || 0;
                });
            }
        };
    }

    AuthoringThemesService.$inject = ['storage', 'preferencesService'];
    function AuthoringThemesService(storage, preferencesService) {

        var service = {};

        var PREFERENCES_KEY = 'editor:theme';
        var THEME_DEFAULT = 'default';

        service.availableThemes = [
            {
                cssClass: '',
                label: 'Default',
                key: 'default'
            },
            {
                cssClass: 'dark-theme',
                label: 'Dark',
                key: 'dark'
            },
            {
                cssClass: 'natural-theme',
                label: 'Natural',
                key: 'natural'
            },
            {
                cssClass: 'dark-blue-theme',
                label: 'Dark blue',
                key: 'dark-blue'
            },
            {
                cssClass: 'dark-turquoise-theme',
                label: 'Dark turquoise',
                key: 'dark-turquoise'
            },
            {
                cssClass: 'dark-khaki-theme',
                label: 'Dark khaki',
                key: 'dark-khaki'
            },
            {
                cssClass: 'dark-theme-mono',
                label: 'Dark monospace',
                key: 'dark-mono'
            }
        ];

        service.save = function(key, themeScope) {
            return preferencesService.get().then(function(result) {
                result[PREFERENCES_KEY][key] = themeScope[key].key + (themeScope.large[key] ? '-large' : '');
                return preferencesService.update(result);
            });
        };

        service.get = function(key) {
            return preferencesService.get().then(function(result) {
                var theme = result[PREFERENCES_KEY] && result[PREFERENCES_KEY][key] ? result[PREFERENCES_KEY][key] : THEME_DEFAULT;
                return theme;
            });
        };

        return service;
    }

    ThemeSelectDirective.$inject = ['authThemes'];
    function ThemeSelectDirective(authThemes) {

        return {
            templateUrl: 'scripts/superdesk-authoring/views/theme-select.html',
            scope: {key: '@'},
            link: function themeSelectLink(scope, elem) {

                var DEFAULT_CLASS = 'main-article theme-container';

                scope.themes = authThemes.availableThemes;
                scope.large = {};
                authThemes.get('theme').then(function(theme) {
                    var selectedTheme = _.find(authThemes.availableThemes, {key: themeKey(theme)});
                    scope.theme = selectedTheme;
                    scope.large.theme = themeLarge(theme);
                    applyTheme('theme');
                });
                authThemes.get('proofreadTheme').then(function(theme) {
                    var selectedTheme = _.find(authThemes.availableThemes, {key: themeKey(theme)});
                    scope.proofreadTheme = selectedTheme;
                    scope.large.proofreadTheme = themeLarge(theme);
                    applyTheme('proofreadTheme');
                });

                /*
                 * Changing predefined themes for proofread and normal mode
                 *
                 * @param {string} key Type of theme (proofread or normal)
                 * @param {object} theme New theme
                 */
                scope.changeTheme = function(key, theme) {
                    scope[key] = theme;
                    authThemes.save(key, scope);
                    applyTheme(key);
                };

                /*
                 * Changing predefined size for proofread and normal mode
                 *
                 * @param {string} key Type of theme (proofread or normal)
                 * @param {object} size New size
                 */
                scope.changeSize = function(key, size) {
                    scope.large[key] = size;
                    authThemes.save(key, scope);
                    applyTheme(key);
                };

                /*
                 * Applying a theme for currently selected mode
                 *
                 * @param {string} key Type of theme (proofread or normal)
                 */
                function applyTheme(key) {
                    if (scope.key === key) {
                        angular.element('.page-content-container')
                            .children('.theme-container')
                            .attr('class', DEFAULT_CLASS)
                            .addClass(scope[key].cssClass)
                            .addClass(scope.large[key] && 'large-text');
                    }
                }

                function themeKey(theme){
                    return theme.indexOf('-large') !== -1 ? theme.slice(0, theme.indexOf('-large')) : theme;
                }

                function themeLarge(theme){
                    return theme.indexOf('-large') !== -1 ? true : false;
                }
            }
        };
    }
    SendItem.$inject = ['$q', 'api', 'desks', 'notify', 'authoringWorkspace',
        'superdeskFlags', '$location', 'macros', '$rootScope',
        'authoring', 'send', 'editor', 'confirm', 'archiveService',
        'preferencesService', 'multi', 'datetimeHelper'];
    function SendItem($q, api, desks, notify, authoringWorkspace,
                      superdeskFlags, $location, macros, $rootScope,
                      authoring, send, editor, confirm, archiveService,
                      preferencesService, multi, datetimeHelper) {
        return {
            scope: {
                item: '=',
                view: '=',
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
                    } else {
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
                                (scope.mode === 'authoring' && scope.isSendEnabled() && scope.itemActions.send);
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
                    scope.item.sendTo = true;
                    var deskId = scope.selectedDesk._id;
                    var stageId = scope.selectedStage._id || scope.selectedDesk.incoming_stage;

                    if (scope.mode === 'authoring') {
                        return sendAuthoring(deskId, stageId, scope.selectedMacro);
                    } else if (scope.mode === 'archive') {
                        return sendContent(deskId, stageId, scope.selectedMacro, open);
                    } else if (scope.config) {
                        // Remember last destination desk and stage
                        if (scope.destination_last &&
                                (scope.destination_last.desk !== deskId && scope.destination_last.stage !== stageId)) {
                            updateLastDestination(deskId, stageId);
                        } else {
                            updateLastDestination(deskId, stageId);
                        }

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
                    return !authoring.isPublished(scope.item) && _.contains(['text'], scope.item.type);
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

                    return scope.mode === 'authoring' || itemType === 'archive';
                };

                /**
                 * Send the current item to different desk or stage and create a new take and open for editing.
                 */
                function runSendAndContinue() {
                    var deskId = scope.selectedDesk._id;
                    var stageId = scope.selectedStage._id || scope.selectedDesk.incoming_stage;

                    scope.item.more_coming = true;
                    scope.item.sendTo = true;
                    return sendAuthoring(deskId, stageId, scope.selectedMacro, true)
                        .then(function() {
                            var itemDeskId = null;
                            if (scope.item.task && scope.item.task.desk) {
                                itemDeskId = scope.item.task.desk;
                            }
                            return authoring.linkItem(scope.item, null, itemDeskId);
                        })
                        .then(function (item) {
                            authoringWorkspace.close(false);
                            notify.success(gettext('New take created.'));
                            authoringWorkspace.edit(item);
                        }, function(err) {
                            notify.error(gettext('Failed to send and continue.'));
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

                                if (sendAndContinue) {
                                    deferred.reject(err);
                                    return deferred.promise;
                                }
                            }
                        });
                    });
                }

                function updateLastDestination(deskId, stageId) {
                    var updates = {};
                    updates[PREFERENCE_KEY] = {desk: deskId, stage: stageId};
                    preferencesService.update(updates, PREFERENCE_KEY);
                }

                function sendContent(deskId, stageId, macro, open) {
                    var finalItem;
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
                    });
                }

                function sendIngest(deskId, stageId, macro, open) {
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
                    scope.itemActions = authoring.itemActions(scope.item);
                }
            }
        };
    }

    ArticleEditDirective.$inject = [
        'autosave',
        'authoring',
        'metadata',
        '$filter',
        'superdesk',
        'content',
        'renditions',
        'config',
        'session',
        'gettext',
        '$interpolate'
    ];
    function ArticleEditDirective(
        autosave,
        authoring,
        metadata,
        $filter,
        superdesk,
        content,
        renditions,
        config,
        session,
        gettext,
        $interpolate
    ) {
        return {
            templateUrl: 'scripts/superdesk-authoring/views/article-edit.html',
            link: function(scope, elem) {
                scope.limits = authoring.limits;
                scope.toggleDetails = true;
                scope.errorMessage = null;
                scope.contentType = null;
                scope.canEditSignOff = config.user && config.user.sign_off_mapping ? true: false;
                scope.editSignOff = false;

                var mainEditScope = scope.$parent.$parent;
                var autopopulateByline = config.features && config.features.autopopulateByline;

                /* Start: Dateline related properties */

                scope.monthNames = {'Jan': '0', 'Feb': '1', 'Mar': '2', 'Apr': '3', 'May': '4', 'Jun': '5',
                                    'Jul': '6', 'Aug': '7', 'Sep': '8', 'Oct': '9', 'Nov': '10', 'Dec': '11'};

                scope.datelineMonth = '';
                scope.datelineDay = '';

                scope.preview = function(item) {
                    superdesk.intent('preview', 'item', item);
                };

                /* End: Dateline related properties */

                scope.$watch('item', function(item) {
                    if (item) {
                        /* Creates a copy of dateline object from item.__proto__.dateline */
                        if (item.dateline) {
                            var updates = {dateline: {}};
                            updates.dateline = _.pick(item.dateline, ['source', 'date', 'located', 'text']);
                            if (item.dateline.located) {
                                var monthAndDay = $filter('formatDatelineToMMDD')(item.dateline.date, item.dateline.located);
                                scope.datelineMonth = monthAndDay.month;
                                scope.datelineDay = monthAndDay.day;
                                scope.resetNumberOfDays(false);
                            }
                            _.extend(item, updates);
                        }
                        if (autopopulateByline && !item.byline) {
                            item.byline = $interpolate(gettext('by {{ display_name }}'))({display_name: session.identity.display_name});
                        }
                    }
                });

                metadata.initialize().then(function() {
                    scope.metadata = metadata.values;

                    if (scope.item && scope.item.type === 'picture') {
                        scope.item.hasCrops = false;
                        scope.item.hasCrops = scope.metadata.crop_sizes.some(function (crop) {
                            return scope.item.renditions && scope.item.renditions[crop.name];
                        });
                    }
                });

                /**
                 * Invoked by the directive after updating the property in item. This method is responsible for updating
                 * the properties dependent on dateline.
                 */
                scope.updateDateline = function(item, city) {
                    if (city === '') {
                        item.dateline.located = null;
                        item.dateline.text = '';

                        scope.datelineMonth = '';
                        scope.datelineDay = '';
                    } else {
                        var monthAndDay = $filter('formatDatelineToMMDD')(item.dateline.date, item.dateline.located);

                        scope.datelineMonth = monthAndDay.month;
                        scope.datelineDay = monthAndDay.day;
                        scope.resetNumberOfDays(false);

                        item.dateline.text = $filter('formatDatelineToLocMMMDDSrc')(item.dateline.located,
                            $interpolate('{{ month | translate }}')
                            ({month: _.findKey(scope.monthNames, function(m) { return m === scope.datelineMonth; })}),
                            scope.datelineDay, item.dateline.source);
                    }
                };

                /**
                 * Invoked when user changes a month in the datelineMonth.
                 * Populates the datelineDay field with the days in the selected month.
                 *
                 * @param {Boolean} resetDatelineDate if true resets the dateline.date to be relative to selected date.
                 * @param {String} datelineMonth - the selected month
                 */
                scope.resetNumberOfDays = function(resetDatelineDate, datelineMonth) {
                    if (scope.datelineMonth !== '') {
                        scope.daysInMonth = $filter('daysInAMonth')(parseInt(scope.datelineMonth));

                        if (resetDatelineDate) {
                            if (datelineMonth) {
                                scope.datelineMonth = datelineMonth;
                            }

                            scope.modifyDatelineDate(scope.datelineDay);
                        }
                    } else {
                        scope.daysInMonth = [];
                        scope.datelineDay = '';
                    }
                };

                /**
                 * Return current signoff mapping
                 */
                scope.getSignOffMapping = function() {
                    if (config.user && config.user.sign_off_mapping) {
                        return config.user.sign_off_mapping;
                    }
                    return null;
                };

                /**
                 * Modify the sign-off with the value from sign_off_mapping field from user
                 */
                scope.modifySignOff = function(user) {
                    var signOffMapping = config.user.sign_off_mapping;
                    scope.item.sign_off = user[signOffMapping];
                    autosave.save(scope.item);
                };

                /**
                 * Update the sign-off with current search value
                 */
                scope.searchSignOff = function(search) {
                    scope.item.sign_off = search;
                    autosave.save(scope.item);
                };

                /**
                 * Change the edit mode for Sign-Off input
                 */
                scope.changeSignOffEdit = function() {
                    scope.editSignOff = !scope.editSignOff;
                };

                /**
                 * Invoked when user selects a different day in dateline day list. This method calculates the
                 * relative UTC based on the new values of month and day and sets to dateline.date.
                 *
                 * @param {String} datelineDay - the selected day
                 */
                scope.modifyDatelineDate = function(datelineDay) {
                    if (scope.datelineMonth !== '' && scope.datelineDay !== '') {
                        if (datelineDay) {
                            scope.datelineDay = datelineDay;
                        }

                        scope.item.dateline.date = $filter('relativeUTCTimestamp')(scope.item.dateline.located,
                                parseInt(scope.datelineMonth), parseInt(scope.datelineDay));

                        scope.item.dateline.text = $filter('formatDatelineToLocMMMDDSrc')(scope.item.dateline.located,
                            $interpolate('{{ month | translate }}')
                            ({month: _.findKey(scope.monthNames, function(m) { return m === scope.datelineMonth; })}),
                            scope.datelineDay, scope.item.dateline.source);

                        autosave.save(scope.item);
                    }
                };

                scope.applyCrop = function() {
                    var poi = {x: 0.5, y: 0.5};
                    superdesk.intent('edit', 'crop', {item: scope.item, renditions: scope.metadata.crop_sizes, poi: scope.item.poi || poi})
                        .then(function(result) {
                            var renditions = _.create(scope.item.renditions || {});
                            angular.forEach(result.cropData, function(crop, rendition) {
                                mainEditScope.dirty = true;
                                renditions[rendition] = angular.extend({}, renditions[rendition] || {}, crop);
                            });
                            scope.item.renditions = renditions;
                        });
                };

                /**
                 * Adds the selected Helpline to the item allowing user for further edit.
                 */
                scope.addHelplineToFooter = function() {
                    //determine and ignore if footer text have empty tags
                    var container = document.createElement('div');
                    container.innerHTML = scope.item.body_footer;

                    if (!scope.item.body_footer || container.textContent === '') {
                        scope.item.body_footer = '';
                    }

                    if (scope.extra.body_footer_value) {
                        scope.item.body_footer = scope.item.body_footer + '\n<p>' + scope.extra.body_footer_value.value + '</p>';
                        mainEditScope.dirty = true;
                        autosave.save(scope.item);
                    }

                    //first option should always be selected, as multiple helplines could be added in footer
                    _.defer (function() {
                        var ddlHelpline = elem.find('#helplines');
                        ddlHelpline[0].options[0].selected = true;
                    });
                };

                scope.extra = {}; // placeholder for fields not part of item
            }
        };
    }

    angular.module('superdesk.authoring.autosave', []).service('autosave', AutosaveService);

    angular.module('superdesk.authoring', [
            'superdesk.menu',
            'superdesk.activity',
            'superdesk.authoring.widgets',
            'superdesk.authoring.metadata',
            'superdesk.authoring.comments',
            'superdesk.authoring.versioning',
            'superdesk.authoring.versioning.versions',
            'superdesk.authoring.versioning.history',
            'superdesk.authoring.workqueue',
            'superdesk.authoring.packages',
            'superdesk.authoring.find-replace',
            'superdesk.authoring.macros',
            'superdesk.authoring.autosave',
            'superdesk.desks',
            'superdesk.notification',
            'contenteditable',
            'superdesk.config'
        ])

        .service('authoring', AuthoringService)
        .service('confirm', ConfirmDirtyService)
        .service('lock', LockService)
        .service('authThemes', AuthoringThemesService)
        .service('authoringWorkspace', AuthoringWorkspaceService)

        .directive('sdDashboardCard', DashboardCard)
        .directive('sdSendItem', SendItem)
        .directive('sdCharacterCount', CharacterCount)
        .directive('sdWordCount', WordCount)
        .directive('sdThemeSelect', ThemeSelectDirective)
        .directive('sdArticleEdit', ArticleEditDirective)
        .directive('sdAuthoring', AuthoringDirective)
        .directive('sdAuthoringTopbar', AuthoringTopbarDirective)
        .directive('sdAuthoringContainer', AuthoringContainerDirective)
        .directive('sdAuthoringEmbedded', AuthoringEmbeddedDirective)
        .directive('sdAuthoringHeader', AuthoringHeaderDirective)
        .directive('sdItemAssociation', ItemAssociationDirective)
        .directive('sdFullPreview', FullPreviewDirective)
        .filter('embeddedFilter', EmbeddedFilter)
        .directive('sdRemoveTags', RemoveTagsDirective)

        .config(['superdeskProvider', function(superdesk) {
            superdesk
                .activity('authoring', {
                    category: '/authoring',
                    href: '/authoring/:_id',
                    when: '/authoring/:_id',
                    label: gettext('Authoring'),
                    templateUrl: 'scripts/superdesk-authoring/views/authoring.html',
                    topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
                    sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html',
                    controller: AuthoringController,
                    filters: [{action: 'author', type: 'article'}],
                    resolve: {
                        item: ['$route', 'authoring', function($route, authoring) {
                            return authoring.open($route.current.params._id, false);
                        }],
                        action: [function() {return 'edit';}]
                    },
                    authoring: true
                })
                .activity('edit.item', {
                    label: gettext('Edit'),
                    priority: 10,
                    icon: 'pencil',
                    keyboardShortcut: 'ctrl+e',
                    controller: ['data', 'authoringWorkspace', function(data, authoringWorkspace) {
                        authoringWorkspace.edit(data.item ? data.item : data);
                    }],
                    filters: [
                        {action: 'list', type: 'archive'},
                        {action: 'edit', type: 'item'}
                    ],
                    additionalCondition: ['authoring', 'item', function(authoring, item) {
                        return authoring.itemActions(item).edit;
                    }]
                })
                .activity('kill.text', {
                    label: gettext('Kill item'),
                    priority: 100,
                    icon: 'kill',
                    group: 'corrections',
                    controller: ['data', 'authoringWorkspace', 'api', '$rootScope', function(data, authoringWorkspace, api, $rootScope) {
                        if (data.item._type === 'archived') {
                            $rootScope.$broadcast('open:archived_kill', data.item);
                        } else {
                            authoringWorkspace.kill(data.item);
                        }
                    }],
                    filters: [{action: 'list', type: 'archive'}, {action: 'list', type: 'archived'}],
                    additionalCondition:['authoring', 'item', 'privileges', function(authoring, item, privileges) {
                        if (item._type === 'archived') {
                            return privileges.privileges.archived && item.type === 'text';
                        }

                        return authoring.itemActions(item).kill;
                    }],
                    privileges: {kill: 1}
                })
                .activity('correct.text', {
                    label: gettext('Correct item'),
                    priority: 100,
                    icon: 'edit-line',
                    group: 'corrections',
                    controller: ['data', 'authoringWorkspace', function(data, authoringWorkspace) {
                        authoringWorkspace.correct(data.item);
                    }],
                    filters: [{action: 'list', type: 'archive'}],
                    additionalCondition:['authoring', 'item', function(authoring, item) {
                        return authoring.itemActions(item).correct;
                    }],
                    privileges: {correct: 1}
                })
                .activity('view.item', {
                    label: gettext('Open'),
                    priority: 2000,
                    icon: 'external',
                    keyboardShortcut: 'ctrl+o',
                    controller: ['data', 'authoringWorkspace', function(data, authoringWorkspace) {
                        authoringWorkspace.view(data.item || data);
                    }],
                    filters: [
                        {action: 'list', type: 'archive'},
                        {action: 'list', type: 'archived'},
                        {action: 'list', type: 'legal_archive'},
                        {action: 'view', type: 'item'}
                    ],
                    additionalCondition:['authoring', 'item', function(authoring, item) {
                        return authoring.itemActions(item).view;
                    }]
                })
                .activity('edit.crop', {
                    label: gettext('EDIT CROP'),
                    modal: true,
                    cssClass: 'modal--fullscreen',
                    controller: ChangeImageController,
                    templateUrl: 'scripts/superdesk-authoring/views/change-image.html',
                    filters: [{action: 'edit', type: 'crop'}]
                })
                .activity('preview', {
                    href: '/preview/:_id',
                    when: '/preview/:_id',
                    template: '<div sd-full-preview data-item="item"></div>',
                    controller: ['$scope', 'item', function ($scope, item) {
                        $scope.item = item;
                    }],
                    resolve: {
                        item: ['$route', 'api', function($route, api) {
                            return api.find('archive', $route.current.params._id);
                        }]
                    }
                });
        }])
        .config(['apiProvider', function(apiProvider) {
            apiProvider.api('move', {
                type: 'http',
                backend: {
                    rel: 'move'
                }
            });
        }])
        .config(['apiProvider', function(apiProvider) {
            apiProvider.api('content_templates_apply', {
                type: 'http',
                backend: {
                    rel: 'content_templates_apply'
                }
            });
        }])
        .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
            keyboardManager.register('Authoring', 'ctrl + shift + u', gettext('Unlocks current item'));
            keyboardManager.register('Authoring', 'ctrl + shift + e', gettext('Closes current item'));
            keyboardManager.register('Authoring', 'ctrl + shift + s', gettext('Saves current item'));
        }]);

    AuthoringContainerDirective.$inject = ['authoring', 'authoringWorkspace'];
    function AuthoringContainerDirective(authoring, authoringWorkspace) {

        function AuthoringContainerController() {
            var self = this;

            this.state = {};

            /**
             * Start editing item using given action mode
             *
             * @param {string} item
             * @param {string} action
             */
            this.edit = function(item, action) {
                self.item = item;
                self.action = action;
                self.state.opened = !!item;
            };
        }

        return {
            controller: AuthoringContainerController,
            controllerAs: 'authoring',
            templateUrl: 'scripts/superdesk-authoring/views/authoring-container.html',
            scope: {},
            require: 'sdAuthoringContainer',
            link: function(scope, elem, attrs, ctrl) {
                scope.$watch(authoringWorkspace.getState, function(state) {
                    if (state) {
                        ctrl.edit(null, null);
                        // do this in next digest cycle so that it can
                        // destroy authoring/packaging-embedded in current cycle
                        scope.$applyAsync(function() {
                            ctrl.edit(state.item, state.action);
                        });
                    }
                });
            }
        };
    }

    AuthoringEmbeddedDirective.$inject = ['api', 'notify', 'gettext', '$filter', 'config'];
    function AuthoringEmbeddedDirective(api, notify, gettext, $filter, config) {
        return {
            templateUrl: 'scripts/superdesk-authoring/views/authoring.html',
            scope: {
                item: '=',
                action: '='
            },
            link: function (scope) {
                if (scope.action === 'kill') {
                    // kill template is applied on the item.
                    var fields = _.union(_.keys(CONTENT_FIELDS_DEFAULTS), ['_id', 'versioncreated']);
                    var item = {
                        template_name: 'kill', item: _.pick(scope.item, fields)
                    };

                    api.save('content_templates_apply', {}, item, {}).then(function(result) {
                        item = _.pick(result, _.keys(CONTENT_FIELDS_DEFAULTS));
                        scope.origItem = angular.extend({}, scope.item);
                        _.each(item, function(value, key) {
                            if (!_.isEmpty(value)) {
                                scope.origItem[key] = value;
                            }
                        });
                    }, function(err) {
                        notify.error(gettext('Failed to apply kill template to the item.'));
                    });
                } else {
                    if (scope.action === 'correct') {
                        scope.item.ednote = gettext('In the story "') + scope.item.slugline + gettext('" sent at: ')  +
                        $filter('formatLocalDateTimeString')(scope.item.versioncreated, config.view.dateformat + ' ' +
                            config.view.timeformat) +
                        gettext('\r\n\r\nThis is a corrected repeat.');
                    }
                    scope.origItem = scope.item;
                }
            }
        };
    }

    AuthoringHeaderDirective.$inject = ['api', 'authoringWidgets', '$rootScope', 'archiveService', 'metadata', 'content', 'lodash'];
    function AuthoringHeaderDirective(api, authoringWidgets, $rootScope, archiveService, metadata, content, lodash) {
        return {
            templateUrl: 'scripts/superdesk-authoring/views/authoring-header.html',
            require: '^sdAuthoringWidgets',
            link: function (scope, elem, attrs, WidgetsManagerCtrl) {
                scope.contentType = null;

                scope.shouldDisplayUrgency = function() {
                    return !scope.editor.urgency.service || (
                        scope.item.anpa_category &&
                        scope.item.anpa_category[0] &&
                        scope.item.anpa_category[0].qcode &&
                        scope.editor.urgency.service[scope.item.anpa_category[0].qcode]
                    );
                };

                scope.resetDependent = function(item) {
                    var updates = {'subject': []};

                    scope.cvs.forEach(function(cv) {
                        var schemaField = cv.schema_field || cv._id;

                        if (!cv.dependent && schemaField === 'subject' && item.subject) {
                            //is not dependent but in subject -> keep them in subject
                            item.subject.forEach(function(subject) {
                                if (subject.scheme === cv._id) {
                                    updates.subject.push(subject);
                                }
                            });
                        }

                        if (cv.dependent && schemaField !== 'subject' && schemaField !== 'anpa_category') {
                            //is dependent but not on subject -> reset schemaField in item
                            updates[schemaField] = [];
                        }
                    });

                    return updates;
                };

                /**
                 * Returns true if the Company Codes field should be displayed, false otherwise.
                 * Company Codes field is displayed only if either Subject or Category has finance category.
                 */
                scope.shouldDisplayCompanyCodes = function() {
                    if (!metadata.values.company_codes) {
                        return false;
                    }

                    var display = scope.item.company_codes && scope.item.company_codes.length > 0;
                    var financeCategory;

                    if (!display && scope.item.anpa_category) {
                        financeCategory = _.find(scope.item.anpa_category, {'qcode': 'f'});
                        display = !_.isUndefined(financeCategory) && !_.isNull(financeCategory);
                    }

                    if (!display && scope.item.subject) {
                        financeCategory = _.find(scope.item.subject, function (category) {
                            if (category.qcode === '04000000' || category.qcode === '04006018' || category.qcode === '04019000') {
                                return category;
                            }
                        });
                        display = !_.isUndefined(financeCategory) && !_.isNull(financeCategory);
                    }

                    return display;
                };

                scope.$watch('item', function (item) {
                    if (!item) {
                        return;
                    }

                    scope.loaded = true;

                    if (!archiveService.isLegal(scope.item)) {
                        if (item.profile) {
                            content.getType(item.profile)
                                .then(function(type) {
                                    scope.contentType = type;
                                    scope.editor = type.editor || DEFAULT_EDITOR;
                                    scope.schema = type.schema || DEFAULT_SCHEMA;
                                });
                        } else {
                            scope.schema = angular.extend({}, DEFAULT_SCHEMA);
                            scope.editor = angular.extend({}, DEFAULT_EDITOR);
                        }

                        // Related Items
                        if (scope.item.slugline) {
                            archiveService.getRelatedItems(scope.item.slugline).then(function(items) {
                                scope.relatedItems = items;
                            });
                        }

                        var relatedItemWidget = _.filter(authoringWidgets, function (widget) {
                            return widget._id === 'related-item';
                        });

                        scope.activateWidget = function () {
                            WidgetsManagerCtrl.activate(relatedItemWidget[0]);
                        };

                        scope.previewMasterStory = function () {
                            var item_id = item.broadcast.takes_package_id ?
                                item.broadcast.takes_package_id : item.broadcast.master_id;
                            return api.find('archive', item_id).then(function(item) {
                                $rootScope.$broadcast('broadcast:preview', {'item': item});
                            });
                        };
                    }

                });

                metadata.initialize().then(function() {
                    scope.$watch('item.anpa_category', function(services) {
                        var qcodes = lodash.pluck(services, 'qcode');
                        var cvs = [];
                        metadata.cvs.forEach(function(cv) {
                            var cvService = cv.service || {};
                            var match = false;

                            if (cvService.all) {
                                match = true;
                                cv.terms = filterByService(cv.items, qcodes);
                            } else {
                                qcodes.forEach(function(qcode) {
                                    match = match || cvService[qcode];
                                });
                                cv.terms = cv.items;
                            }

                            if (match) {
                                cvs.push(cv);
                            }
                        });

                        scope.cvs = _.sortBy(cvs, 'priority');
                    });
                });

                // If correction set focus to the ednote to encourage user to fill it in
                _.defer (function() {
                    if (scope.action === 'correct') {
                        elem.find('#ednote').focus();
                    } else {
                        elem.find('#slugline').focus();
                    }
                });

                function filterByService(items, qcodes) {
                    return _.filter(items, function(item) {
                        var match = false;
                        if (item.service) {
                            qcodes.forEach(function(qcode) {
                                match = match || item.service[qcode];
                            });
                        } else {
                            match = true;
                        }
                        return match;
                    });
                }
            }
        };
    }

    AuthoringWorkspaceService.$inject = ['$location', 'superdeskFlags', 'authoring', 'lock', 'send'];
    function AuthoringWorkspaceService($location, superdeskFlags, authoring, lock, send) {
        this.item = null;
        this.action = null;
        this.state = null;

        var self = this;

        /**
         * Open item for editing
         *
         * @param {Object} item
         * @param {string} action
         */
        this.edit = function(item, action) {
            if (item) {
                authoringOpen(item._id, action || 'edit', item._type || null);
            } else {
                self.close();
            }
        };

        /**
         * Open an item in readonly mode without locking it
         *
         * @param {Object} item
         */
        this.view = function(item) {
            self.edit(item, 'view');
        };

        /**
         * Open an item - if possible for edit, otherwise read only
         *
         * @param {Object} item
         */
        this.open = function(item) {
            var _open = function (_item) {
                var actions = authoring.itemActions(_item);
                if (actions.edit) {
                    this.edit(_item);
                } else {
                    this.view(_item);
                }
            }.bind(this);

            if (item._type === 'ingest' || item.state === 'ingested') {
                send.one(item).then(_open);
            } else {
                _open(item);
            }
        };

        /**
         * Stop editing.
         *
         * @param {boolean} showMonitoring when true shows the monitoring if monitoring is hidden.
         */
        this.close = function(showMonitoring) {
            self.item = null;
            self.action = null;
            if (showMonitoring && superdeskFlags.flags.hideMonitoring) {
                superdeskFlags.flags.hideMonitoring = false;
            }

            saveState();
        };

        /**
         * Kill an item
         *
         * @param {Object} item
         */
        this.kill = function(item) {
            self.edit(item, 'kill');
        };

        /**
         * Correct an item
         *
         * @param {Object} item
         */
        this.correct = function(item) {
            self.edit(item, 'correct');
        };

        /**
         * Get edited item
         *
         * return {Object}
         */
        this.getItem = function() {
            return self.item;
        };

        /**
         * Get current action
         *
         * @return {string}
         */
        this.getAction = function() {
            return self.action;
        };

        /**
         * Get current state
         *
         * @return {Object}
         */
        this.getState = function() {
            return self.state;
        };

        /**
         * Should be invoked when an item is saved by system without user interaction
         */
        this.addAutosave = function () {
            if (self.item) {
                self.item._autosaved = true;
            }
        };

        /**
         * Save current item/action state into $location so that it can be
         * used on page reload
         */
        function saveState() {
            $location.search('item', self.item ? self.item._id : null);
            $location.search('action', self.action);
            superdeskFlags.flags.authoring = !!self.item;
            self.state = {item: self.item, action: self.action};
        }

        /**
         * On load try to fetch item set in url
         */
        function init() {
            if ($location.search().item && $location.search().action in self) {
                authoringOpen($location.search().item, $location.search().action);
            }
        }

        /**
         * Fetch item by id and start editing it
         */
        function authoringOpen(itemId, action, repo) {
            return authoring.open(itemId, action === 'view', repo)
                .then(function(item) {
                    self.item = item;
                    self.action = (action !== 'view' && item._editable) ? action : 'view';
                })
                .then(saveState);
        }

        init();
    }

    ItemAssociationDirective.$inject = ['superdesk', 'renditions', '$timeout', 'api', '$q'];
    function ItemAssociationDirective(superdesk, renditions, $timeout, api, $q) {
        return {
            scope: {
                rel: '=',
                item: '=',
                editable: '=',
                onchange: '&'
            },
            templateUrl: 'scripts/superdesk-authoring/views/item-association.html',
            link: function(scope, elem) {
                var PICTURE_TYPE = 'application/superdesk.item.picture';

                /**
                 * Get superdesk item from event
                 *
                 * @param {Event} event
                 * @param {string} dataType
                 * @return {Object}
                 */
                function getItem(event, dataType) {
                    return angular.fromJson(event.originalEvent.dataTransfer.getData(dataType));
                }

                // it should prevent default as long as this is valid image
                elem.on('dragover', function(event) {
                    if (scope.editable && PICTURE_TYPE === event.originalEvent.dataTransfer.types[0]) {
                        event.preventDefault();
                    }
                });

                // update item associations on drop
                elem.on('drop', function(event) {
                    event.preventDefault();
                    var item = getItem(event, PICTURE_TYPE);
                    // ingest picture if it comes from an external source (create renditions)
                    scope.loading = true;
                    renditions.ingest(item)
                    .then(scope.edit)
                    .finally(function() {
                        scope.loading = false;
                    });
                });

                function updateItemAssociation(updated) {
                    var data = {};
                    data[scope.rel] = updated;

                    scope.item.associations = angular.extend(
                        {},
                        scope.item.associations,
                        data
                    );

                    return data;
                }

                // init associated item for preview
                scope.$watch('item.associations[rel]', function(related) {
                    scope.related = related;
                });

                renditions.get();

                scope.edit = function(item) {
                    scope.loading = true;
                    return renditions.crop(item).then(function(updatedItem) {
                        var data = updateItemAssociation(updatedItem);
                        scope.onchange({item: scope.item, data: data});
                    })
                    .finally(function() {
                        scope.loading = false;
                    });
                };

                scope.remove = function(item) {
                    var data = updateItemAssociation(null);
                    scope.onchange({item: scope.item, data: data});
                };

                scope.upload = function() {
                    if (scope.editable) {
                        superdesk.intent('upload', 'media', {uniqueUpload: true}).then(function(images) {
                            // open the view to edit the PoI and the cropping areas
                            if (images) {
                                $timeout(function() {
                                    scope.edit(images[0]);
                                }, 0, false);
                            }
                        });
                    }
                };
            }
        };
    }

    RemoveTagsDirective.$inject = [];
    function RemoveTagsDirective() {
        var htmlRegex = /(<([^>]+)>)/ig;
        return {
            require: 'ngModel',
            scope: {
                model: '=ngModel'
            },
            link: function(scope, elem, attr, ngModel) {
                scope.$watch('model', function() {
                    if (scope.model) {
                        scope.model = stripHtmlRaw(scope.model).replace(htmlRegex, '');
                    }
                });
            }
        };
    }

    FullPreviewDirective.$inject = ['api', '$timeout', 'config'];
    function FullPreviewDirective(api, $timeout, config) {
        return {
            scope: {
                item: '=',
                closeAction: '='
            },
            templateUrl: 'scripts/superdesk-authoring/views/full-preview.html',
            link: function (scope, elem, attr, ctrl) {
                scope.hide_images = true;

                scope.filterKey = config.previewSubjectFilterKey || '';

                scope.printPreview = function () {
                    angular.element('body').addClass('prepare-print');

                    var afterPrint = function () {
                        angular.element('body').removeClass('prepare-print');
                    };

                    if (window.matchMedia) {
                        var mediaQueryList = window.matchMedia('print');
                        mediaQueryList.addListener(function (mql) {
                            if (!mql.matches) {
                                afterPrint();
                            }
                        });
                    }

                    window.onafterprint = afterPrint;

                    $timeout(function () {
                        window.print();
                    }, 200, false);
                    return false;
                };
            }
        };
    }

    function EmbeddedFilter() {
        return function(input) {
            var output = {};
            for (var i in input) {
                if (input.hasOwnProperty(i)) {
                    if (!/^embedded/.test(i)) {
                        output[i] = input[i];
                    }
                }
            }
            return output;
        };
    }

})();
