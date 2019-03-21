import {AUTHORING_MENU_GROUPS} from '../../authoring/authoring/constants';

ItemActionsMenu.$inject = ['superdesk', 'activityService', 'workflowService', 'archiveService', '$rootScope'];
export function ItemActionsMenu(superdesk, activityService, workflowService, archiveService, $rootScope) {
    return {
        scope: {
            item: '=',
            active: '=',
        },
        templateUrl: 'scripts/apps/monitoring/views/item-actions-menu.html',
        link: function(scope) {
            /**
             * Populate scope actions when dropdown is opened.
             *
             * @param {boolean} isOpen
             */
            scope.toggleActions = function(isOpen) {
                scope.menuGroups = isOpen ? getActions(scope.item) : scope.menuGroups;
                scope.open = isOpen;

                if (!isOpen) {
                    // After close, return focus to parent of selected element
                    angular.element('.media-text.selected')
                        .parents('li')
                        .focus();

                    angular.element('.dropdown--noarrow.open')
                        .removeClass('open');
                } else {
                    $rootScope.itemToggle = scope.toggleActions;
                }
            };

            /*
             * If the item gets locked by another user when the activity menu is open then close the menu
             * as the actions for locked and unlocked are different.
             */
            scope.$on('item:lock', (_e, data) => {
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
                let intent = {action: 'list', type: getType(item)};
                let groups: any = {};

                superdesk.findActivities(intent, item).forEach((activity) => {
                    if (workflowService.isActionAllowed(scope.item, activity.action)) {
                        let group = activity.group || 'default';

                        groups[group] = groups[group] || [];
                        groups[group].push(activity);
                    }
                });

                let menuGroups = [];

                AUTHORING_MENU_GROUPS.forEach((mg) => {
                    if (groups[mg._id]) {
                        let group: any = {...mg};

                        group.actions = groups[mg._id];
                        menuGroups.push(group);
                    }
                });

                Object.keys(groups).forEach((groupName) => {
                    var existingGroup = AUTHORING_MENU_GROUPS.find((g) => g._id === groupName);

                    if (!existingGroup) {
                        menuGroups.push({_id: groupName, label: groupName, actions: groups[groupName]});
                    }
                });

                return menuGroups;
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
        },
    };
}
