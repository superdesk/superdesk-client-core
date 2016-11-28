ItemActionsMenu.$inject = ['superdesk', 'activityService', 'workflowService', 'archiveService', '$rootScope'];
export function ItemActionsMenu(superdesk, activityService, workflowService, archiveService, $rootScope) {
    return {
        scope: {
            item: '=',
            active: '='
        },
        templateUrl: 'scripts/apps/monitoring/views/item-actions-menu.html',
        link: function(scope) {
            /**
             * Populate scope actions when dropdown is opened.
             *
             * @param {boolean} isOpen
             */
            scope.toggleActions = function(isOpen) {
                scope.actions = isOpen ? getActions(scope.item) : scope.actions;
                scope.open = isOpen;

                if (!isOpen) {
                    // After close, return focus to parent of selected element
                    angular.element('.media-text.selected').parents('li').focus();
                    angular.element('.dropdown--noarrow.open').removeClass('open');
                } else {
                    $rootScope.itemToogle = scope.toggleActions;
                }
            };

            /*
             * If the item gets locked by another user when the activity menu is open then close the menu
             * as the actions for locked and unlocked are different.
             */
            scope.$on('item:lock', function(_e, data) {
                if (scope.open && scope.item && scope.item._id === data.item) {
                    scope.open = false;
                }
            });

            /**
             * Stope event propagation so that click on dropdown menu
             * won't select that item for preview/authoring.
             *
             * @param {Event} event
             */
            scope.stopEvent = function(event) {
                event.stopPropagation();
            };

            scope.run = function(activity) {
                $rootScope.$broadcast('broadcast:preview', {item: null}); // closes preview if already opened
                return activityService.start(activity, {data: {item: scope.item}});
            };

            /**
             * Get available actions for given item.
             *
             * This is not context aware, it will return everything.
             *
             * @param {object} item
             * @return {object}
             */
            function getActions(item) {
                var intent = {action: 'list', type: getType(item)};
                var groups = {};
                superdesk.findActivities(intent, item).forEach(function(activity) {
                    if (workflowService.isActionAllowed(scope.item, activity.action)) {
                        var group = activity.group || 'default';
                        groups[group] = groups[group] || [];
                        groups[group].push(activity);
                    }
                });
                return groups;
            }

            /**
             * Get actions type based on item state. Used with activity filter.
             *
             * @param {Object} item
             * @return {string}
             */
            function getType(item) {
                return archiveService.getType(item);
            }
        }
    };
}
