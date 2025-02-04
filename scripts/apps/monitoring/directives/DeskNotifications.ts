import _ from 'lodash';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';

/**
 * Displays the notifications of the desk of a given stage
 */
DeskNotifications.$inject = ['desks', 'deskNotifications', 'authoringWorkspace', '$timeout'];
export function DeskNotifications(desks, deskNotifications, authoringWorkspace: AuthoringWorkspaceService, $timeout) {
    return {
        scope: {stage: '=stage'},
        templateUrl: 'scripts/apps/monitoring/views/desk-notifications.html',
        link: function(scope) {
            function init() {
                // Update the figures if there's a desk mention message
                initNotifications();
                if (scope.default_incoming) {
                    scope.$on('activity', (event, data) => {
                        if (_.get(data, 'activity.name') === 'desk:mention' && data.activity.desk === scope.desk) {
                            $timeout(reload, 5000, false);
                        }
                    });
                }
            }

            function initNotifications() {
                scope.desk = desks.stageLookup[scope.stage].desk;
                scope.notifications = deskNotifications.getNotifications(scope.desk);
                scope.default_incoming = desks.stageLookup[scope.stage].default_incoming;
                scope.notificationCount = deskNotifications.getUnreadCount(scope.desk) || 0;
                scope.deskLookup = desks.deskLookup;
                scope.stageLookup = desks.stageLookup;
            }

            function reload() {
                deskNotifications.reload().then(initNotifications);
            }

            /**
             * Opens the story in the notification
             * and updates the notification as read
             *
             * @param {object} notification The notification to be checked
             */
            scope.open = function(notification) {
                authoringWorkspace.view(notification.item);
            };

            /**
             * Updates the notification as read
             *
             * @param {object} notification The notification to be checked
             */
            scope.acknowledge = function(notification) {
                deskNotifications.markAsRead(notification, scope.desk);
                $timeout(reload, 5000, false);
            };

            function getRecipient(notification) {
                return _.find(notification.recipients, {desk_id: scope.desk});
            }

            /**
             * Checks if the given notification is read
             *
             * @param {object} notification The notification to be checked
             * @return {boolean} True if the notification is read by any user
             */
            scope.isRead = function(notification) {
                var recipient: any = getRecipient(notification);

                return recipient && recipient.read;
            };

            /**
             * Returns the name of the user who read the notification
             *
             * @param {object} notification The notification to be checked
             * @return {string} Display name of the user
             */
            scope.readBy = function(notification) {
                var recipient: any = getRecipient(notification);

                if (recipient && recipient.read) {
                    return desks.userLookup[recipient.user_id].display_name;
                }
            };

            init();
        },
    };
}
