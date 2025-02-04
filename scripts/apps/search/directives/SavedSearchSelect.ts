SavedSearchSelect.$inject = ['session', 'savedSearch'];
export function SavedSearchSelect(session, savedSearch) {
    return {
        link: function(scope) {
            savedSearch.getUserSavedSearches(session.identity).then((res) => {
                scope.searches = res;
            });
        },
    };
}
