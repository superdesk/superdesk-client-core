import {IDesk, IUser, ISuperdeskGlobalConfig} from 'superdesk-api';
import {ISavedSearch, isUserSubscribedToSavedSearch, mapFiltersServerToClient} from '../SavedSearch';
import {IDesksService} from 'types/Services/Desks';
import {IPrivilegesService} from 'types/Services/Privileges';

import {forEach, clone, filter} from 'lodash';
import {mapPredefinedDateFiltersServerToClient} from './DateFilters';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';

SavedSearches.$inject = [
    '$rootScope', 'api', 'session', 'modal', 'notify', 'asset',
    '$location', 'desks', 'privileges', 'savedSearch',
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
    cancelEditingSubscription(event?: Event): void;
    isUserSubscribedToSavedSearch(savedSearch: ISavedSearch, userId: IUser['_id']): boolean;
    userHasPrivileges(privileges: any): boolean;
}

export function SavedSearches($rootScope, api, session, modal, notify, asset, $location,
    desks, privileges, savedSearch): ng.IDirective {
    return {
        templateUrl: asset.templateUrl('apps/search/views/saved-searches.html'),
        scope: {},
        link: function(scope: ISavedSearchesScope) {
            const resource = api('saved_searches');

            scope.config = appConfig;

            scope.selected = null;
            scope.searchText = null;
            scope.userSavedSearches = [];
            scope.globalSavedSearches = [];
            scope.privileges = privileges.privileges;
            scope.userHasPrivileges = privileges.userHasPrivileges;
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
                        mapFiltersServerToClient(_savedSearch);
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
                $location.search(mapPredefinedDateFiltersServerToClient(_search.filter.query));
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

            scope.cancelEditingSubscription = function(event) {
                if (event != null) {
                    event.stopPropagation();
                }
                scope.selectedForEditingSubscription = null;
            };
        },
    };
}
