import {ISavedSearch, updateSubscribers, unsubscribe, IUserSubscription} from "business-logic/SavedSearch";
import {IDirectiveScope} from "types/Angular/DirectiveScope";
import {CronTimeInterval} from "types/DataStructures/TimeInterval";
import {IUser} from "business-logic/User";

interface IScope extends IDirectiveScope<void> {
    savedSearch: ISavedSearch;
    currentlySelectedInterval: CronTimeInterval;
    ownSubscription?: IUserSubscription;
    handleIntervalChange(cronExpression: CronTimeInterval): void;
    closeModal(): void;
    savingEnabled(): void;
    saveOrUpdate(): void;
    unsubscribe(): void;
    cancelEditingSubscription(event?: Event): void;
}

SavedSearchEditOwnSubscription.$inject = ['asset', 'session', 'api'];

export function SavedSearchEditOwnSubscription(asset, session, api) {
    return {
        scope: {
            savedSearch: '=',
            cancelEditingSubscription: '=',
        },
        templateUrl: asset.templateUrl('apps/search/views/saved-search-subscribe.html'),
        link: function(scope: IScope) {

            scope.closeModal = () => {
                scope.cancelEditingSubscription();
            };

            scope.handleIntervalChange = (cronExpression: CronTimeInterval) => {
                scope.currentlySelectedInterval = cronExpression;
            };

            scope.savingEnabled = () => {
                return scope.ownSubscription == null
                    || (scope.ownSubscription.scheduling !== scope.currentlySelectedInterval);
            };

            scope.saveOrUpdate = () => {
                const userId: IUser['_id'] = session.identity._id;

                const nextUserSubscriptions = scope.ownSubscription != null
                    ? scope.savedSearch.subscribers.user_subscriptions.map((subscription) => {
                        if (subscription.user === userId) {
                            return {
                                user: subscription.user,
                                scheduling: scope.currentlySelectedInterval,
                            };
                        } else {
                            return subscription;
                        }
                    })
                    : scope.savedSearch.subscribers.user_subscriptions.concat([{
                            user: userId,
                            scheduling: scope.currentlySelectedInterval,
                        }]);

                const nextSubscribers: ISavedSearch['subscribers'] = {
                    ...scope.savedSearch.subscribers,
                    user_subscriptions: nextUserSubscriptions,
                };

                updateSubscribers(scope.savedSearch, nextSubscribers, api)
                    .then(scope.closeModal);
            };

            scope.unsubscribe = () => unsubscribe(scope.savedSearch, session.identity._id, api).then(scope.closeModal);

            scope.$watch('savedSearch', () => {
                if (scope.savedSearch != null) {
                    if (scope.savedSearch.subscribers == null) {
                        scope.savedSearch.subscribers = {
                            user_subscriptions: [],
                            desk_subscriptions: [],
                        };
                    }

                    scope.ownSubscription = scope.savedSearch.subscribers.user_subscriptions.find(
                        (subscription) => subscription.user === session.identity._id,
                    );
                }
            });
        },
    };
}
