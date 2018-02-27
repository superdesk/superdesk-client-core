
export function RepoDropdown() {
    return {
        scope: {
            providers: '=',
            activeProvider: '=',
            toggleProvider: '=',
        },
        template: require('../views/repo-dropdown.html'),
    };
}