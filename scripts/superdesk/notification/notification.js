/**
 * This file is part of Superdesk.
 *
 * Copyright 2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
(function() {
    'use strict';

    WebSocketProxy.$inject = ['$rootScope', 'config', '$interval', 'session', 'SESSION_EVENTS'];
    function WebSocketProxy($rootScope, config, $interval, session, SESSION_EVENTS) {

        var ws = null;
        var connectTimer = -1;
        var TIMEOUT = 5000;

        var ReloadEvents = [
            'user_disabled',
            'user_inactivated',
            'user_role_changed',
            'user_type_changed',
            'user_privileges_revoked',
            'role_privileges_revoked',
            'desk_membership_revoked',
            'desk',
            'stage',
            'stage_visibility_updated'
        ];

        var readyState = {
            'CONNECTING': 0,
            'OPEN': 1,
            'CLOSING': 2,
            'CLOSED': 3
        };

        if (!config.server.ws) {
            return;
        }

        var connect = function() {
            if (!ws || ws.readyState === readyState.CLOSED) {
                ws = new WebSocket(config.server.ws);
                bindEvents();
            }
        };

        var disconnect = function() {
            if (ws) {
                ws.close();
                ws = null;
            }
        };

        var bindEvents = function() {
            ws.onmessage = function(event) {
                var msg = angular.fromJson(event.data);
                $rootScope.$broadcast(msg.event, msg.extra);
                if (_.contains(ReloadEvents, msg.event)) {
                    $rootScope.$broadcast('reload', msg);
                }
            };

            ws.onerror = function(event) {
                console.error(event);
            };

            ws.onopen = function(event) {
                $interval.cancel(connectTimer);
                $rootScope.$broadcast('connected');
            };

            ws.onclose = function(event) {
                $rootScope.$broadcast('disconnected');

                $interval.cancel(connectTimer);
                connectTimer = $interval(function() {
                    if (ws && session.sessionId) {
                        connect();  // Retry to connect for every TIMEOUT interval.
                    }
                }, TIMEOUT, 0, false);  // passed invokeApply = false to prevent triggering digest cycle
            };
        };

        connect();

        $rootScope.$on(SESSION_EVENTS.LOGOUT, disconnect);

        $rootScope.$on(SESSION_EVENTS.LOGIN, connect);
    }

    /**
     * Service for notifying user when websocket connection disconnected or connected.
     */
    NotifyConnectionService.$inject = ['$rootScope', 'notify', 'gettext', '$timeout', 'session'];
    function NotifyConnectionService($rootScope, notify, gettext, $timeout, session) {
        var _this = this;
        _this.message = null;

        $rootScope.$on('disconnected', function(event) {
            _this.message = gettext('Disconnected to Notification Server!');
            $rootScope.$applyAsync(function () {
                notify.warning(_this.message);
            });
        });

        $rootScope.$on('connected', function(event) {
            _this.message = gettext('Connected to Notification Server!');
            $rootScope.$applyAsync(function () {
                notify.pop();   // removes disconnection warning, once connected.
                notify.success(_this.message);
            });
        });

        $rootScope.$on('vocabularies:updated', function(event, data) {
            if (!data.user || data.user !== session.identity._id) {
                _this.message = gettext(data.vocabulary +
                    ' vocabulary has been updated. Please re-login to see updated vocabulary values');
                $timeout(function() {
                    notify.error(_this.message);
                }, 100);
            }
        });
    }

    ReloadService.$inject = ['$window', '$rootScope', 'session', 'desks', 'gettext', 'superdeskFlags'];
    function ReloadService($window, $rootScope, session, desks, gettext, superdeskFlags) {
        var _this = this;
        _this.userDesks = [];
        _this.result = null;
        _this.activeDesk = null;
        desks.fetchCurrentUserDesks().then(function (desk_list) {
            _this.userDesks = desk_list._items;
            _this.activeDesk = desks.active.desk;
        });

        var userEvents = {
            'user_disabled': 'User is disabled',
            'user_inactivated': 'User is inactivated',
            'user_role_changed': 'User role is changed',
            'user_type_changed': 'User type is changed',
            'user_privileges_revoked': 'User privileges are revoked'
        };
        var roleEvents = {
            'role_privileges_revoked': 'Role privileges are revoked'
        };
        var deskEvents = {
            'desk_membership_revoked': 'User removed from desk',
            'desk': 'Desk is deleted/updated'
        };
        var stageEvents = {
            'stage': 'Stage is created/updated/deleted',
            'stage_visibility_updated': 'Stage visibility change'
        };

        $rootScope.$on('reload', function(event, msg) {
            _this.result = _this.reloadIdentifier(msg);
            _this.reload(_this.result);
        });
        this.reload = function(result) {
            if (result.reload) {
                if (superdeskFlags.flags.authoring) {
                    _this.broadcast(gettext(result.message));
                } else {
                    this.forceReload();
                }
            }
        };

        this.forceReload = function() {
            return $window.location.reload(true);
        };

        this.broadcast = function(msg) {
            $rootScope.$broadcast('savework', msg);
        };

        this.reloadIdentifier = function(msg) {
            var result = {
                reload: false,
                message: null
            };
            if (_.has(userEvents, msg.event)) {
                if (msg.extra.user_id != null) {
                    if (msg.extra.user_id.indexOf(session.identity._id)  !== -1) {
                        result.message = userEvents[msg.event];
                        result.reload = true;
                    }
                }
            }

            if (_.has(roleEvents, msg.event)) {
                if (msg.extra.role_id.indexOf(session.identity.role)  !== -1) {
                    result.message = roleEvents[msg.event];
                    result.reload = true;
                }
            }
            if (_.has(deskEvents, msg.event)) {
                if (msg.extra.desk_id != null && msg.extra.user_ids != null) {
                    if (_.find(_this.userDesks, {_id: msg.extra.desk_id}) != null &&
                        msg.extra.user_ids.indexOf(session.identity._id)  !== -1) {
                        result.message = deskEvents[msg.event];
                        result.reload = true;
                    }
                }
            }

            if (_.has(stageEvents, msg.event)) {
                if (msg.extra.desk_id != null) {
                    if (msg.event === 'stage_visibility_updated') {
                        if (_.find(_this.userDesks, {_id: msg.extra.desk_id}) == null &&
                        ($window.location.hash.match('/search') != null || $window.location.hash.match('/authoring/') != null)) {
                            result.message = stageEvents[msg.event];
                            result.reload = true;
                        }
                    } else if (msg.event === 'stage') {
                        if (_.find(_this.userDesks, {_id: msg.extra.desk_id}) != null && _this.activeDesk === msg.extra.desk_id) {
                            result.message = stageEvents[msg.event];
                            result.reload = true;
                        }
                    }
                }
            }
            return result;
        };
    }

    return angular.module('superdesk.notification', ['superdesk.desks', 'superdesk.menu'])
        .service('reloadService', ReloadService)
        .service('notifyConnectionService', NotifyConnectionService)
        .run(WebSocketProxy);
})();
