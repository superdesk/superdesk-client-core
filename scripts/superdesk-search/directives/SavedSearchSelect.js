SavedSearchSelect.$inject = ['session', 'savedSearch'];
export function SavedSearchSelect(session, savedSearch) {
    return {
        link: function(scope) {
            savedSearch.getUserSavedSearches(session.identity).then(function(res) {
                scope.searches = res;
            });
        }
    };
}
