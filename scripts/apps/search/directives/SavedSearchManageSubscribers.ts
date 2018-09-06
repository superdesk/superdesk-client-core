import {ISavedSearch, updateSubscribers, unsubscribe, IUserSubscription} from "business-logic/SavedSearch";
import {IDirectiveScope} from "types/Angular/DirectiveScope";
import {IUser} from "business-logic/User";
import {CronTimeInterval} from "types/DataStructures/TimeInterval";

interface IModel {
    userSubscribers: Array<IUser>;
    subscriptionInEditMode?: IUserSubscription;
    currentlySelectedInterval: CronTimeInterval;
    userLookup: Dictionary<IUser['_id'], IUser>;
}

interface IScope extends IDirectiveScope<IModel> {
    savedSearch: ISavedSearch;
    manageSubscriptions(active: boolean): void;
    unsubscribe(user: IUser): Promise<void>;
    editUserSubscription(user: IUser): void;
    handleIntervalChange(cronExpression: CronTimeInterval): void;
    savingEnabled(): boolean;
    saveChanges(): void;
    backToList(): void;
}

SavedSearchManageSubscribers.$inject = ['asset', 'userList', 'api', 'modal', 'gettext'];

export function SavedSearchManageSubscribers(asset, userList, api, modal, gettext) {
    return {
        scope: {
            savedSearch: '=',
            manageSubscriptions: '=',
        },
        templateUrl: asset.templateUrl('apps/search/views/saved-search-manage-subscribers.html'),
        link: function(scope: IScope) {

            const getDefaults = () => ({
                userSubscribers: [],
                subscriptionInEditMode: null,
                currentlySelectedInterval: null,
                userLookup: null,
            });

            scope.wrapper = getDefaults();

            scope.backToList = () => {
                scope.wrapper = {
                    ...scope.wrapper,
                    subscriptionInEditMode: null,
                    currentlySelectedInterval: null,
                };
            };

            scope.saveChanges = () => {
                const nextUserSubscriptions = scope.savedSearch.subscribers.user_subscriptions.map(
                    (subscription) => subscription.user === scope.wrapper.subscriptionInEditMode.user
                        ? {
                            user: scope.wrapper.subscriptionInEditMode.user,
                            scheduling: scope.wrapper.currentlySelectedInterval,
                        }
                        : subscription,
                );

                const nextSubscribers: ISavedSearch['subscribers'] = {
                    ...scope.savedSearch.subscribers,
                    user_subscriptions: nextUserSubscriptions,
                };

                updateSubscribers(scope.savedSearch, nextSubscribers, api).then(scope.backToList);
            };

            scope.handleIntervalChange = (cronExpression: CronTimeInterval) => {
                scope.wrapper.currentlySelectedInterval = cronExpression;
            };

            scope.savingEnabled = () =>
                scope.wrapper.subscriptionInEditMode.scheduling !== scope.wrapper.currentlySelectedInterval;

            scope.unsubscribe = (user: IUser) =>
                modal.confirm(
                    gettext('Are you sure to remove this subscription?'),
                    gettext('Unsubscribe user'),
                ).then(() => {
                    unsubscribe(
                        scope.savedSearch,
                        user._id,
                        api,
                    );
                });

            scope.editUserSubscription = (user: IUser) => {
                scope.wrapper.subscriptionInEditMode = scope.savedSearch.subscribers.user_subscriptions.find(
                    (subscription) => subscription.user === user._id,
                );
            };

            scope.$watch('savedSearch.subscribers', () => {
                if (
                    scope.savedSearch != null
                    && scope.savedSearch.subscribers != null
                    && scope.savedSearch.subscribers.user_subscriptions.length > 0
                ) {
                    userList.getAll().then((users: Array<IUser>) => {
                        scope.wrapper.userLookup = users.reduce((lookUpObj: IModel['userLookup'], user) => {
                            lookUpObj[user._id] = user;
                            return lookUpObj;
                        }, {});

                        scope.wrapper.userSubscribers = scope.savedSearch.subscribers.user_subscriptions.map(
                            (subscription) => users.find((user) => user._id === subscription.user),
                        );
                    });
                } else {
                    scope.wrapper = getDefaults();
                }
            });
        },
    };
}
