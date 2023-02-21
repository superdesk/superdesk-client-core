import {getAuthoringMenuGroups} from '../../authoring/authoring/constants';
import {IArticle, IAuthoringAction} from 'superdesk-api';
import {IActivity} from 'superdesk-interfaces/Activity';
import {getArticleActionsFromExtensions} from 'core/superdesk-api-helpers';
import {IActivityService} from 'core/activity/activity';

type IAction =
    {kind: 'activity-based'; activity: IActivity} | {kind: 'extension-action'; articleAction: IAuthoringAction};

interface IAuthoringMenuGroup {
    _id: string;
    label?: string;
    concate?: boolean;
    actions?: Array<IAction>;
}

interface IScope extends ng.IScope {
    item?: IArticle;
    open: any;
    active: any;
    allowedActions?: Array<string>;
    menuGroups: Array<IAuthoringMenuGroup>;
    toggleActions(open: boolean): void;
    stopEvent(event: any): void;
    run(activity: any): void;
}

ItemActionsMenu.$inject = ['superdesk', 'activityService', 'workflowService', 'archiveService', '$rootScope'];
export function ItemActionsMenu(
    superdesk,
    activityService: IActivityService,
    workflowService,
    archiveService,
    $rootScope,
) {
    return {
        scope: {
            item: '=',
            active: '=',
            allowedActions: '=?',
        },
        templateUrl: 'scripts/apps/monitoring/views/item-actions-menu.html',
        link: function(scope: IScope) {
            /**
             * Populate scope actions when dropdown is opened.
             *
             * @param {boolean} isOpen
             */
            scope.toggleActions = function(isOpen) {
                getActions(scope.item);

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
            function getActions(item: IArticle): void {
                scope.menuGroups = [];

                const actionsFromExtensions = getArticleActionsFromExtensions(item);
                let intent = {action: 'list', type: getType(item)};
                let activitiesByGroupName: {[groupName: string]: Array<IActivity>} = {};

                // group activities by `activity.group`
                superdesk.findActivities(intent, item).forEach((activity: IActivity) => {
                    if (workflowService.isActionAllowed(scope.item, activity.action)) {
                        let group = activity.group ?? 'default';

                        if (activitiesByGroupName[group] == null) {
                            activitiesByGroupName[group] = [];
                        }
                        if (scope.allowedActions?.length > 0) {
                            if (scope.allowedActions.includes(activity._id)) {
                                activitiesByGroupName[group].push(activity);
                            }
                        } else {
                            activitiesByGroupName[group].push(activity);
                        }
                    }
                });

                let menuGroups: Array<IAuthoringMenuGroup> = [];

                // take default menu groups, add activities and push to `menuGroups`
                getAuthoringMenuGroups().forEach((group) => {
                    if (activitiesByGroupName[group._id] && activitiesByGroupName[group._id].length > 0) {
                        menuGroups.push({
                            _id: group._id,
                            label: group.label,
                            concate: group.concate,
                            actions: activitiesByGroupName[group._id]
                                .map((activity) => ({kind: 'activity-based', activity: activity})),
                        });
                    }
                });

                // go over `activitiesByGroupName` and add groups not present
                // in default groups (getAuthoringMenuGroups)
                Object.keys(activitiesByGroupName).forEach((groupName) => {
                    var existingGroup = getAuthoringMenuGroups().find((g) => g._id === groupName);

                    if (!existingGroup) {
                        menuGroups.push({
                            _id: groupName,
                            label: groupName,
                            actions: activitiesByGroupName[groupName]
                                .map((activity) => ({kind: 'activity-based', activity: activity})),
                        });
                    }
                });

                // actions(except viewing an item) are not allowed for items in legal archive
                if (item._type !== 'legal_archive' && scope.allowedActions == null) {
                    // handle actions from extensions
                    let extensionActionsByGroupName: {[groupName: string]: Array<IAuthoringAction>} = {};

                    for (const action of actionsFromExtensions) {
                        const name = action.groupId ?? 'default';

                        if (extensionActionsByGroupName[name] == null) {
                            extensionActionsByGroupName[name] = [];
                        }

                        extensionActionsByGroupName[name].push(action);
                    }

                    Object.keys(extensionActionsByGroupName).forEach((group) => {
                        const existingGroup = menuGroups.find((_group) => _group._id === group);

                        if (existingGroup == null) {
                            menuGroups.push({
                                _id: group,
                                label: group,
                                actions: extensionActionsByGroupName[group]
                                    .map((articleAction) => ({
                                        kind: 'extension-action',
                                        articleAction: articleAction,
                                    })),
                            });
                        } else {
                            if (existingGroup.actions == null) {
                                existingGroup.actions = [];
                            }

                            existingGroup.actions = existingGroup.actions.concat(
                                extensionActionsByGroupName[group]
                                    .map((articleAction) => ({
                                        kind: 'extension-action',
                                        articleAction: articleAction,
                                    })),
                            );
                        }
                    });
                }

                scope.menuGroups = menuGroups;
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
