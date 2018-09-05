import {ISavedSearch, unsubscribe} from "business-logic/SavedSearch";
import {IDirectiveScope} from "types/Angular/DirectiveScope";
import {IUser} from "business-logic/User";

interface IModel {
    userSubscribers: Array<IUser>;
}

interface IScope extends IDirectiveScope<IModel> {
    savedSearch: ISavedSearch;
    manageSubscriptions(active: boolean): void;
    unsubscribe(user: IUser): Promise<void>;
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

            scope.wrapper = {
                userSubscribers: [],
            };

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

            scope.$watch('savedSearch.subscribers', () => {
                if (
                    scope.savedSearch != null
                    && scope.savedSearch.subscribers != null
                    && scope.savedSearch.subscribers.user_subscriptions.length > 0
                ) {
                    userList.getAll().then((users: Array<IUser>) => {
                        scope.wrapper.userSubscribers = scope.savedSearch.subscribers.user_subscriptions.map(
                            (subscription) => users.find((user) => user._id === subscription.user),
                        );
                    });
                } else {
                    scope.wrapper.userSubscribers = [];
                }
            });
        },
    };
}
