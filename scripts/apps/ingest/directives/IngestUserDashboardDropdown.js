IngestUserDashboardDropdown.$inject = ['privileges'];
export function IngestUserDashboardDropdown(privileges) {
    return {
        templateUrl: 'scripts/apps/ingest/views/dashboard/ingest-sources-list.html',
        scope: {
            items: '=',
            setUserPreferences: '&',
        },
        link: function(scope) {
            scope.showIngest = Boolean(privileges.privileges.ingest_providers);
        },
    };
}
