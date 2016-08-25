SavedSearchSelect.$inject = ['api', 'session', 'savedSearch'];
export function SavedSearchSelect(api, session, savedSearch) {
    return {
        link: function(scope) {
            savedSearch.getUserSavedSearches(session.identity).then(function(res) {
                scope.searches = res;
            });
        }
    };
}
