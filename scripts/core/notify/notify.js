/**
 * @ngdoc module
 * @module superdesk.core.notify
 * @name superdesk.core.notify
 * @packageName superdesk.core
 * @description The notify package allows developers to display various
 * notifications for users.
 */
export default angular.module('superdesk.core.notify', ['superdesk.core.translate'])
    .service('notify', ['$timeout', 'gettext', function($timeout, gettext) {
        function NotifyService() {
            var ttls = {
                info: 3000,
                success: 3000,
                warning: 5000,
                error: 8000,
            };

            var messageTypes = ['info', 'success', 'error', 'warning'];

            this.messages = [];

            this.pop = function() {
                return this.messages.pop();
            };

            this.addMessage = function(type, text, ttl = ttls[type], options = {}) {
                var self = this;

                // add message, only if it's not already exist
                if (_.find(this.messages, _.matches({msg: text})) === undefined) {
                    this.messages.push({type: type, msg: text, options: options});
                }

                if (ttl) {
                    $timeout(() => {
                        self.pop();
                    }, ttl);
                }
            };

            angular.forEach(messageTypes, function(type) {
                var self = this;

                this[type] = function(text, ttl, options) {
                    self.addMessage(type, text, ttl, options);
                };
            }, this);

            this.startSaving = function() {
                this.info(gettext('Saving...'));
            };

            this.stopSaving = function() {
                this.pop();
            };
        }

        return new NotifyService();
    }])
    .directive('sdNotify', ['notify', function(notify) {
        return {
            scope: true,
            templateUrl: 'scripts/core/notify/views/notify.html',
            link: function(scope, element, items) {
                scope.messages = notify.messages;
            }
        };
    }]);
