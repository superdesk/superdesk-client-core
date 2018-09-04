import {ISavedSearch} from "business-logic/SavedSearch";
import {IDirectiveScope} from "types/Angular/DirectiveScope";
import {IUser} from "business-logic/User";

interface IModel {
    userSubscribers: Array<IUser>;
}

interface IScope extends IDirectiveScope<IModel> {
    savedSearch: ISavedSearch;
    manageSubscriptions(active: boolean): void;
}

SavedSearchManageSubscribers.$inject = ['asset', 'userList'];

export function SavedSearchManageSubscribers(asset, userList) {
    return {
        scope: {
            savedSearch: '=',
            manageSubscriptions: '=',
        },
        templateUrl: asset.templateUrl('apps/search/views/saved-search-manage-subscribers.html'),
        link: function(scope: IScope) {
            scope.$watch('savedSearch', () => {
                if (
                    scope.savedSearch != null
                    && scope.savedSearch.subscribers != null
                    && scope.savedSearch.subscribers.user_subscriptions.length > 0
                ) {
                    userList.getAll().then((users: Array<IUser>) => {
                        scope.wrapper = {
                            userSubscribers: scope.savedSearch.subscribers.user_subscriptions.map(
                                (subscription) => users.find((user) => user._id === subscription.user),
                            ),
                        };
                    });
                }
            });
        },
    };
}
