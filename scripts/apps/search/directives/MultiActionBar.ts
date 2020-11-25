import _ from 'lodash';
import {IArticleActionBulkExtended} from 'apps/monitoring/MultiActionBarReact';
import {IArticle} from 'superdesk-api';
import {getMultiActions} from '../controllers/get-multi-actions';
import ng from 'core/services/ng';
import {getBulkActions} from '../controllers/get-bulk-actions';

interface IScope extends ng.IScope {
    multi: any;
    display: any;
    type: any;
    activity: any;
    spike: any;
    publish: any;
    state: any;
    toggleDisplay(): void;
    hideMultiActionBar(): void;
    hideMultiActionBar(): void;
    getActions(articles: Array<IArticle>): Array<IArticleActionBulkExtended>;
    isOpenItemType(type: any): boolean;
}

export function isOpenItemType(type) {
    var openItem = ng.get('authoringWorkspace').getItem();

    return openItem && openItem.type === type;
}

MultiActionBar.$inject = [
    'asset',
    'multi',
    'superdesk',
    'keyboardManager',
    'api',
    'archiveService',
];
export function MultiActionBar(
    asset,
    multi,
    superdesk,
    keyboardManager,
    api,
    archiveService,
) {
    return {
        templateUrl: asset.templateUrl('apps/search/views/multi-action-bar.html'),
        scope: true,
        link: function(scope: IScope) {
            const getSelectedItems = () => multi.getItems();
            const unselectAll = () => multi.reset();

            const multiActions = getMultiActions(
                getSelectedItems,
                unselectAll,
            );

            scope.multi = multi;
            scope.display = true;
            scope.$watch(multi.getItems, detectType);

            scope.$watch('multi.count', () => {
                scope.display = true;
            });

            scope.toggleDisplay = () => {
                scope.display = !scope.display;
            };

            scope.hideMultiActionBar = () => {
                scope.display = multi.reset();
            };

            scope.getActions = (articles: Array<IArticle>): Array<IArticleActionBulkExtended> => getBulkActions(
                articles,
                multiActions,
                getSelectedItems,
                unselectAll,
                () => {
                    scope.$apply();
                },
            );

            scope.$on('item:lock', (_e, data) => {
                if (_.includes(multi.getIds(), data.item)) {
                    // locked item is in the selections so update lock info
                    var selectedItems = multi.getItems();

                    _.find(selectedItems, (_item) => _item._id === data.item).lock_user = data.user;
                    detectType(selectedItems);
                }
            });

            scope.$on('item:unlock', (_e, data) => {
                if (multi.getIds().includes(data.item)) {
                    const selectedItems = multi.getItems();

                    // When selected items are unlocked update their lock info and allowed actions
                    api.find('archive', data.item).then((_item) => {
                        const index = selectedItems.findIndex((item) => item._id === _item._id);

                        selectedItems[index] = _.extend(selectedItems[index], _item);
                        detectType(selectedItems);
                    });
                }
            });

            scope.isOpenItemType = isOpenItemType;

            /**
             * Detects type of all selected items and assign it to scope,
             * but only when it's same for all of them.
             *
             * @param {Array} items
             */
            function detectType(items) {
                var types = {};
                var states = [];
                var activities = {};

                angular.forEach(items, (item) => {
                    const type = archiveService.getType(item);

                    types[type] = 1;
                    states.push(item.state);

                    var _activities = superdesk.findActivities({action: 'list', type: type}, item) || [];
                    let allowOnSessionOwnerLock = ['spike'];

                    _activities.forEach((activity) => {
                        // Ignore activities if the item is locked (except those in allowOnSessionOwnerLock)
                        if (!item.lock_user || allowOnSessionOwnerLock.indexOf(activity._id) >= 0) {
                            activities[activity._id] = activities[activity._id] ? activities[activity._id] + 1 : 1;
                        }
                    });
                });

                // keep only activities available for all items
                Object.keys(activities).forEach((activity) => {
                    if (activities[activity] < items.length) {
                        activities[activity] = 0;
                    }
                });

                var typesList = Object.keys(types);

                scope.type = typesList.length === 1 ? typesList[0] : null;
                scope.state = typesList.length === 1 ? states[0] : null;
                scope.activity = activities;
            }

            keyboardManager.bind('ctrl+shift+#', () => {
                if (scope.activity.spike > 0) {
                    multiActions.spikeItems();
                }
            });
        },
    };
}
