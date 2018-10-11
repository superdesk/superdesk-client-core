VersioningHistoryDirective.$inject = [];
export function VersioningHistoryDirective() {
    return {
        templateUrl: 'scripts/apps/authoring/versioning/history/views/history.html',
        scope: {
            item: '=',
        },
    };
}