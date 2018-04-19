IngestUserDashboardList.$inject = [];
export function IngestUserDashboardList() {
    return {
        templateUrl: 'scripts/apps/ingest/views/dashboard/ingest-dashboard-widget-list.html',
        scope: {
            items: '=',
            setUserPreferences: '&',
        },
    };
}
