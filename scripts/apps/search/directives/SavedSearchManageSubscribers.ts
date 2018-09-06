import {ISavedSearch, updateSubscribers, unsubscribe, IUserSubscription} from "business-logic/SavedSearch";
import {IDirectiveScope} from "types/Angular/DirectiveScope";
import {IUser} from "business-logic/User";
import {CronTimeInterval} from "types/DataStructures/TimeInterval";

interface IModel {
    userSubscribers: Array<IUser>;
    subscriptionInCreateOrEditMode?: IUserSubscription;
    currentlySelectedInterval: CronTimeInterval;
    userLookup: Dictionary<IUser['_id'], IUser>;
    users: Array<IUser>;
}

interface IScope extends IDirectiveScope<IModel> {
    savedSearch: ISavedSearch;
    manageSubscriptions(active: boolean): void;
    unsubscribe(user: IUser): Promise<void>;
    editUserSubscription(user: IUser): void;
    handleIntervalChange(cronExpression: CronTimeInterval): void;
    savingEnabled(): boolean;
    saveChanges(): void;
    subscribeUser(user: IUser): void;
    backToList(): void;
}

// server doesn't allow read-only fields in patch request
const removeReadOnlyFields = (subscription: IUserSubscription): IUserSubscription => ({
    user: subscription.user,
    scheduling: subscription.scheduling,
});

SavedSearchManageSubscribers.$inject = ['asset', 'userList', 'api', 'modal', 'gettext'];

export function SavedSearchManageSubscribers(asset, userList, api, modal, gettext) {
    return {
        scope: {
            savedSearch: '=',
            manageSubscriptions: '=',
        },
        templateUrl: asset.templateUrl('apps/search/views/saved-search-manage-subscribers.html'),
        link: function(scope: IScope) {

            const getDefaults = (): IModel => ({
                userSubscribers: [],
                subscriptionInCreateOrEditMode: null,
                currentlySelectedInterval: null,
                userLookup: null,
                users: [],
            });

            scope.wrapper = getDefaults();

            scope.backToList = () => {
                scope.wrapper = {
                    ...scope.wrapper,
                    subscriptionInCreateOrEditMode: null,
                    currentlySelectedInterval: null,
                };
            };

            scope.subscribeUser = (user: IUser) => {
                scope.wrapper.subscriptionInCreateOrEditMode = {
                    user: user._id,
                    scheduling: null,
                };
            };

            scope.saveChanges = () => {
                const {user_subscriptions} = scope.savedSearch.subscribers;

                const alreadySubscribed = user_subscriptions.some(
                    (subscription) => subscription.user === scope.wrapper.subscriptionInCreateOrEditMode.user,
                );

                const nextUserSubscriptions = (
                    alreadySubscribed
                        ? user_subscriptions.map(
                            (subscription) => subscription.user === scope.wrapper.subscriptionInCreateOrEditMode.user
                                ? {
                                    ...scope.wrapper.subscriptionInCreateOrEditMode,
                                    scheduling: scope.wrapper.currentlySelectedInterval,
                                }
                                : subscription,
                        )
                        : user_subscriptions.concat({
                            ...scope.wrapper.subscriptionInCreateOrEditMode,
                            scheduling: scope.wrapper.currentlySelectedInterval,
                        })
                    ).map(removeReadOnlyFields);

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
                scope.wrapper.subscriptionInCreateOrEditMode.scheduling !== scope.wrapper.currentlySelectedInterval;

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
                scope.wrapper.subscriptionInCreateOrEditMode = scope.savedSearch.subscribers.user_subscriptions.find(
                    (subscription) => subscription.user === user._id,
                );
            };

            scope.$watch('savedSearch.subscribers', () => {
                if (
                    scope.savedSearch != null
                ) {
                    if (scope.savedSearch.subscribers == null) {
                        scope.savedSearch.subscribers = {
                            user_subscriptions: [],
                            desk_subscriptions: [],
                        };
                    }

                    userList.getAll().then((users: Array<IUser>) => {
                        scope.wrapper.users = users;
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
