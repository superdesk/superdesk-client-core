
export function RepoDropdown() {
    return {
        scope: {
            activeProvider: '=',
            toggleProvider: '=',
        },
        template: require('../views/repo-dropdown.html'),
        link: (scope) => {
            scope.isActive = (provider) => scope.activeProvider != null ?
                scope.activeProvider._id === provider._id :
                provider._id !== ''; // superdesk has _id ''
        },
    };
}