SavedSearches.$inject = [
    '$rootScope', 'api', 'session', 'modal', 'notify', 'gettext', 'asset',
    '$location', 'desks', 'privileges', 'search', 'savedSearch'
];

export function SavedSearches($rootScope, api, session, modal, notify, gettext, asset, $location,
    desks, privileges, search, savedSearch) {
    return {
        templateUrl: asset.templateUrl('apps/search/views/saved-searches.html'),
        scope: {},
        link: function(scope) {
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
                    _.forEach(scope.searches, (savedSearch) => {
                        savedSearch.filter.query = search.setFilters(savedSearch.filter.query);
                        if (savedSearch.user === session.identity._id) {
                            scope.userSavedSearches.push(savedSearch);
                        } else if (savedSearch.is_global) {
                            scope.globalSavedSearches.push(savedSearch);
                        }
                    });
                    originalUserSavedSearches = _.clone(scope.userSavedSearches);
                    originalGlobalSavedSearches = _.clone(scope.globalSavedSearches);
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
                scope.userSavedSearches = _.clone(originalUserSavedSearches);
                scope.globalSavedSearches = _.clone(originalGlobalSavedSearches);

                if (scope.searchText || scope.searchText !== '') {
                    scope.userSavedSearches = _.filter(originalUserSavedSearches,
                        (n) => n.name.toUpperCase().indexOf(scope.searchText.toUpperCase()) >= 0);

                    scope.globalSavedSearches = _.filter(originalGlobalSavedSearches,
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
        }
    };
}
