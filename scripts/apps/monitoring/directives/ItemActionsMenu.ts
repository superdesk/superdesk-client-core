import {AUTHORING_MENU_GROUPS, IAuthoringMenuGroup} from '../../authoring/authoring/constants';
import {IArticle} from 'superdesk-api';
import {IActivity} from 'superdesk-interfaces/Activity';

export interface IActionsMenuItemExtra {
    label: string;
    icon?: string;
    onTrigger(): void;
}

interface IScope extends ng.IScope {
    item?: IArticle;
    open: any;
    active: any;
    menuGroups: Array<IAuthoringMenuGroup>;
    itemsExtra?: Array<IActionsMenuItemExtra>;
    toggleActions(open: boolean): void;
    stopEvent(event: any): void;
    run(activity: any): void;
}

ItemActionsMenu.$inject = ['superdesk', 'activityService', 'workflowService', 'archiveService', '$rootScope'];
export function ItemActionsMenu(superdesk, activityService, workflowService, archiveService, $rootScope) {
    return {
        scope: {
            item: '=',
            active: '=',
            itemsExtra: '=',
        },
        templateUrl: 'scripts/apps/monitoring/views/item-actions-menu.html',
        link: function(scope: IScope) {
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
             */
            function getActions(item: IArticle): Array<IAuthoringMenuGroup> {
                let intent = {action: 'list', type: getType(item)};
                let activitiesByGroupName: {[groupName: string]: Array<IActivity>} = {};

                // group activities by `activity.group`
                superdesk.findActivities(intent, item).forEach((activity: IActivity) => {
                    if (workflowService.isActionAllowed(scope.item, activity.action)) {
                        let group = activity.group ?? 'default';

                        if (activitiesByGroupName[group] == null) {
                            activitiesByGroupName[group] = [];
                        }

                        activitiesByGroupName[group].push(activity);
                    }
                });

                let menuGroups: Array<IAuthoringMenuGroup> = [];

                // take default menu groups, add activities and push to `menuGroups`
                AUTHORING_MENU_GROUPS.forEach((_group) => {
                    if (activitiesByGroupName[_group._id]) {
                        let groupCopy: IAuthoringMenuGroup = {..._group};

                        groupCopy.actions = activitiesByGroupName[_group._id];
                        menuGroups.push(groupCopy);
                    }
                });

                // go over `activitiesByGroupName` and add groups not present in default groups (AUTHORING_MENU_GROUPS)
                Object.keys(activitiesByGroupName).forEach((groupName) => {
                    var existingGroup = AUTHORING_MENU_GROUPS.find((g) => g._id === groupName);

                    if (!existingGroup) {
                        menuGroups.push({_id: groupName, label: groupName, actions: activitiesByGroupName[groupName]});
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
