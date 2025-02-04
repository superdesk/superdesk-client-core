import {
    ISavedSearch,
    updateSubscribers,
    unsubscribeUser,
    unsubscribeDesk,
    IUserSubscription,
    IDeskSubscription,
    isUserSubscribedToSavedSearch,
} from '../SavedSearch';
import {IDirectiveScope} from 'types/Angular/DirectiveScope';
import {IUser, IDesk} from 'superdesk-api';
import {CronTimeInterval} from 'types/DataStructures/TimeInterval';
import {IDesksService} from 'types/Services/Desks';
import {nameof} from 'core/helpers/typescript-helpers';
import {gettext} from 'core/utils';

interface IModel {
    userSubscribers: Array<IUser>;
    subscriptionInCreateOrEditMode?: IUserSubscription | IDeskSubscription;
    currentlySelectedInterval: CronTimeInterval;
    userLookup: Dictionary<IUser['_id'], IUser>;
    users: Array<IUser>;
    desks: IDesksService;
    newSubscriptionFilterText: string;
    modalOpen: boolean;
}

function isUserSubscription(x: IModel['subscriptionInCreateOrEditMode']): x is IUserSubscription {
    return x != null && (x as IUserSubscription).user !== undefined;
}

function isDeskSubscription(x: IModel['subscriptionInCreateOrEditMode']): x is IDeskSubscription {
    return x != null && (x as IDeskSubscription).desk !== undefined;
}

interface IScope extends IDirectiveScope<IModel> {
    savedSearch: ISavedSearch;
    setIsManagingSubscriptions(active: boolean): void;
    onSubscriptionsChange(nextValue: ISavedSearch): void;
    unsubscribeUser(user: IUser): Promise<void>;
    unsubscribeDesk(desk: IDesk): Promise<void>;
    editUserSubscription(user: IUser): void;
    editDeskSubscription(desk: IDesk): void;
    handleIntervalChange(cronExpression: CronTimeInterval): void;
    savingEnabled(): boolean;
    saveChanges(): void;
    subscribeUser(user: IUser): void;
    subscribeDesk(user: IDesk): void;
    backToList(): void;
    getSubscriptionCount(): number;
    editingUserSubscription(): boolean;
    editingDeskSubscription(): boolean;
    usersFilter(user: IUser): boolean;
    desksFilter(desk: IDesk): boolean;
}

SavedSearchManageSubscribers.$inject = ['asset', 'userList', 'api', 'modal', 'desks'];

export function SavedSearchManageSubscribers(asset, userList, api, modal, desks) {
    return {
        scope: {
            savedSearch: '=',
            setIsManagingSubscriptions: '=',
            onSubscriptionsChange: '=',
        },
        templateUrl: asset.templateUrl('apps/search/views/saved-search-manage-subscribers.html'),
        link: function(scope: IScope) {
            const getDefaults = (): IModel => ({
                userSubscribers: [],
                subscriptionInCreateOrEditMode: null,
                currentlySelectedInterval: null,
                userLookup: null,
                users: [],
                desks: desks,
                newSubscriptionFilterText: '',
                modalOpen: false,
            });

            scope.editingUserSubscription = () => isUserSubscription(scope.wrapper.subscriptionInCreateOrEditMode);

            scope.editingDeskSubscription = () => isDeskSubscription(scope.wrapper.subscriptionInCreateOrEditMode);

            scope.usersFilter = (user: IUser) =>
                !isUserSubscribedToSavedSearch(
                    scope.savedSearch,
                    user._id,
                    (deskId: IDesk['_id']) => desks.deskLookup[deskId],
                )
                && (
                    user.display_name.toLowerCase().includes(scope.wrapper.newSubscriptionFilterText.toLowerCase())
                )
                && (scope.savedSearch.is_global === true || user._id === scope.savedSearch.user);

            scope.desksFilter = (desk: IDesk) =>
                scope.savedSearch.is_global === true &&
                desk.name.toLowerCase().includes(scope.wrapper.newSubscriptionFilterText.toLowerCase());

            scope.getSubscriptionCount = () => {
                let count = 0;

                if (scope.savedSearch == null || scope.savedSearch.subscribers == null) {
                    return count;
                }

                if (scope.savedSearch.subscribers.user_subscriptions != null) {
                    count += scope.savedSearch.subscribers.user_subscriptions.length;
                }

                if (scope.savedSearch.subscribers.desk_subscriptions != null) {
                    count += scope.savedSearch.subscribers.desk_subscriptions.length;
                }

                return count;
            };

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

            scope.subscribeDesk = (desk: IDesk) => {
                scope.wrapper.subscriptionInCreateOrEditMode = {
                    desk: desk._id,
                    scheduling: null,
                };
            };

            scope.saveChanges = () => {
                const {user_subscriptions, desk_subscriptions} = scope.savedSearch.subscribers;
                const {subscriptionInCreateOrEditMode} = scope.wrapper;

                let nextUserSubscriptions = scope.savedSearch.subscribers.user_subscriptions;

                if (isUserSubscription(subscriptionInCreateOrEditMode)) {
                    const userAlreadySubscribed = user_subscriptions.some(
                        (subscription) => subscription.user === subscriptionInCreateOrEditMode.user,
                    );

                    nextUserSubscriptions = (
                        userAlreadySubscribed
                            ? user_subscriptions.map(
                                (subscription) => subscription.user === subscriptionInCreateOrEditMode.user
                                    ? {
                                        ...subscriptionInCreateOrEditMode,
                                        scheduling: scope.wrapper.currentlySelectedInterval,
                                    }
                                    : subscription,
                            )
                            : user_subscriptions.concat({
                                ...subscriptionInCreateOrEditMode,
                                scheduling: scope.wrapper.currentlySelectedInterval,
                            })
                    );
                }

                let nextDeskSubscriptions = scope.savedSearch.subscribers.desk_subscriptions;

                if (isDeskSubscription(subscriptionInCreateOrEditMode)) {
                    const deskAlreadySubscribed = desk_subscriptions.some(
                        (subscription) => subscription.desk === subscriptionInCreateOrEditMode.desk,
                    );

                    nextDeskSubscriptions = (
                        deskAlreadySubscribed
                            ? desk_subscriptions.map(
                                (subscription) => subscription.desk === subscriptionInCreateOrEditMode.desk
                                    ? {
                                        ...subscriptionInCreateOrEditMode,
                                        scheduling: scope.wrapper.currentlySelectedInterval,
                                    }
                                    : subscription,
                            )
                            : desk_subscriptions.concat({
                                ...subscriptionInCreateOrEditMode,
                                scheduling: scope.wrapper.currentlySelectedInterval,
                            })
                    );
                }

                const nextSubscribers: ISavedSearch['subscribers'] = {
                    ...scope.savedSearch.subscribers,
                    user_subscriptions: nextUserSubscriptions,
                    desk_subscriptions: nextDeskSubscriptions,
                };

                updateSubscribers(scope.savedSearch, nextSubscribers, api)
                    .then((newSavedSearch: ISavedSearch) => {
                        scope.onSubscriptionsChange(newSavedSearch);
                        scope.backToList();
                    });
            };

            scope.handleIntervalChange = (cronExpression: CronTimeInterval) => {
                scope.wrapper.currentlySelectedInterval = cronExpression;
            };

            scope.savingEnabled = () =>
                scope.wrapper.subscriptionInCreateOrEditMode.scheduling !== scope.wrapper.currentlySelectedInterval;

            scope.unsubscribeUser = (user: IUser) =>
                modal.confirm(
                    gettext('Are you sure to remove this subscription?'),
                    gettext('Unsubscribe user'),
                )
                    .then(() =>
                        unsubscribeUser(scope.savedSearch, user._id, api),
                    )
                    .then((updatedSearch: ISavedSearch) =>
                        scope.onSubscriptionsChange(updatedSearch),
                    );

            scope.unsubscribeDesk = (desk: IDesk) =>
                modal.confirm(
                    gettext('Are you sure to remove this subscription?'),
                    gettext('Unsubscribe desk'),
                )
                    .then(() =>
                        unsubscribeDesk(scope.savedSearch, desk._id, api),
                    )
                    .then((updatedSearch) =>
                        scope.onSubscriptionsChange(updatedSearch),
                    );

            scope.editUserSubscription = (user: IUser) => {
                scope.wrapper.subscriptionInCreateOrEditMode = scope.savedSearch.subscribers.user_subscriptions.find(
                    (subscription) => subscription.user === user._id,
                );
            };

            scope.editDeskSubscription = (desk: IDesk) => {
                scope.wrapper.subscriptionInCreateOrEditMode = scope.savedSearch.subscribers.desk_subscriptions.find(
                    (subscription) => subscription.desk === desk._id,
                );
            };

            scope.$watch(
                nameof<IScope>('savedSearch')
                + '.'
                + nameof<ISavedSearch>('subscribers'),
                () => {
                    if (
                        scope.savedSearch != null
                    ) {
                        scope.wrapper.modalOpen = true;
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

            scope.$watch(
                nameof<IScope>('wrapper')
                + '.'
                + nameof<IModel>('modalOpen'),
                () => {
                    // when modal is closed via ESC key, stop managing subscription so it can be started again.
                    if (!scope.wrapper.modalOpen) {
                        scope.setIsManagingSubscriptions(false);
                    }
                },
            );
        },
    };
}
