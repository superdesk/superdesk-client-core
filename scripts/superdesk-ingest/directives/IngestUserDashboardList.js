IngestUserDashboardList.$inject = [];
export function IngestUserDashboardList () {
    return {
        templateUrl: 'scripts/superdesk-ingest/views/dashboard/ingest-dashboard-widget-list.html',
        scope: {
            items: '=',
            setUserPreferences: '&'
        }
    };
}
