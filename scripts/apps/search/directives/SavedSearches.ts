import {forEach, clone, filter} from 'lodash';

SavedSearches.$inject = [
    '$rootScope', 'api', 'session', 'modal', 'notify', 'gettext', 'asset',
    '$location', 'desks', 'privileges', 'search', 'savedSearch',
];

interface SavedSearchesScope extends ng.IScope {
    selected: any;
    searchText: any;
    userSavedSearches: any;
    globalSavedSearches: any;
    privileges: any;
    userLookup: any;
    searches: any;
    select: any;
    edit: any;
    filter: any;
    remove: any;
}

export function SavedSearches($rootScope, api, session, modal, notify, gettext, asset, $location,
    desks, privileges, search, savedSearch) : ng.IDirective {
    return {
        templateUrl: asset.templateUrl('apps/search/views/saved-searches.html'),
        scope: {},
        link: function(scope : SavedSearchesScope) {
            var resource = api('saved_searches');

            scope.selected = null;
            scope.searchText = null;
            scope.userSavedSearches = [];
            scope.globalSavedSearches = [];
            scope.privileges = privileges.privileges;
            var originalUserSavedSearches = [];
            var originalGlobalSavedSearches = [];

            desks.initialize()
                .then(() => {
                    scope.userLookup = desks.userLookup;
                });

            function initSavedSearches() {
                savedSearch.getUserSavedSearches(session.identity).then((searches) => {
                    scope.userSavedSearches.length = 0;
                    scope.globalSavedSearches.length = 0;
                    scope.searches = searches;
                    forEach(scope.searches, (savedSearch) => {
                        savedSearch.filter.query = search.setFilters(savedSearch.filter.query);
                        if (savedSearch.user === session.identity._id) {
                            scope.userSavedSearches.push(savedSearch);
                        } else if (savedSearch.is_global) {
                            scope.globalSavedSearches.push(savedSearch);
                        }
                    });
                    originalUserSavedSearches = clone(scope.userSavedSearches);
                    originalGlobalSavedSearches = clone(scope.globalSavedSearches);
                });
            }

            initSavedSearches();

            scope.select = function(search) {
                scope.selected = search;
                $location.search(search.filter.query);
            };

            scope.edit = function(search) {
                scope.select(search);
                $rootScope.$broadcast('edit:search', search);
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

            scope.remove = function(searches) {
                modal.confirm(
                    gettext('Are you sure you want to delete saved search?')
                )
                    .then(() => {
                        resource.remove(searches).then(() => {
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
