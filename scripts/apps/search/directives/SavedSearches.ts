import {IUser} from 'business-logic/User';
import {IDesk} from 'business-logic/Desk';

import {ISuperdeskGlobalConfig} from 'business-logic/SuperdeskGlobalConfig';
import {ISavedSearch, isUserSubscribedToSavedSearch} from 'business-logic/SavedSearch';
import {IDesksService} from 'types/Services/Desks';
import {IPrivilegesService} from 'types/Services/Privileges';

import {forEach, clone, filter} from 'lodash';

SavedSearches.$inject = [
    '$rootScope', 'api', 'session', 'modal', 'notify', 'gettext', 'asset',
    '$location', 'desks', 'privileges', 'search', 'savedSearch', 'config',
];

interface ISavedSearchesScope extends ng.IScope {
    config: ISuperdeskGlobalConfig;

    searchText: string;
    userSavedSearches: Array<ISavedSearch>;
    globalSavedSearches: Array<ISavedSearch>;
    privileges: IPrivilegesService;
    userLookup: IDesksService['userLookup'];
    searches: Array<ISavedSearch>;
    edit(search: ISavedSearch): void;
    filter(): void;
    remove(search: ISavedSearch): void;

    selected: ISavedSearch;
    select(search: ISavedSearch): void;

    selectedForEditingSubscription: ISavedSearch;
    editSubscription(event: Event, savedSearch: ISavedSearch): void;
    isUserSubscribedToSavedSearch(savedSearch: ISavedSearch, userId: IUser['_id']): boolean;
}

export function SavedSearches($rootScope, api, session, modal, notify, gettext, asset, $location,
    desks, privileges, search, savedSearch, config): ng.IDirective {
    return {
        templateUrl: asset.templateUrl('apps/search/views/saved-searches.html'),
        scope: {},
        link: function(scope: ISavedSearchesScope) {
            const resource = api('saved_searches');

            scope.config = config;

            scope.selected = null;
            scope.searchText = null;
            scope.userSavedSearches = [];
            scope.globalSavedSearches = [];
            scope.privileges = privileges.privileges;
            let originalUserSavedSearches = [];
            let originalGlobalSavedSearches = [];

            desks.initialize()
                .then(() => {
                    scope.userLookup = desks.userLookup;
                });

            function initSavedSearches() {
                savedSearch.getUserSavedSearches(session.identity).then((searches: Array<ISavedSearch>) => {
                    scope.userSavedSearches.length = 0;
                    scope.globalSavedSearches.length = 0;
                    scope.searches = searches;
                    forEach(scope.searches, (_savedSearch: ISavedSearch) => {
                        _savedSearch.filter.query = search.setFilters(_savedSearch.filter.query);
                        if (_savedSearch.user === session.identity._id) {
                            scope.userSavedSearches.push(_savedSearch);
                        } else if (_savedSearch.is_global) {
                            scope.globalSavedSearches.push(_savedSearch);
                        }
                    });
                    originalUserSavedSearches = clone(scope.userSavedSearches);
                    originalGlobalSavedSearches = clone(scope.globalSavedSearches);
                });
            }

            initSavedSearches();

            scope.select = function(_search: ISavedSearch) {
                scope.selected = _search;
                $location.search(_search.filter.query);
            };

            scope.edit = function(_search: ISavedSearch) {
                scope.select(_search);
                $rootScope.$broadcast('edit:search', _search);
            };

            /**
             * Filters the content of global and user filters
             *
             */
            scope.filter = function() {
                scope.userSavedSearches = clone(originalUserSavedSearches);
                scope.globalSavedSearches = clone(originalGlobalSavedSearches);

                if (scope.searchText || scope.searchText !== '') {
                    scope.userSavedSearches = filter(originalUserSavedSearches,
                        (n) => n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0);

                    scope.globalSavedSearches = filter(originalGlobalSavedSearches,
                        (n) => n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0);
                }
            };

            scope.remove = function(_search: ISavedSearch) {
                modal.confirm(
                    gettext('Are you sure you want to delete saved search?'),
                )
                    .then(() => {
                        resource.remove(_search).then(() => {
                            notify.success(gettext('Saved search removed'));
                            initSavedSearches();
                        }, () => {
                            notify.error(gettext('Error. Saved search not deleted.'));
                        });
                    });
            };

            scope.isUserSubscribedToSavedSearch = (_savedSearch: ISavedSearch) => isUserSubscribedToSavedSearch(
                _savedSearch,
                session.identity._id,
                (deskId: IDesk['_id']) => desks.deskLookup[deskId],
            );

            scope.editSubscription = function(event, _savedSearch) {
                event.stopPropagation();
                scope.selectedForEditingSubscription = _savedSearch;
            };
        },
    };
}
