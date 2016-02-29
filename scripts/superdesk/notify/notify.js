(function() {
    'use strict';

    return angular.module('superdesk.notify', ['superdesk.translate'])
        .service('notify', ['$timeout', 'gettext', function ($timeout, gettext) {
            function NotifyService() {

                var ttls = {
                    info: 3000,
                    success: 3000,
                    error: 5000
                };

                var messageTypes = ['info', 'success', 'error', 'warning'];

                this.messages = [];

                this.pop = function() {
                    return this.messages.pop();
                };

                this.addMessage = function(type, text, ttl) {
                    var self = this;

                    if (ttl == null) {
                        ttl = ttls[type];
                    }

                    // add message, only if it's not already exist
                    if (_.find(this.messages, _.matches({msg: text})) === undefined) {
                        this.messages.push({type: type, msg: text});
                    }

                    if (ttl) {
                        $timeout(function() {
                            self.pop();
                        }, ttl);
                    }
                };

                angular.forEach(messageTypes, function(type) {
                    var self = this;
                    this[type] = function(text, ttl) {
                        self.addMessage(type, text, ttl);
                    };
                }, this);

                this.startSaving = function() {
                    this.info(gettext('Saving..'));
                };

                this.stopSaving = function() {
                    this.pop();
                };
            }

            return new NotifyService();
        }])
        .directive('sdNotify', ['notify', '$rootScope', function (notify, $rootScope) {
            return {
                scope: true,
                templateUrl: 'scripts/superdesk/notify/views/notify.html',
                link: function (scope, element, items) {
                    scope.messages = notify.messages;
                }
            };
        }]);
})();
