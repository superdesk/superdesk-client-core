import {SavedSearch} from 'types/business-logic/SavedSearch';
import {DesksService} from 'types/implementation-details/Services/Desks';
import {PrivilegesService} from 'types/implementation-details/Services/Privileges';

import {forEach, clone, filter} from 'lodash';

SavedSearches.$inject = [
    '$rootScope', 'api', 'session', 'modal', 'notify', 'gettext', 'asset',
    '$location', 'desks', 'privileges', 'search', 'savedSearch',
];

interface SavedSearchesScope extends ng.IScope {
    selected: SavedSearch;
    searchText: string;
    userSavedSearches: Array<SavedSearch>;
    globalSavedSearches: Array<SavedSearch>;
    privileges: PrivilegesService;
    userLookup: DesksService['userLookup'];
    searches: Array<SavedSearch>;
    select(search: SavedSearch): void;
    edit(search: SavedSearch): void;
    filter(): void;
    remove(search: SavedSearch): void;
}

export function SavedSearches($rootScope, api, session, modal, notify, gettext, asset, $location,
    desks, privileges, search, savedSearch): ng.IDirective {
    return {
        templateUrl: asset.templateUrl('apps/search/views/saved-searches.html'),
        scope: {},
        link: function(scope: SavedSearchesScope) {
            const resource = api('saved_searches');

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
                savedSearch.getUserSavedSearches(session.identity).then((searches: Array<SavedSearch>) => {
                    scope.userSavedSearches.length = 0;
                    scope.globalSavedSearches.length = 0;
                    scope.searches = searches;
                    forEach(scope.searches, (_savedSearch: SavedSearch) => {
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

            scope.select = function(_search: SavedSearch) {
                scope.selected = _search;
                $location.search(_search.filter.query);
            };

            scope.edit = function(_search: SavedSearch) {
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

            scope.remove = function(_search: SavedSearch) {
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
        },
    };
}
