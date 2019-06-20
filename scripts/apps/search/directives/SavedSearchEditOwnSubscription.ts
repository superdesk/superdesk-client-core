import {ISavedSearch, updateSubscribers, unsubscribeUser, IUserSubscription} from '../SavedSearch';
import {IDirectiveScope} from 'types/Angular/DirectiveScope';
import {CronTimeInterval} from 'types/DataStructures/TimeInterval';
import {IUser} from 'superdesk-api';
import {IVocabulary} from 'superdesk-interfaces/Vocabulary';

interface IScope extends IDirectiveScope<void> {
    vocabularies: Array<IVocabulary>;
    savedSearch: ISavedSearch;
    currentlySelectedInterval: CronTimeInterval;
    ownSubscription?: IUserSubscription;
    handleIntervalChange(cronExpression: CronTimeInterval): void;
    closeModal(): void;
    savingEnabled(): boolean;
    isAlreadySubscribed(): boolean;
    unsubscribeUser(): Promise<void>;
    cancelEditingSubscription(): void;
    saveOrUpdate(): void;
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

            scope.savingEnabled = () => scope.ownSubscription == null
                    || (scope.ownSubscription.scheduling !== scope.currentlySelectedInterval);

            scope.isAlreadySubscribed = () => scope.ownSubscription != null;

            scope.saveOrUpdate = () => {
                const userId: IUser['_id'] = session.identity._id;

                const nextUserSubscriptions = scope.isAlreadySubscribed()
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

            scope.unsubscribeUser = () =>
                unsubscribeUser(scope.savedSearch, session.identity._id, api).then(scope.closeModal);

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
