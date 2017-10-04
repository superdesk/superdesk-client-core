export default angular.module('superdesk.core.preferences', ['superdesk.core.notify', 'superdesk.core.auth.session'])
    /**
     * @ngdoc service
     * @module superdesk.core.services
     * @name preferencesService
     *
     * @requires https://docs.angularjs.org/api/ng/service/$injector $injector
     * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
     * @requires https://docs.angularjs.org/api/ng/service/$q $q
     * @requires session
     * @requires notify
     * @requires gettext
     *
     * @description Preferences Service (TODO)
     */
    .service('preferencesService', ['$injector', '$rootScope', '$q', 'session', 'notify', 'gettext', 'lodash',
        function PreferencesService($injector, $rootScope, $q, session, notify, gettext, _) {
            var USER_PREFERENCES = 'user_preferences',
                SESSION_PREFERENCES = 'session_preferences',
                ACTIVE_PRIVILEGES = 'active_privileges',
                ACTIONS = 'allowed_actions',
                userPreferences = {
                    'feature:preview': 1,
                    'archive:view': 1,
                    'email:notification': 1,
                    'desktop:notification': 1,
                    'workqueue:items': 1,
                    'dashboard:ingest': 1,
                    'agg:view': 1,
                    'workspace:active': 1,
                    'categories:preferred': 1,
                    'desks:preferred': 1,
                    'destination:active': 1, // key to store last desk/stage for send to/fetch to.
                    'spellchecker:status': 1,
                    'singleline:view': 1
                },
                preferences,
                preferencesPromise;

            $rootScope.$watch(() => session.token, resetPreferences);

            /**
             * @ngdoc method
             * @name preferencesService#getPrivileges
             * @public
             * @returns {Promise}
             *
             * @description Get privileges for current user.
             */
            this.getPrivileges = function getPrivileges() {
                return this.get().then(() => preferences[ACTIVE_PRIVILEGES] || {});
            };

            /**
             * @ngdoc method
             * @name preferencesService#getActions
             * @public
             *
             * @returns {Promise}
             *
             * @description Get available content actions for current user.
             */
            this.getActions = function getActions() {
                return this.get().then(() => preferences[ACTIONS] || []);
            };

            /**
             * @ngdoc object
             * @name preferencesService#desktopNotification
             * @public
             *
             * @returns {object}
             *
             * @description All the methods related to desktop notifications
             */
            const desktopNotification = {
                // ask for permission
                requestPermission: () => {
                    if ('Notification' in window) {
                        Notification.requestPermission();
                    }
                },
                // ask for permission and send a desktop notification
                send: (msg) => {
                    if (_.get(preferences, 'user_preferences.desktop:notification.enabled')) {
                        if ('Notification' in window && Notification.permission !== 'denied') {
                            Notification.requestPermission((permission) => {
                                if (permission === 'granted') {
                                    new Notification(msg);
                                }
                            });
                        }
                    }
                },
            };

            this.desktopNotification = desktopNotification;

            /**
             * @ngdoc method
             * @name preferencesService#getPreferences
             * @private
             *
             * @description Fetch preferences from server and store local copy.
             * On next call it will remove local copy and fetch again.
             */
            function getPreferences(cached) {
                var api = $injector.get('api');

                preferences = null;
                preferencesPromise = session.getIdentity()
                    .then(fetchPreferences)
                    .then(null, (response) => {
                        if (response && response.status === 404) {
                            return fetchPreferences();
                        }

                        return $q.reject(response);
                    })
                    .then(setPreferences);

                /**
                 * Fetch preferences for current session
                 *
                 * @return {Promise}
                 */
                function fetchPreferences() {
                    return api.find('preferences', session.sessionId, null, cached);
                }

                /**
                 * Set preferences to memory for further usage
                 */
                function setPreferences(_preferences) {
                    preferences = _preferences;
                    initPreferences(preferences);
                    return preferences;
                }
            }

            /**
             * Get preference value from user or session preferences based on key.
             *
             * @param {string} key
             * @returns {Object}
             */
            function getValue(key) {
                if (!key) {
                    return preferences[USER_PREFERENCES];
                } else if (userPreferences[key]) {
                    return preferences[USER_PREFERENCES][key];
                }

                return preferences[SESSION_PREFERENCES][key];
            }

            /**
             * @ngdoc method
             * @name preferencesService#get
             * @private
             * @returns {Promise}
             *
             * @param {string} key
             * @param {boolean} force
             *
             * @description Get preference value, in case preferences are not
             * loaded yet it will fetch it. Parameter force is used to bypass
             * the cache.
             */
            this.get = function(key, force) {
                if (!preferencesPromise || force) {
                    getPreferences(!force);
                }

                return preferencesPromise.then(returnValue);

                function returnValue() {
                    return getValue(key);
                }
            };

            /**
             * @ngdoc method
             * @name preferencesService#update
             * @private
             *
             * @param {object} updates
             * @param {string} key
             *
             * @description
             * Update preferences
             *
             * It's done in 2 steps - schedule and commit. Schedule caches the changes
             * and calls commit async. Following calls to update in same $digest will
             * only cache changes. In next $digest those changes are pushed to api.
             * This way we can update multiple preferences without getting etag conflicts.
             */
            this.update = function(updates, key) {
                if (!key) {
                    return scheduleUpdate(USER_PREFERENCES, updates);
                } else if (userPreferences[key]) {
                    return scheduleUpdate(USER_PREFERENCES, updates, key);
                }

                return scheduleUpdate(SESSION_PREFERENCES, updates, key);
            };

            var updates,
                deferUpdate;

            /**
             * Schedule an update.
             *
             * Cache the changes and schedule a commit if it's first update in currect $digest.
             *
             * @param {string} type
             * @param {object} _updates
             */
            function scheduleUpdate(type, _updates) {
                angular.extend(preferences[type], _updates);

                // schedule commit
                if (!updates) {
                    updates = {};
                    deferUpdate = $q.defer();
                    $rootScope.$applyAsync(commitUpdates);
                }

                // adding updates to current schedule
                updates[type] = updates[type] || {};
                angular.extend(updates[type], _updates);

                return deferUpdate.promise;
            }

            /**
             * Commit updates.
             */
            function commitUpdates() {
                var api = $injector.get('api'),
                    serverUpdates = updates;

                updates = null;
                return api.save('preferences', preferences, serverUpdates)
                    .then((result) => {
                        preferences._etag = result._etag;
                        deferUpdate.resolve(result);
                        return result;
                    }, (response) => {
                        console.error(response);
                        notify.error(gettext('User preferences could not be saved...'));
                        deferUpdate.reject(response);
                    })
                    .finally(() => {
                        deferUpdate = null;
                    });
            }

            /**
             * Make preferences reload after session expiry - token is set from something to null.
             */
            function resetPreferences(newId, oldId) {
                if (oldId && !newId) {
                    preferencesPromise = null;
                }
            }

            /**
             * Make sure all segments are presented in preferences.
             */
            function initPreferences(preferences) {
                if (_.get(preferences, 'user_preferences.desktop:notification.enabled')) {
                    desktopNotification.requestPermission();
                }
                angular.forEach([
                    USER_PREFERENCES,
                    SESSION_PREFERENCES,
                    ACTIVE_PRIVILEGES,
                    ACTIONS
                ], (key) => {
                    if (_.isNil(preferences[key])) {
                        preferences[key] = {};
                    }
                });
            }
        }]);
